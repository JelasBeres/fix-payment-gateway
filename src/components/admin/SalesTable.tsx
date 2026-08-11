"use client";

import { useState, useMemo } from "react";
import { formatRupiah } from "@/lib/utils/currency";
import { Search, Filter, ArrowDownToLine, Receipt, User, Tag, Calendar, Hash, FileSpreadsheet } from "lucide-react";

interface SalesTableProps {
  initialPurchases: any[];
}

export default function SalesTable({ initialPurchases }: SalesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter Logic
  const filteredPurchases = useMemo(() => {
    return initialPurchases.filter((p) => {
      const searchStr = search.toLowerCase();
      const matchesSearch = 
        p.gatewayOrderId?.toLowerCase().includes(searchStr) ||
        p.customerName?.toLowerCase().includes(searchStr) ||
        p.customerEmail?.toLowerCase().includes(searchStr) ||
        p.product?.name?.toLowerCase().includes(searchStr);
      
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [initialPurchases, search, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const currentData = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats for filtered data
  const filteredRevenue = filteredPurchases
    .filter(p => p.status === "SUCCESS")
    .reduce((acc, curr) => acc + Number(curr.totalPrice), 0);

  const filteredOrders = filteredPurchases.filter(p => p.status === "SUCCESS").length;

  // CSV Export
  const exportToCSV = () => {
    const headers = ["Invoice ID", "Customer Name", "Customer Email", "Product", "Quantity", "Total Price", "Status", "Date"];
    const rows = filteredPurchases.map(p => [
      p.gatewayOrderId,
      p.customerName || "Anonymous",
      p.customerEmail,
      p.product?.name || "Deleted Product",
      p.quantity,
      Number(p.totalPrice),
      p.status,
      new Date(p.createdAt).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col">
      {/* Dynamic Summary Cards */}
      <div className="grid-2" style={{ marginBottom: "48px", gap: "20px" }}>
        <div className="card" style={{ 
          padding: '32px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>
              TOTAL SALES (SUCCESS)
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)' }}>
              {filteredOrders.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Orders</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
              // DATA_FILTERED_SUCCESSFULLY
            </div>
          </div>
          <div style={{ color: 'var(--accent-green)', opacity: 0.1 }}>
            <Receipt size={64} strokeWidth={1.5} />
          </div>
        </div>

        <div className="card" style={{ 
          padding: '32px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>
              TOTAL REVENUE
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-green)' }}>
              {formatRupiah(filteredRevenue)}
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              // GROSS_REVENUE_IN_IDR
            </div>
          </div>
          <div style={{ color: 'var(--accent-green)', opacity: 0.1 }}>
            <FileSpreadsheet size={64} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="admin-controls-bar" style={{ 
          padding: '32px 32px 24px 32px', 
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          background: 'var(--bg-surface)'
        }}>
          <div className="flex items-center gap-4 flex-1" style={{ minWidth: '300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input"
                placeholder="Search ID, Customer, or Product..."
                style={{ paddingLeft: '44px', height: '44px' }}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select 
                className="input"
                style={{ paddingLeft: '44px', height: '44px', width: '160px' }}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          <button onClick={exportToCSV} className="btn btn-primary" style={{ height: '44px', paddingLeft: '24px', paddingRight: '24px' }}>
            <ArrowDownToLine size={18} style={{ marginRight: '8px' }} /> Export to CSV
          </button>
        </div>

        <div className="table-wrapper">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}><Hash size={14} style={{ marginRight: '6px' }} /> Invoice</th>
                <th><User size={14} style={{ marginRight: '6px' }} /> Customer</th>
                <th><Tag size={14} style={{ marginRight: '6px' }} /> Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ paddingRight: '24px' }}><Calendar size={14} style={{ marginRight: '6px' }} /> Date</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-muted">No sales records match your filters.</td>
                </tr>
              ) : (
                currentData.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.gatewayOrderId}</code>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>{p.customerName || "Anonymous"}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.customerEmail}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: 600 }}>{p.product?.name || "Deleted Product"}</td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-green)' }}>{formatRupiah(Number(p.totalPrice))}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Qty: {p.quantity}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === "SUCCESS" ? "badge-success" :
                        p.status === "PENDING" ? "badge-warning" :
                        "badge-danger"
                      }`} style={{ fontSize: '10px' }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ paddingRight: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(p.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Advanced Pagination */}
        <div className="admin-pagination" style={{ 
          padding: '20px 32px', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing <span style={{ color: 'var(--text-bright)' }}>{currentData.length}</span> of <span style={{ color: 'var(--text-bright)' }}>{filteredPurchases.length}</span> records
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ padding: '8px 16px', fontSize: '12px' }}
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Previous
            </button>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minWidth: '100px',
              height: '36px',
              background: 'var(--bg-primary)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--accent-green)'
            }}>
              PAGE {currentPage} / {totalPages || 1}
            </div>

            <button 
              className="btn btn-outline btn-sm"
              style={{ padding: '8px 16px', fontSize: '12px' }}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
