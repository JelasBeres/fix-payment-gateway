import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils/currency";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Mail, 
  Package, 
  CreditCard,
  Hash,
  Calendar,
  Key
} from "lucide-react";
import Link from "next/link";

import PrintButton from "@/components/admin/PrintButton";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { 
      product: true,
      licenseKeys: true
    }
  });

  if (!purchase) notFound();

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Nav */}
      <div className="admin-page-header" style={{ marginBottom: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/admin/transactions" className="btn btn-outline btn-sm">
          <ArrowLeft size={16} /> Back to Transactions
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <PrintButton />
        </div>
      </div>

      <div className="admin-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Main Content */}
        <div className="flex flex-col gap-8">
          
          {/* Invoice Card */}
          <div className="card" style={{ padding: '40px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
            {/* Watermark Status */}
            <div className="admin-invoice-watermark" style={{ 
              position: 'absolute', 
              top: '40px', 
              right: '40px', 
              opacity: 0.1, 
              transform: 'rotate(-15deg)',
              fontSize: '80px',
              fontWeight: 900,
              pointerEvents: 'none'
            }}>
              {purchase.status}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '8px' }}>INVOICE</h1>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>#{purchase.gatewayOrderId}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-bright)' }}>DRIPCLIENT ADMIN</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automated License Distribution</div>
              </div>
            </div>

            <div className="admin-invoice-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>CUSTOMER_INFO</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <User size={16} className="text-muted" />
                  <span style={{ fontWeight: 700 }}>{purchase.customerName || "Anonymous"}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={16} className="text-muted" />
                  <span style={{ color: 'var(--text-secondary)' }}>{purchase.customerEmail}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '12px' }}>TRANSACTION_DETAILS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Calendar size={16} className="text-muted" />
                  <span>{new Date(purchase.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CreditCard size={16} className="text-muted" />
                  <span>{purchase.paymentMethod || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div style={{ marginBottom: '60px' }}>
              <div className="admin-invoice-items-header" style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                <span>PRODUCT_NAME</span>
                <div style={{ display: 'flex', gap: '60px' }}>
                  <span>QTY</span>
                  <span>PRICE</span>
                  <span style={{ minWidth: '100px', textAlign: 'right' }}>TOTAL</span>
                </div>
              </div>
              <div className="admin-invoice-item-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                    <Package size={24} className="text-primary" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{purchase.product?.name || "Deleted Product"}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration: {purchase.product?.durationDays} Days</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                  <span>{purchase.quantity}</span>
                  <span>{formatRupiah(Number(purchase.unitPrice))}</span>
                  <span style={{ minWidth: '100px', textAlign: 'right', fontWeight: 900, fontSize: '18px', color: 'var(--accent-green)' }}>
                    {formatRupiah(Number(purchase.totalPrice))}
                  </span>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="admin-invoice-totals" style={{ borderTop: '2px solid var(--border-subtle)', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '40px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span style={{ minWidth: '100px', textAlign: 'right' }}>{formatRupiah(Number(purchase.totalPrice))}</span>
              </div>
              <div style={{ display: 'flex', gap: '40px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Tax / Fees</span>
                <span style={{ minWidth: '100px', textAlign: 'right' }}>Rp 0</span>
              </div>
              <div style={{ display: 'flex', gap: '40px', fontSize: '24px', fontWeight: 950, color: 'var(--text-bright)', marginTop: '12px' }}>
                <span>TOTAL</span>
                <span style={{ minWidth: '100px', textAlign: 'right', color: 'var(--accent-green)' }}>{formatRupiah(Number(purchase.totalPrice))}</span>
              </div>
            </div>
          </div>

          {/* License Keys Card */}
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Key size={20} className="text-primary" /> License Keys Delivered
            </h3>
            <div className="flex flex-col gap-4">
              {purchase.licenseKeys.map((k: any) => (
                <div key={k.id} className="admin-key-item" style={{ 
                  padding: '20px', 
                  background: 'var(--bg-elevated)', 
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <code style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '1px' }}>{k.key}</code>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>{k.status}</span>
                  </div>
                </div>
              ))}
              {purchase.licenseKeys.length === 0 && (
                <div className="p-8 text-center text-muted" style={{ fontSize: '14px' }}>
                  No keys associated with this purchase.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-8">
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '1px' }}>SYSTEM_STATUS</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '8px', 
                  borderRadius: '50%', 
                  background: purchase.status === 'SUCCESS' ? 'rgba(0,255,128,0.1)' : 'rgba(255,160,0,0.1)',
                  color: purchase.status === 'SUCCESS' ? 'var(--accent-green)' : 'var(--warning)'
                }}>
                  {purchase.status === 'SUCCESS' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>Order {purchase.status}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(purchase.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', background: 'rgba(0,128,255,0.1)', color: 'var(--accent-blue)' }}>
                  <Hash size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>Gateway ID</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{purchase.gatewayTrxId || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: 'var(--bg-elevated)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '16px' }}>Need Help?</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              If there's an issue with this transaction, you can manually manage the license keys or issue a refund via the payment gateway.
            </p>
            <button className="btn btn-outline btn-full btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <AlertCircle size={14} /> Report Issue
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .admin-sidebar, .admin-top-bar, .btn, .sidebar-info, .license-keys-card { display: none !important; }
          .admin-main-content { padding: 0 !important; margin: 0 !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          body { background: white !important; color: black !important; }
          .fade-in { padding: 0 !important; }
        }
      `}} />
    </div>
  );
}
