import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const POST = auth(async (req: any) => {
  if (req.auth?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, categoryId, price, stock, isActive, features, durationDays, imageUrl } = body;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        price,
        stock,
        isActive,
        features,
        durationDays,
        imageUrl,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Product Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const GET = auth(async (req: any) => {
  if (req.auth?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true,
        _count: {
          select: {
            licenseKeys: {
              where: { purchaseId: null, status: "ACTIVE" }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Map _count to stock field for the UI
    const productsWithRealStock = products.map(p => ({
      ...p,
      stock: p._count.licenseKeys
    }));

    return NextResponse.json(productsWithRealStock);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
