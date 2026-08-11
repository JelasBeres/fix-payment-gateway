import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { method, feePercent, feeFixed, isActive } = await req.json();

  await prisma.paymentConfig.update({
    where: { method: method as any },
    data: { feePercent, feeFixed, isActive },
  });

  return NextResponse.json({ message: "Berhasil diperbarui" });
}
