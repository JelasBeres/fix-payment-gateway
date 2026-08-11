import { NextResponse } from "next/server";
import { getChannels, isWijayaPayConfigured } from "@/lib/payment/wijayapay";

const FALLBACK_CHANNELS = [
  { group: "QRIS", code: "QRIS", name: "QRIS", image: "", status: "active" },
  { group: "Virtual Account", code: "BCAVA", name: "BCA Virtual Account", image: "", status: "active" },
  { group: "Virtual Account", code: "BNIVA", name: "BNI Virtual Account", image: "", status: "active" },
  { group: "Virtual Account", code: "BRIVA", name: "BRI Virtual Account", image: "", status: "active" },
  { group: "Virtual Account", code: "MANDIRIVA", name: "Mandiri Virtual Account", image: "", status: "active" },
  { group: "Retail", code: "ALFAMART", name: "Alfamart", image: "", status: "active" },
  { group: "Retail", code: "INDOMARET", name: "Indomaret", image: "", status: "active" },
];

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWijayaPayConfigured()) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const channels = await getChannels();
    const methods = channels.map((c) => ({
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
    // Fallback to a curated list so the storefront stays usable if the
    // gateway is briefly unreachable.
    return NextResponse.json({
      methods: FALLBACK_CHANNELS.map((c) => ({
        group: c.group,
        code: c.code,
        name: c.name,
        image: c.image,
        feeAmount: null,
        feePercent: null,
        typeFee: c.code === "QRIS" ? "customer" : "merchant",
      })),
    });
  }
}
