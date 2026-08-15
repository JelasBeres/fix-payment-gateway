import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  isWijayaPayConfigured,
  verifySignature,
} from "@/lib/payment/wijayapay";
import {
  expireOrder,
  fulfillPaidOrder,
  mapPaymentMethod,
} from "@/lib/payment/fulfill";

export async function POST(req: NextRequest) {
  if (!isWijayaPayConfigured()) {
    console.error("WijayaPay is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawData = body.data as Record<string, unknown> | undefined;
  const status = String(
    body.status ?? rawData?.status_pembayaran ?? body.status_pembayaran ?? ""
  ).toLowerCase();

  const refId = typeof rawData?.ref_id === "string" ? rawData.ref_id : "";
  const totalDibayar = rawData?.total_dibayar;
  const trxReference =
    typeof rawData?.trx_reference === "string" ? rawData.trx_reference : null;
  const paymentMethod = mapPaymentMethod(
    typeof rawData?.payment_methode === "string" ? rawData.payment_methode : undefined
  );

  if (!refId || totalDibayar === undefined || totalDibayar === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify the request signature when WijayaPay sends it. Always verify ref_id
  // + amount against our records regardless.
  const headerSig = req.headers.get("x-signature");
  if (headerSig && !verifySignature(refId, headerSig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { gatewayOrderId: refId },
    include: { product: true },
  });

  if (purchases.length === 0) {
    return NextResponse.json({ error: "Purchases not found" }, { status: 404 });
  }

  // Anti-tampering: the reported paid amount must match what the customer was
  // actually charged. For customer-fee channels (e.g. QRIS) the gateway adds
  // its fee on top of our nominal, so `total_bayar` from the create response
  // (stored in gatewayPayload) is the source of truth.
  function storedTotalBayar(payload: Prisma.JsonValue | null): number | null {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const v = (payload as Record<string, unknown>).total_bayar;
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    return null;
  }

  const storedTotal = storedTotalBayar(purchases[0].gatewayPayload);
  const expectedTotal =
    storedTotal ??
    Math.round(
      purchases.reduce(
        (sum, p) => sum + Number(p.totalPrice) + Number(p.adminFee ?? 0),
        0
      )
    );
  if (Number(totalDibayar) !== expectedTotal) {
    console.error(
      `Amount mismatch for ${refId}: expected ${expectedTotal}, got ${totalDibayar}`
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  // If all purchases are already final, this is a duplicate notification.
  if (purchases.every((p) => p.status !== "PENDING")) {
    return NextResponse.json({ status: true });
  }

  if (status === "paid") {
    await fulfillPaidOrder(refId, { trxReference, paymentMethod });
  } else if (status === "expired") {
    await expireOrder(refId);
  }

  // Always acknowledge valid notifications so the gateway stops retrying.
  return NextResponse.json({ status: true });
}
