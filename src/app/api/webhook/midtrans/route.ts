import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // 0. Handle Midtrans Dashboard Test
    if (!order_id || order_id.includes("test") || !signature_key) {
      return NextResponse.json({ message: "Test notification received" });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const hash = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // A single order_id can have multiple purchase records (one for each product in cart)
    const purchases = await prisma.purchase.findMany({
      where: { gatewayOrderId: order_id },
      include: { product: true },
    });

    if (purchases.length === 0) {
      return NextResponse.json({ error: "Purchases not found" }, { status: 404 });
    }

    // If all are already processed, skip
    if (purchases.every((p: any) => p.status !== "PENDING")) {
      return NextResponse.json({ message: "Already processed" });
    }

    const isSuccess =
      (transaction_status === "capture" && fraud_status === "accept") ||
      transaction_status === "settlement";

    const isFailed =
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire";

    if (isSuccess) {
      await prisma.$transaction(async (tx: any) => {
        const orderSummary: { productName: string, keys: string[] }[] = [];

        for (const purchase of purchases) {
          if (purchase.status !== "PENDING") continue;

          // 1. Update Purchase Status
          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              status: "SUCCESS",
              gatewayTrxId: body.transaction_id,
              paidAt: new Date(),
            },
          });

          // 2. Assign License Keys
          const availableKeys = await tx.licenseKey.findMany({
            where: {
              productId: purchase.productId,
              status: "ACTIVE",
              purchaseId: null,
            },
            take: purchase.quantity,
          });

          if (availableKeys.length >= purchase.quantity) {
            for (const key of availableKeys) {
              await tx.licenseKey.update({
                where: { id: key.id },
                data: {
                  purchaseId: purchase.id,
                },
              });
            }
            
            // Add to summary for email
            orderSummary.push({
              productName: purchase.product.name,
              keys: availableKeys.map((k: any) => k.key)
            });
          }
        }

        // 3. Send SINGLE Unified Email Notification
        if (orderSummary.length > 0) {
          const { sendMail, generateOrderSuccessEmailHtml } = await import("@/lib/mail");
          const firstPurchase = purchases[0];
          
          try {
            // Get greeting name: use name if it doesn't look like a card number, otherwise use email prefix
            const displayName = firstPurchase.customerName && !/^\d/.test(firstPurchase.customerName) 
              ? firstPurchase.customerName 
              : firstPurchase.customerEmail.split('@')[0];

            await sendMail({
              to: firstPurchase.customerEmail,
              subject: `[SUCCESS] Pesanan #${order_id} - DripClient`,
              html: generateOrderSuccessEmailHtml(
                displayName,
                orderSummary
              ),
            });
          } catch (mailError) {
            console.error("Failed to send consolidated email:", mailError);
          }
        }
      });
    } else if (isFailed) {
      await prisma.purchase.updateMany({
        where: { gatewayOrderId: order_id },
        data: {
          status: transaction_status === "expire" ? "EXPIRED" : "FAILED",
        },
      });
    }

    return NextResponse.json({ message: "OK" });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
