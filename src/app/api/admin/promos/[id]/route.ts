import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, imageUrl, linkUrl, order, isActive } = body;

    const promo = await prisma.promo.update({
      where: { id },
      data: {
        title,
        imageUrl,
        linkUrl,
        order: order !== undefined ? parseInt(order) : undefined,
        isActive,
      },
    });

    return NextResponse.json(promo);
  } catch (err: any) {
    return new NextResponse(err.message || "Failed to update promo", { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.promo.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Promo deleted successfully" });
  } catch (err: any) {
    return new NextResponse(err.message || "Failed to delete promo", { status: 400 });
  }
}
