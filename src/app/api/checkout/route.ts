import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  ADMIN_FEE,
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
  adminFee: z.number().min(0).default(ADMIN_FEE),
});

export async function POST(req: NextRequest) {
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

  const { items, email, name, adminFee } = parsed.data;

  // QRIS (WijayaPay) is the store's QRIS method; "MIDTRANS" opts into the
  // Midtrans Snap (VA bank, e-wallet, kartu, dst).
  const paymentMethod =
    parsed.data.paymentMethod === "MIDTRANS" ? "MIDTRANS" : "QRIS";

  if (paymentMethod === "QRIS" && !isWijayaPayConfigured()) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

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

  const totalAmount = Math.round(productTotal + adminFee);

  const orderId = `INV-${Date.now()}-${nanoid(4)}`;
  const expiredAt = new Date(Date.now() + CHECKOUT_EXPIRY_HOURS * 60 * 60 * 1000);

  // 1. Create Purchase records. The admin fee (Biaya Admin) is charged to the
  //    customer on top of the product total.
  await prisma.$transaction(
    lineItems.map((line) => {
      const product = dbProducts.find((p) => p.id === line.id)!;
      return prisma.purchase.create({
        data: {
          productId: line.id,
          quantity: line.quantity,
          unitPrice: product.price,
          totalPrice: Number(product.price) * line.quantity,
          adminFee,
          status: "PENDING",
          customerEmail: email,
          customerName: name,
          gatewayOrderId: orderId,
          expiredAt,
        },
      });
    })
  );

  // 2. Generate payment via the chosen gateway.
  if (paymentMethod === "MIDTRANS") {
    let snap: MidtransSnapResponse;
    try {
      snap = await createMidtransTransaction({
        orderId,
        totalAmount,
        lineItems,
        dbProducts,
        adminFee,
        name,
        email,
      });
    } catch (error) {
      await cleanupOrphanedPurchases(orderId);
      console.error("Checkout Midtrans Error:", error);
      return NextResponse.json(
        { error: "Gagal terhubung ke payment gateway" },
        { status: 502 }
      );
    }

    // 3. Persist the payment details returned by the gateway.
    await prisma.purchase.updateMany({
      where: { gatewayOrderId: orderId },
      data: {
        paymentUrl: snap.redirect_url,
        gatewayPayload: snap as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      orderId,
      gateway: "midtrans",
      payment: { token: snap.token, redirect_url: snap.redirect_url },
      adminFee,
      expiresAt: expiredAt.toISOString(),
    });
  }

  // QRIS (WijayaPay)
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
    adminFee,
    expiresAt: expiredAt.toISOString(),
  });
}

interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

async function createMidtransTransaction(params: {
  orderId: string;
  totalAmount: number;
  lineItems: { id: string; quantity: number }[];
  dbProducts: { id: string; name: string; price: unknown }[];
  adminFee: number;
  name: string;
  email: string;
}): Promise<MidtransSnapResponse> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  const baseUrl =
    process.env.MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const itemDetails = params.lineItems.map((line) => {
    const product = params.dbProducts.find((p) => p.id === line.id)!;
    return {
      id: product.id,
      price: Number(product.price),
      quantity: line.quantity,
      name: product.name,
    };
  });

  if (params.adminFee > 0) {
    itemDetails.push({
      id: "ADMIN_FEE",
      price: params.adminFee,
      quantity: 1,
      name: "Biaya Layanan Pembayaran",
    });
  }

  const authString = Buffer.from(`${serverKey}:`).toString("base64");
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.round(params.totalAmount),
      },
      item_details: itemDetails,
      customer_details: {
        first_name: params.name,
        email: params.email,
      },
      usage_limit: 1,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.token) {
    console.error("Midtrans Snap Error:", data);
    throw new Error("Gagal terhubung ke payment gateway");
  }

  return { token: data.token, redirect_url: data.redirect_url };
}

async function cleanupOrphanedPurchases(orderId: string) {
  try {
    await prisma.purchase.deleteMany({ where: { gatewayOrderId: orderId } });
  } catch (cleanupError) {
    console.error("Failed to cleanup orphaned purchases:", cleanupError);
  }
}
