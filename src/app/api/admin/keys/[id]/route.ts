import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.licenseKey.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "License key tidak ditemukan" }, { status: 404 });
    }
    if (existing.purchaseId) {
      return NextResponse.json(
        { error: "Key ini sudah terjual (terikat ke order), tidak bisa dihapus" },
        { status: 400 }
      );
    }

    await prisma.licenseKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
