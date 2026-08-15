import { prisma } from "@/lib/prisma";
import type { PaymentMethod } from "@prisma/client";

// Map WijayaPay code_payment to our internal PaymentMethod enum.
export function mapPaymentMethod(code?: string): PaymentMethod | null {
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

// Marks every still-PENDING purchase of an order as SUCCESS, assigns license
// keys atomically, and emails the customer. Idempotent: a PENDING row is only
// claimed once, so concurrent webhooks/polling cannot double-process.
export async function fulfillPaidOrder(
  refId: string,
  opts: { trxReference?: string | null; paymentMethod?: PaymentMethod | null } = {}
) {
  const purchases = await prisma.purchase.findMany({
    where: { gatewayOrderId: refId },
    include: { product: true },
  });

  if (purchases.length === 0) return;

  const { trxReference = null, paymentMethod = null } = opts;

  await prisma.$transaction(async (tx) => {
    const orderSummary: { productName: string; keys: string[] }[] = [];

    for (const purchase of purchases) {
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
}

export async function expireOrder(refId: string) {
  await prisma.purchase.updateMany({
    where: { gatewayOrderId: refId, status: "PENDING" },
    data: { status: "EXPIRED" },
  });
}
