import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch latest 10 successful purchases
    const notifications = await prisma.purchase.findMany({
      where: { 
        status: "SUCCESS"
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { 
        product: { select: { name: true } }
      }
    });

    const unreadCount = await prisma.purchase.count({
      where: { 
        status: "SUCCESS",
        isAdminRead: false
      }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, all } = await req.json();

    if (all) {
      await prisma.purchase.updateMany({
        where: { isAdminRead: false, status: "SUCCESS" },
        data: { isAdminRead: true }
      });
    } else if (id) {
      await prisma.purchase.update({
        where: { id },
        data: { isAdminRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
