import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkStatus, isWijayaPayConfigured } from "@/lib/payment/wijayapay";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isWijayaPayConfigured()) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const refId = req.nextUrl.searchParams.get("ref_id");
  if (!refId) {
    return NextResponse.json({ error: "ref_id required" }, { status: 400 });
  }

  // 1. Trust the local database first (webhook may have already processed it).
  const purchases = await prisma.purchase.findMany({
    where: { gatewayOrderId: refId },
    select: { status: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (purchases.some((p) => p.status !== "PENDING")) {
    const status = purchases[0].status;
    return NextResponse.json({ status: status === "SUCCESS" ? "paid" : status.toLowerCase() });
  }

  // 2. Otherwise ask the gateway for the current status.
  try {
    const { statusPembayaran } = await checkStatus(refId);
    return NextResponse.json({ status: statusPembayaran });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json({ status: "pending", gatewayError: true });
  }
}
