import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const promos = await prisma.promo.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(promos);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch promos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, imageUrl, linkUrl, order, isActive } = body;

    const promo = await prisma.promo.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || "#",
        order: parseInt(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (err: any) {
    return new NextResponse(err.message || "Failed to create promo", { status: 400 });
  }
}
