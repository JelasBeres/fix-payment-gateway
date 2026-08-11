import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils/currency";
import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertCircle,
  Clock,
  ExternalLink,
  Activity,
  ArrowRight
} from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard | DripClient" };

export default async function AdminDashboard() {
  const [totalProducts, totalRevenue, recentPurchases, allActiveProducts] = await Promise.all([
    prisma.product.count(),
    prisma.purchase.aggregate({
      where: { status: "SUCCESS" },
      _sum: { totalPrice: true },
    }),
    prisma.purchase.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        _count: {
          select: { licenseKeys: { where: { purchaseId: null } } }
        }
      }
    })
  ]);

  // Logic: Identify critical stock based on ACTUAL available keys
  const lowStockProducts = allActiveProducts
    .map(p => ({
      ...p,
      actualStock: p._count.licenseKeys
    }))
    .filter(p => p.actualStock <= 10)
    .sort((a, b) => a.actualStock - b.actualStock)
    .slice(0, 6);

  const revenue = Number(totalRevenue._sum.totalPrice ?? 0);
  const totalSales = await prisma.purchase.count({ where: { status: "SUCCESS" } });

  const stats = [
    { label: "Gross Revenue", value: formatRupiah(revenue), icon: <TrendingUp size={24} />, color: "var(--accent-green)", trend: "+12.5%" },
    { label: "Successful Orders", value: totalSales.toString(), icon: <ShoppingCart size={24} />, color: "var(--accent-green)", trend: "+8.2%" },
    { label: "Active Inventory", value: totalProducts.toString(), icon: <Package size={24} />, color: "var(--text-primary)", trend: "Stable" },
    { label: "System Health", value: "99.9%", icon: <Activity size={24} />, color: "var(--accent-green)", trend: "Optimal" },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>

      {/* Header Section */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          System Overview
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
            DASHBOARD_LIVE_FEED | SYNC: 100%
          </span>
        </div>
      </div>

      {/* Stats Grid - Cyber-Glass Design */}
      <div className="admin-stats-grid">
        {stats.map((s: any) => (
          <div key={s.label} className="card-cyber">
            <div className="card-cyber-glow" style={{ background: s.color }}></div>
            <div className="card-cyber-content">
              <div className="flex justify-center md:justify-between items-start mb-0 md:mb-6 w-full md:w-auto">
                <div className="card-cyber-icon" style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  {s.icon}
                </div>
                <div className="card-cyber-trend hidden md:flex" style={{ color: s.color, background: `${s.color}10`, borderColor: `${s.color}30` }}>
                  {s.trend}
                </div>
              </div>
              <div className="card-info-wrapper">
                <div className="card-cyber-label">{s.label}</div>
                <div className="card-cyber-value">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-10">

        <div className="card p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                  <Clock className="text-[var(--accent-green)]" size={24} />
                  Recent Operations
                </h2>
                <p className="text-[var(--text-muted)] text-xs mt-1 mb-2">Latest activity from your customers</p>
              </div>
              <Link href="/admin/transactions" className="btn-modern-sm">
                VIEW LOGS <ArrowRight size={14} />
              </Link>

            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>INVOICE</th>
                  <th>CUSTOMER</th>
                  <th>PRODUCT</th>
                  <th>REVENUE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Activity size={48} />
                        <p>No recent activity detected.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentPurchases.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <code className="admin-code" style={{ fontSize: '11px' }}>{p.gatewayOrderId?.substring(0, 8)}</code>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-bright)' }}>{p.customerName || "Anonymous"}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.customerEmail}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{p.product?.name || "Terminated Item"}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 900, color: 'var(--accent-green)', fontSize: '14px' }}>
                          {formatRupiah(Number(p.totalPrice))}
                        </span>
                      </td>
                      <td>
                        {p.status === "SUCCESS" ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(0,255,128,0.1)', color: 'var(--accent-green)', fontSize: '10px', fontWeight: 800 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                            SUCCESS
                          </div>
                        ) : p.status === "PENDING" ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,160,0,0.1)', color: 'var(--accent-warning)', fontSize: '10px', fontWeight: 800 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-warning)' }}></span>
                            PENDING
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontSize: '10px', fontWeight: 800 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b30' }}></span>
                            {p.status}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Inventory Management */}
        <div className="admin-dashboard-sidebar" style={{ paddingTop: '40px' }}>
          <div className="card p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <AlertCircle size={24} className={lowStockProducts.length > 0 ? "text-[var(--warning)]" : "text-[var(--text-muted)]"} />
                    Stock Monitoring
                  </h2>
                  <p className="text-[var(--text-muted)] text-xs mt-1 mb-2">Real-time inventory levels</p>
                </div>
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>CATEGORY</th>
                    <th style={{ textAlign: 'center' }}>STOCK</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '48px' }}>
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <Package size={48} />
                          <p>All nodes operating at nominal levels.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-bright)' }}>{p.name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.category?.name || "Uncategorized"}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="admin-stock-count" style={{
                              background: p.actualStock <= 3 ? 'rgba(255,59,48,0.1)' : 'rgba(255,160,0,0.1)',
                              color: p.actualStock <= 3 ? '#ff3b30' : 'var(--accent-warning)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 900
                            }}>
                              {p.actualStock}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/admin/keys?productId=${p.id}`} className="btn-modern-xs" style={{ display: 'inline-flex', marginLeft: 'auto' }}>
                            REFRESH VAULT <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Control Center - Extra Bold Aesthetic */}
          <div className="card p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-green)]/10 border-2 border-[var(--accent-green)]/20 flex items-center justify-center text-[var(--accent-green)] shadow-[0_0_20px_rgba(0,255,128,0.05)]">
                  <Activity size={28} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-[11px] font-[900] text-[var(--accent-green)] tracking-[0.3em] uppercase mb-1">Control Center</h3>
                  <h2 className="text-2xl font-[900] text-white tracking-tighter leading-none">SYSTEM_OPERATIONS</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full lg:w-auto">
                <Link href="/admin/products/new" className="btn-modern flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 sm:px-8 py-3 sm:py-4 bg-[var(--accent-green)] text-black hover:bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(0,255,128,0.2)]">
                  <Package size={18} strokeWidth={3} className="sm:w-5 sm:h-5" />
                  <span className="font-[900] text-[10px] sm:text-sm tracking-tighter font-bold text-center">NEW_ENTITY</span>
                </Link>
                <Link href="/admin/categories" className="btn-modern flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 sm:px-8 py-3 sm:py-4 border-2 border-[var(--border-subtle)] text-white hover:bg-white/5 transition-all duration-300">
                  <TrendingUp size={18} strokeWidth={3} className="sm:w-5 sm:h-5" />
                  <span className="font-[900] text-[10px] sm:text-sm tracking-tighter font-bold text-center">CATEGORIES</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
