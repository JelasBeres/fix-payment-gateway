import { NextResponse } from "next/server";
import { getChannels, isWijayaPayConfigured } from "@/lib/payment/wijayapay";

// QRIS is the only enabled payment method on this store.
const FALLBACK_CHANNELS = [
  { group: "QRIS", code: "QRIS", name: "QRIS", image: "", status: "active" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWijayaPayConfigured()) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const channels = await getChannels();
    const qris = channels.find((c) => c.code === "QRIS");
    if (!qris) throw new Error("QRIS channel is not active");
    const methods = [qris].map((c) => ({
      group: c.group,
      code: c.code,
      name: c.name,
      image: c.image,
      feeAmount: c.fee_amount,
      feePercent: c.fee_percent,
      typeFee: c.type_fee,
    }));
    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Get payment channels error:", error);
    // Fallback so the storefront stays usable if the gateway is briefly
    // unreachable. Checkout always forces QRIS server-side regardless.
    return NextResponse.json({
      methods: FALLBACK_CHANNELS.map((c) => ({
        group: c.group,
        code: c.code,
        name: c.name,
        image: c.image,
        feeAmount: null,
        feePercent: null,
        typeFee: "customer",
      })),
    });
  }
}
