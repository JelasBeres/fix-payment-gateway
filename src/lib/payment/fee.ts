import { prisma } from "@/lib/prisma";

export interface FeeCalculation {
  amount: number;
  feePercent: number;
  feeFixed: number;
  feeAmount: number;
  grossAmount: number;
}

export async function calculateTopUpFee(
  amount: number,
  method: any
): Promise<FeeCalculation> {
  const config = await prisma.paymentConfig.findUnique({
    where: { method },
  });

  if (!config || !config.isActive) {
    throw new Error("Metode pembayaran tidak tersedia");
  }

  const feePercent = Number(config.feePercent);
  const feeFixed = Number(config.feeFixed);
  const feeFromPercent = Math.ceil((amount * feePercent) / 100);
  const feeAmount = feeFromPercent + feeFixed;
  const grossAmount = amount + feeAmount;

  return {
    amount,
    feePercent,
    feeFixed,
    feeAmount,
    grossAmount,
  };
}

export function getPaymentMethodLabel(method: any): string {
  const labels: Record<string, string> = {
    QRIS: "QRIS",
    BANK_BCA: "Transfer BCA",
    BANK_BNI: "Transfer BNI",
    BANK_MANDIRI: "Transfer Mandiri",
    BANK_BRI: "Transfer BRI",
    DANA: "DANA",
    OVO: "OVO",
    GOPAY: "GoPay",
  };
  return labels[method] ?? method;
}
