import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { checkStatus, isWijayaPayConfigured } from "@/lib/payment/wijayapay";
import { expireOrder, fulfillPaidOrder, mapPaymentMethod } from "@/lib/payment/fulfill";

export const dynamic = "force-dynamic";

// The gateway-reported amount (total_bayar) must match what the customer was
// charged at creation time (stored in gatewayPayload).
function storedTotalBayar(payload: Prisma.JsonValue | null): number | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const v = (payload as Record<string, unknown>).total_bayar;
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

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
    select: { status: true, totalPrice: true, adminFee: true, gatewayPayload: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  if (purchases.some((p) => p.status !== "PENDING")) {
    const status = purchases[0].status;
    return NextResponse.json({ status: status === "SUCCESS" ? "paid" : status.toLowerCase() });
  }

  // 2. Otherwise ask the gateway for the current status. When the gateway
  //    reports the order as paid we fulfill it right away (mark SUCCESS,
  //    assign keys, email the customer) so delivery does not depend solely on
  //    the webhook callback.
  try {
    const { data, statusPembayaran } = await checkStatus(refId);

    if (statusPembayaran === "paid") {
      const storedTotal = storedTotalBayar(purchases[0].gatewayPayload);
      const expectedTotal =
        storedTotal ??
        Math.round(
          purchases.reduce(
            (sum, p) => sum + Number(p.totalPrice) + Number(p.adminFee ?? 0),
            0
          )
        );
      const reported = Number(data.total_bayar);
      if (Number.isFinite(reported) && expectedTotal !== reported) {
        console.error(
          `Amount mismatch for ${refId}: expected ${expectedTotal}, got ${reported}`
        );
        return NextResponse.json({ status: "pending", gatewayError: true });
      }

      await fulfillPaidOrder(refId, {
        trxReference: data.trx_reference,
        paymentMethod: mapPaymentMethod(data.payment_method),
      });
      return NextResponse.json({ status: "paid" });
    }

    if (statusPembayaran === "expired") {
      await expireOrder(refId);
      return NextResponse.json({ status: "expired" });
    }

    return NextResponse.json({ status: statusPembayaran });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json({ status: "pending", gatewayError: true });
  }
}
