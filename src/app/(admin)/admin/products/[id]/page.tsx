import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils/currency";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  Key, 
  ShoppingCart, 
  BarChart3, 
  Plus, 
  History,
  Activity,
  Settings
} from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      category: true,
      _count: {
        select: { 
          licenseKeys: true,
          purchases: { where: { status: "SUCCESS" } }
        }
      }
    }
  });

  if (!product) notFound();

  // Get stock details
  const availableKeys = await prisma.licenseKey.count({
    where: { productId: product.id, purchaseId: null }
  });

  const soldKeys = await prisma.licenseKey.count({
    where: { productId: product.id, purchaseId: { not: null } }
  });

  const recentSales = await prisma.purchase.findMany({
    where: { productId: product.id, status: "SUCCESS" },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/admin/products" className="btn btn-outline btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Products
        </Link>
        <div className="admin-product-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)' }}>{product.name}</h1>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <Layers size={14} /> {product.category.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '14px', fontWeight: 700 }}>
                <Tag size={14} /> {formatRupiah(Number(product.price))}
              </div>
            </div>
          </div>
          <Link href={`/admin/keys/new?productId=${product.id}`} className="btn btn-primary">
            <Plus size={18} /> Add More Keys
          </Link>
        </div>
      </div>

      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>AVAILABLE_STOCK</div>
          <div className="admin-stat-value" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-green)' }}>{availableKeys}</div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Ready for distribution</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>TOTAL_SOLD</div>
          <div className="admin-stat-value" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)' }}>{soldKeys}</div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>License keys delivered</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>SUCCESS_RATE</div>
          <div className="admin-stat-value" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-blue)' }}>
            {soldKeys + availableKeys > 0 ? Math.round((soldKeys / (soldKeys + availableKeys)) * 100) : 0}%
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Conversion performance</div>
        </div>
      </div>

      <div className="admin-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div className="flex flex-col gap-8">
          {/* Performance Overview */}
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={20} className="text-primary" /> Recent Sales History
            </h3>
            <div className="table-wrapper">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>QTY</th>
                    <th>REVENUE</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((s: any) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>{s.customerName || "Anonymous"}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.customerEmail}</span>
                        </div>
                      </td>
                      <td>{s.quantity}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 800 }}>{formatRupiah(Number(s.totalPrice))}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr><td colSpan={4} className="text-center p-8 text-muted">No sales yet for this product.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '1px' }}>PRODUCT_CONFIG</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status</span>
                <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Duration</span>
                <span style={{ fontWeight: 700 }}>{product.durationDays} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Keys</span>
                <span style={{ fontWeight: 700 }}>{product._count.licenseKeys}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--bg-elevated)', border: '1px dashed var(--border-subtle)' }}>
            <div style={{ textAlign: 'center' }}>
              <Activity size={32} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>Inventory Health</div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Monitoring data streams for {product.name}. Stock levels are currently {availableKeys < 5 ? 'CRITICAL' : 'OPTIMAL'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
