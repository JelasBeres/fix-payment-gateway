import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, keys } = body;

    if (!productId || !keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "Product ID and at least one key are required" }, { status: 400 });
    }

    const trimmedKeys = keys.map((k: string) => k.trim()).filter((k: string) => k !== "");
    
    // 1. Check for duplicates WITHIN the provided list
    const duplicatesInInput = trimmedKeys.filter((item, index) => trimmedKeys.indexOf(item) !== index);
    const uniqueInputKeys = [...new Set(duplicatesInInput)];
    
    if (uniqueInputKeys.length > 0) {
      return NextResponse.json({ 
        error: `Ada duplikat di daftar input Anda: ${uniqueInputKeys.join(", ")}. Mohon bersihkan dulu.` 
      }, { status: 400 });
    }

    // 2. Check for duplicates AGAINST the database
    const existingKeys = await prisma.licenseKey.findMany({
      where: { key: { in: trimmedKeys } },
      select: { key: true }
    });

    if (existingKeys.length > 0) {
      const existingList = existingKeys.map(k => k.key);
      return NextResponse.json({ 
        error: `Key berikut sudah terdaftar di gudang: ${existingList.join(", ")}. Mohon hapus dari daftar.` 
      }, { status: 400 });
    }

    // 3. Save to database (Safe now)
    const createdKeys = await prisma.licenseKey.createMany({
      data: trimmedKeys.map((k: string) => ({
        key: k,
        productId: productId,
        status: "ACTIVE"
      }))
    });

    return NextResponse.json({ 
      success: true, 
      count: createdKeys.count 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.licenseKey.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(keys);
}
