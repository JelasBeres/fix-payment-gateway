import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      name, 
      slug, 
      description, 
      categoryId, 
      price, 
      stock, 
      isActive, 
      features, 
      durationDays,
      imageUrl 
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        categoryId,
        price,
        stock: Number(stock),
        isActive,
        features,
        durationDays: durationDays ? Number(durationDays) : null,
        imageUrl,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check if product has keys or purchases
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        _count: { 
          select: { 
            licenseKeys: true,
            purchases: true 
          } 
        } 
      }
    });

    // Check system config for force delete mode
    const forceDeleteConfig = await prisma.siteConfig.findUnique({
      where: { key: "ALLOW_FORCE_DELETE" }
    });
    
    const isForceDeleteEnabled = forceDeleteConfig?.value === "true";

    if (!isForceDeleteEnabled && product?._count.purchases && product._count.purchases > 0) {
      return new NextResponse("Cannot delete product with existing purchases. Enable 'Force Delete Mode' in settings if you really want to clean this up.", { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
