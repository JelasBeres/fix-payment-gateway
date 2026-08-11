import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchases = await prisma.purchase.findMany({
      where: { gatewayOrderId: id },
      include: {
        product: {
          select: {
            name: true,
            imageUrl: true,
          }
        },
        licenseKeys: {
          select: {
            key: true
          }
        }
      }
    });

    if (!purchases || purchases.length === 0) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // SECURITY: Hide keys if order is older than 24 hours
    const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in ms
    const isExpired = purchases[0].paidAt && (new Date().getTime() - new Date(purchases[0].paidAt).getTime() > EXPIRATION_TIME);

    // Transform data to group by order
    const orderData = {
      orderId: id,
      status: purchases[0].status,
      customerName: purchases[0].customerName,
      customerEmail: purchases[0].customerEmail,
      createdAt: purchases[0].createdAt,
      paidAt: purchases[0].paidAt,
      paymentMethod: purchases[0].paymentMethod,
      isExpired,
      items: purchases.map((p: any) => ({
        productName: p.product.name,
        quantity: p.quantity,
        price: Number(p.unitPrice),
        total: Number(p.totalPrice),
        keys: isExpired ? ["HIDDEN_FOR_SECURITY"] : p.licenseKeys.map((k: any) => k.key)
      })),
      grandTotal: purchases.reduce((acc: number, p: any) => acc + Number(p.totalPrice), 0)
    };

    return NextResponse.json(orderData);
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
