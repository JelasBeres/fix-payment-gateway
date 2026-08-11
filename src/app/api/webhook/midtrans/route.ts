import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import type { PaymentMethod, Prisma } from "@prisma/client";

function mapPaymentMethod(
  paymentType?: string,
  body?: Record<string, unknown>
): PaymentMethod | null {
  if (!paymentType) return null;

  switch (paymentType.toLowerCase()) {
    case "qris":
      return "QRIS";
    case "gopay":
      return "GOPAY";
    case "ovo":
      return "OVO";
    case "dana":
      return "DANA";
    case "echannel":
      return "BANK_MANDIRI";
    case "bank_transfer": {
      const vaNumbers = body?.va_numbers;
      const bank =
        Array.isArray(vaNumbers) && vaNumbers.length > 0
          ? String((vaNumbers[0] as Record<string, unknown>)?.bank ?? "").toLowerCase()
          : "";
      if (bank === "bca") return "BANK_BCA";
      if (bank === "bni") return "BANK_BNI";
      if (bank === "bri") return "BANK_BRI";
      return null;
    }
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const str = (v: unknown): string | undefined =>
    typeof v === "string" ? v : undefined;

  const order_id = str(body.order_id);
  const status_code = str(body.status_code);
  const gross_amount = str(body.gross_amount);
  const signature_key = str(body.signature_key);
  const transaction_status = str(body.transaction_status);
  const fraud_status = str(body.fraud_status);
  const payment_type = str(body.payment_type);
  const transaction_id = str(body.transaction_id) ?? null;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("MIDTRANS_SERVER_KEY is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Signature must be validated before any business logic runs.
  if (!order_id || !signature_key || !status_code || !gross_amount) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const hash = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");

  if (hash !== signature_key) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Acknowledge dashboard test notifications, but never process them.
  if (order_id.includes("test")) {
    return NextResponse.json({ message: "Test notification received" });
  }

  const purchases = await prisma.purchase.findMany({
    where: { gatewayOrderId: order_id },
    include: { product: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json({ error: "Purchases not found" }, { status: 404 });
  }

  // Verify the reported amount matches what we charged (anti-tampering).
  const expectedTotal = Math.round(
    purchases.reduce(
      (sum, p) => sum + Number(p.totalPrice) + Number(p.adminFee ?? 0),
      0
    )
  );
  if (Number(gross_amount) !== expectedTotal) {
    console.error(
      `Amount mismatch for ${order_id}: expected ${expectedTotal}, got ${gross_amount}`
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const paymentMethod = mapPaymentMethod(payment_type, body);

  // If all purchases are already final, this is a duplicate notification.
  if (purchases.every((p) => p.status !== "PENDING")) {
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
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderSummary: { productName: string; keys: string[] }[] = [];

      for (const purchase of purchases) {
        // Idempotent transition: only a PENDING row is claimed here, so a
        // concurrent duplicate notification cannot double-process.
        const claimed = await tx.purchase.updateMany({
          where: { id: purchase.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            gatewayTrxId: transaction_id,
            paidAt: new Date(),
            paymentMethod,
          },
        });

        if (claimed.count === 0) continue;

        // Atomic license key assignment. Each key is guarded by
        // `purchaseId: null`, so concurrent orders for the same product can
        // never claim the same key.
        const assignedKeys: string[] = [];
        let assigned = 0;
        let attempts = 0;
        while (assigned < purchase.quantity && attempts < purchase.quantity * 5) {
          attempts++;

          const candidate = await tx.licenseKey.findFirst({
            where: {
              productId: purchase.productId,
              status: "ACTIVE",
              purchaseId: null,
            },
            orderBy: { createdAt: "asc" },
          });

          if (!candidate) break;

          const claimedKey = await tx.licenseKey.updateMany({
            where: { id: candidate.id, purchaseId: null },
            data: {
              purchaseId: purchase.id,
              activatedAt: new Date(),
            },
          });

          if (claimedKey.count === 1) {
            assignedKeys.push(candidate.key);
            assigned++;
          }
        }

        if (assignedKeys.length < purchase.quantity) {
          console.error(
            `Insufficient license keys for product ${purchase.productId} ` +
              `(needed ${purchase.quantity}, got ${assignedKeys.length}). ` +
              `Purchase ${purchase.id} paid but under-filled.`
          );
        }

        if (assignedKeys.length > 0) {
          orderSummary.push({
            productName: purchase.product.name,
            keys: assignedKeys,
          });
        }
      }

      if (orderSummary.length > 0) {
        const { sendMail, generateOrderSuccessEmailHtml } = await import("@/lib/mail");
        const firstPurchase = purchases[0];

        try {
          const displayName =
            firstPurchase.customerName && !/^\d/.test(firstPurchase.customerName)
              ? firstPurchase.customerName
              : firstPurchase.customerEmail.split("@")[0];

          await sendMail({
            to: firstPurchase.customerEmail,
            subject: `[SUCCESS] Pesanan #${order_id} - DripClient`,
            html: generateOrderSuccessEmailHtml(displayName, orderSummary),
          });
        } catch (mailError) {
          console.error("Failed to send consolidated email:", mailError);
        }
      }
    });
  } else if (isFailed) {
    await prisma.purchase.updateMany({
      where: { gatewayOrderId: order_id, status: "PENDING" },
      data: {
        status: transaction_status === "expire" ? "EXPIRED" : "FAILED",
      },
    });
  }

  return NextResponse.json({ message: "OK" });
}
