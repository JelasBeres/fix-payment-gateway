import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  CHECKOUT_EXPIRY_HOURS,
  MAX_QUANTITY_PER_ITEM,
} from "@/lib/payment/constants";
import {
  createTransaction,
  isWijayaPayConfigured,
  WijayaPayError,
} from "@/lib/payment/wijayapay";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
      })
    )
    .min(1)
    .max(20),
  email: z.string().email(),
  name: z.string().min(2).max(120),
  paymentMethod: z.string().min(1).max(50).default("QRIS"),
});

export async function POST(req: NextRequest) {
  if (!isWijayaPayConfigured()) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data pesanan tidak valid" }, { status: 400 });
  }

  const { items, email, name } = parsed.data;

  // Defensive: if the BlockedEmail table is not yet migrated, proceed without blocking.
  let isBlocked = false;
  try {
    const blocked = await prisma.blockedEmail.findUnique({
      where: { email: email.toLowerCase() },
    });
    isBlocked = Boolean(blocked);
  } catch (error) {
    console.warn("Blocklist check skipped:", error);
  }
  if (isBlocked) {
    return NextResponse.json({
      error: "Maaf, pembelian dari email ini tidak dapat diproses. Hubungi kami jika ini sebuah kesalahan.",
    }, { status: 403 });
  }

  // QRIS is the only enabled payment method on this store.
  const paymentMethod = "QRIS";

  // Deduplicate line items: same product is aggregated into a single quantity.
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.id, (merged.get(item.id) ?? 0) + item.quantity);
  }
  const lineItems = Array.from(merged, ([id, quantity]) => ({ id, quantity }));

  const productIds = lineItems.map((i) => i.id);
  const dbProducts = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      _count: {
        select: {
          licenseKeys: {
            where: { purchaseId: null, status: "ACTIVE" },
          },
        },
      },
    },
  });

  if (dbProducts.length !== productIds.length) {
    return NextResponse.json({
      error: "Salah satu produk tidak ditemukan atau sudah tidak aktif",
    }, { status: 404 });
  }

  for (const line of lineItems) {
    const product = dbProducts.find((p) => p.id === line.id)!;
    const availableStock = product._count.licenseKeys;

    // Reserve 1 key to keep the product visible in the catalog.
    if (availableStock - 1 < line.quantity) {
      return NextResponse.json({
        error: `Waduh! Stok "${product.name}" baru saja habis atau tidak mencukupi untuk dipesan (Sisa yang bisa dibeli: ${Math.max(0, availableStock - 1)}).`,
      }, { status: 400 });
    }
  }

  const productTotal = lineItems.reduce((sum, line) => {
    const product = dbProducts.find((p) => p.id === line.id)!;
    return sum + Number(product.price) * line.quantity;
  }, 0);

  const totalAmount = Math.round(productTotal);

  const orderId = `INV-${Date.now()}-${nanoid(4)}`;
  const expiredAt = new Date(Date.now() + CHECKOUT_EXPIRY_HOURS * 60 * 60 * 1000);

  // 1. Create Purchase records. The gateway fee is charged to the merchant
  //    (type_fee=merchant), so the customer pays exactly the product total.
  await prisma.$transaction(
    lineItems.map((line) => {
      const product = dbProducts.find((p) => p.id === line.id)!;
      return prisma.purchase.create({
        data: {
          productId: line.id,
          quantity: line.quantity,
          unitPrice: product.price,
          totalPrice: Number(product.price) * line.quantity,
          adminFee: 0,
          status: "PENDING",
          customerEmail: email,
          customerName: name,
          gatewayOrderId: orderId,
          expiredAt,
        },
      });
    })
  );

  // 2. Call WijayaPay to generate payment.
  let payment;
  try {
    payment = await createTransaction({
      refId: orderId,
      codePayment: paymentMethod,
      nominal: totalAmount,
    });
  } catch (error) {
    await cleanupOrphanedPurchases(orderId);
    if (error instanceof WijayaPayError) {
      console.error("WijayaPay Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("Checkout WijayaPay Error:", error);
    return NextResponse.json({ error: "Gagal terhubung ke payment gateway" }, { status: 502 });
  }

  // 3. Persist the payment details returned by the gateway.
  await prisma.purchase.updateMany({
    where: { gatewayOrderId: orderId },
    data: {
      paymentUrl: payment.qr_image || payment.payment_image || null,
      gatewayTrxId: payment.trx_reference ?? null,
      gatewayPayload: payment as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    orderId,
    payment,
    adminFee: 0,
    expiresAt: expiredAt.toISOString(),
  });
}

async function cleanupOrphanedPurchases(orderId: string) {
  try {
    await prisma.purchase.deleteMany({ where: { gatewayOrderId: orderId } });
  } catch (cleanupError) {
    console.error("Failed to cleanup orphaned purchases:", cleanupError);
  }
}
