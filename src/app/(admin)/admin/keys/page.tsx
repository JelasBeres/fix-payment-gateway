import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import KeysTable from "@/components/admin/KeysTable";
import Link from "next/link";

export const metadata: Metadata = { title: "Vault License Keys | DripClient" };

export default async function AdminKeysPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const { productId } = await searchParams;

  const keys = await prisma.licenseKey.findMany({
    where: productId ? { productId } : {},
    include: {
      product: true,
      purchase: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get product name if filtering
  let filteredProductName = "";
  if (productId && keys.length > 0) {
    filteredProductName = keys[0].product?.name || "Target Product";
  } else if (productId) {
    const p = await prisma.product.findUnique({ where: { id: productId } });
    filteredProductName = p?.name || "Product";
  }

  const active = keys.filter((k: any) => k.status === "ACTIVE" && !k.purchaseId).length;
  const sold = keys.filter((k: any) => k.purchaseId).length;

  const serializedKeys = keys.map((key: any) => ({
    ...key,
    product: key.product ? {
      ...key.product,
      price: Number(key.product.price)
    } : null,
    purchase: key.purchase ? {
      ...key.purchase,
      unitPrice: Number(key.purchase.unitPrice),
      totalPrice: Number(key.purchase.totalPrice)
    } : null
  }));

  return (
    <div className="fade-in">
      <div className="admin-page-header" style={{ marginBottom: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Vault License Keys</h1>
          <div className="admin-keys-header-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              // ENCRYPTED_STORAGE // ACTIVE_NODES: {keys.length}
            </p>
            {productId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border-subtle)' }}>
                <span className="badge badge-primary" style={{ fontSize: '10px' }}>FILTERED: {filteredProductName}</span>
                <Link href="/admin/keys" style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700, textDecoration: 'none' }}>[ SHOW ALL ]</Link>
              </div>
            )}
          </div>
        </div>
        <div className="admin-keys-actions" style={{ display: "flex", gap: "12px" }}>
          <div className="flex gap-2">
            <span className="badge badge-success" style={{ padding: '8px 12px' }}>{active} READY</span>
            <span className="badge badge-muted" style={{ padding: '8px 12px' }}>{sold} SOLD</span>
          </div>
        </div>
      </div>

      <KeysTable initialKeys={serializedKeys} />
    </div>
  );
}
