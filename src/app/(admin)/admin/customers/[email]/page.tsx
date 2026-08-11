import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils/currency";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  ShoppingBag, 
  CreditCard, 
  Calendar,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Receipt
} from "lucide-react";
import Link from "next/link";

export default async function CustomerDetailPage({ params }: { params: Promise<{ email: string }> }) {
  // Decode email from URL
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const purchases = await prisma.purchase.findMany({
    where: { customerEmail: email },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  if (purchases.length === 0) notFound();

  const customerName = purchases[0].customerName || "Anonymous";
  const totalSpending = purchases
    .filter(p => p.status === "SUCCESS")
    .reduce((acc, curr) => acc + Number(curr.totalPrice), 0);
  
  const successOrders = purchases.filter(p => p.status === "SUCCESS").length;

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/admin/transactions" className="btn btn-outline btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Sales
        </Link>
        <div className="admin-customer-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="admin-customer-avatar" style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <User size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '4px' }}>{customerName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Mail size={14} /> {email}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>TOTAL_SPENT</div>
          <div className="admin-stat-value" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-green)' }}>{formatRupiah(totalSpending)}</div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated lifetime revenue</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>SUCCESS_ORDERS</div>
          <div className="admin-stat-value" style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-bright)' }}>{successOrders} <span style={{ fontSize: '14px', fontWeight: 400 }}>Items</span></div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Completed transactions</div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' }}>MEMBER_SINCE</div>
          <div className="admin-stat-value" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-blue)' }}>
            {new Date(purchases[purchases.length - 1].createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>First interaction recorded</div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="admin-card-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingBag size={20} className="text-primary" /> Purchase History
          </h3>
        </div>
        <div className="table-wrapper">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '32px' }}>INVOICE_ID</th>
                <th>PRODUCT_PURCHASED</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th style={{ paddingRight: '32px' }}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: '32px' }}>
                    <Link href={`/admin/transactions/${p.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <code style={{ fontSize: '11px' }}>{p.gatewayOrderId}</code>
                      <ExternalLink size={10} />
                    </Link>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '14px' }}>{p.product?.name || "Deleted Product"}</td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-green)' }}>{formatRupiah(Number(p.totalPrice))}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'
                    }`} style={{ fontSize: '10px' }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ paddingRight: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
