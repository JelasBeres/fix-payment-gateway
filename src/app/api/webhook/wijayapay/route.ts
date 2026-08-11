import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PaymentMethod, Prisma } from "@prisma/client";
import {
  isWijayaPayConfigured,
  verifySignature,
} from "@/lib/payment/wijayapay";

// Map WijayaPay code_payment to our internal PaymentMethod enum.
function mapPaymentMethod(code?: string): PaymentMethod | null {
  switch (code?.toUpperCase()) {
    case "QRIS":
      return "QRIS";
    case "BCAVA":
      return "BANK_BCA";
    case "BNIVA":
      return "BANK_BNI";
    case "BRIVA":
      return "BANK_BRI";
    case "MANDIRIVA":
      return "BANK_MANDIRI";
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isWijayaPayConfigured()) {
    console.error("WijayaPay is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawData = body.data as Record<string, unknown> | undefined;
  const status = String(
    body.status ?? rawData?.status_pembayaran ?? body.status_pembayaran ?? ""
  ).toLowerCase();

  const refId = typeof rawData?.ref_id === "string" ? rawData.ref_id : "";
  const totalDibayar = rawData?.total_dibayar;
  const trxReference =
    typeof rawData?.trx_reference === "string" ? rawData.trx_reference : null;
  const paymentMethod = mapPaymentMethod(
    typeof rawData?.payment_methode === "string" ? rawData.payment_methode : undefined
  );

  if (!refId || totalDibayar === undefined || totalDibayar === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify the request signature when WijayaPay sends it. Always verify ref_id
  // + amount against our records regardless.
  const headerSig = req.headers.get("x-signature");
  if (headerSig && !verifySignature(refId, headerSig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { gatewayOrderId: refId },
    include: { product: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json({ error: "Purchases not found" }, { status: 404 });
  }

  // Anti-tampering: the reported paid amount must match what the customer was
  // actually charged. For customer-fee channels (e.g. QRIS) the gateway adds
  // its fee on top of our nominal, so `total_bayar` from the create response
  // (stored in gatewayPayload) is the source of truth.
  function storedTotalBayar(payload: Prisma.JsonValue | null): number | null {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const v = (payload as Record<string, unknown>).total_bayar;
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    return null;
  }

  const storedTotal = storedTotalBayar(purchases[0].gatewayPayload);
  const expectedTotal =
    storedTotal ??
    Math.round(
      purchases.reduce(
        (sum, p) => sum + Number(p.totalPrice) + Number(p.adminFee ?? 0),
        0
      )
    );
  if (Number(totalDibayar) !== expectedTotal) {
    console.error(
      `Amount mismatch for ${refId}: expected ${expectedTotal}, got ${totalDibayar}`
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  // If all purchases are already final, this is a duplicate notification.
  if (purchases.every((p) => p.status !== "PENDING")) {
    return NextResponse.json({ status: true });
  }

  if (status === "paid") {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderSummary: { productName: string; keys: string[] }[] = [];

      for (const purchase of purchases) {
        // Idempotent transition: only a PENDING row is claimed here, so a
        // concurrent duplicate notification cannot double-process.
        const claimed = await tx.purchase.updateMany({
          where: { id: purchase.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            gatewayTrxId: trxReference,
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
            subject: `[SUCCESS] Pesanan #${refId} - DripClient`,
            html: generateOrderSuccessEmailHtml(displayName, orderSummary),
          });
        } catch (mailError) {
          console.error("Failed to send consolidated email:", mailError);
        }
      }
    });
  } else if (status === "expired") {
    await prisma.purchase.updateMany({
      where: { gatewayOrderId: refId, status: "PENDING" },
      data: { status: "EXPIRED" },
    });
  }

  // Always acknowledge valid notifications so the gateway stops retrying.
  return NextResponse.json({ status: true });
}
