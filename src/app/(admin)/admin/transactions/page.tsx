import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SalesTable from "@/components/admin/SalesTable";

export const metadata: Metadata = { title: "Riwayat Penjualan | DripClient" };

export default async function AdminTransactionsPage() {
  const purchases = await prisma.purchase.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal values for Client Component
  const serializedPurchases = purchases.map((p: any) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    totalPrice: Number(p.totalPrice),
    product: p.product ? {
      ...p.product,
      price: Number(p.product.price)
    } : null
  }));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Sales History</h1>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          // FINANCIAL_REPORTS // SYNC_STATUS: STABLE
        </p>
      </div>

      <SalesTable initialPurchases={serializedPurchases} />
    </div>
  );
}
