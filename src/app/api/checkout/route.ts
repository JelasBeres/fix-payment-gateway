import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === "true" 
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, email, name, adminFee = 0 } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }

    // 1. Fetch products and calculate total
    const productIds = items.map((i: any) => i.id);
    const dbProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true
      },
      include: {
        _count: {
          select: {
            licenseKeys: {
              where: { purchaseId: null, status: "ACTIVE" }
            }
          }
        }
      }
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Salah satu produk tidak ditemukan atau sudah tidak aktif" }, { status: 404 });
    }

    // 1.1 Verify Stock availability
    for (const item of items) {
      const product = dbProducts.find((p: any) => p.id === item.id);
      if (!product) continue;
      
      const availableStock = product._count.licenseKeys;
      // Reserve 1 key to keep product visible in catalog
      if (availableStock - 1 < item.quantity) {
        return NextResponse.json({ 
          error: `Waduh! Stok "${product.name}" baru saja habis atau tidak mencukupi untuk dipesan (Sisa yang bisa dibeli: ${Math.max(0, availableStock - 1)}).` 
        }, { status: 400 });
      }
    }

    let totalAmount = 0;
    const itemDetails = items.map((item: any) => {
      const product = dbProducts.find((p: any) => p.id === item.id)!;
      totalAmount += Number(product.price) * item.quantity;
      return {
        id: product.id,
        price: Number(product.price),
        quantity: item.quantity,
        name: product.name,
      };
    });

    // Add admin fee to item details and total
    if (adminFee > 0) {
      totalAmount += adminFee;
      itemDetails.push({
        id: "ADMIN_FEE",
        price: adminFee,
        quantity: 1,
        name: "Biaya Layanan Pembayaran",
      });
    }

    const orderId = `INV-${Date.now()}-${nanoid(4)}`;

    // 2. Create Purchase records
    await prisma.$transaction(
      items.map((item: any) => {
        const product = dbProducts.find((p: any) => p.id === item.id)!;
        return prisma.purchase.create({
          data: {
            productId: item.id,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: Number(product.price) * item.quantity,
            status: "PENDING",
            customerEmail: email,
            customerName: name,
            gatewayOrderId: orderId,
          }
        });
      })
    );

    // 3. Call Midtrans Snap API
    const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(totalAmount),
      },
      item_details: itemDetails,
      customer_details: {
        first_name: name,
        email: email,
      },
      usage_limit: 1,
    };

    const midtransRes = await fetch(MIDTRANS_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(midtransBody),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok) {
      console.error("Midtrans Error:", midtransData);
      throw new Error("Gagal terhubung ke payment gateway");
    }

    // 4. Update the purchases with the payment URL
    await prisma.purchase.updateMany({
      where: { gatewayOrderId: orderId },
      data: { paymentUrl: midtransData.redirect_url }
    });

    return NextResponse.json({ 
      orderId, 
      paymentUrl: midtransData.redirect_url,
      token: midtransData.token 
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
