import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
