import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await prisma.blockedEmail.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const reason = String(body.reason ?? "").trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const existing = await prisma.blockedEmail.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah ada di blocklist" }, { status: 400 });
    }

    const blocked = await prisma.blockedEmail.create({
      data: { email, reason },
    });

    return NextResponse.json({ success: true, data: blocked }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
