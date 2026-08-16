"use client";

import { useState, useMemo } from "react";
import { Key, Tag, User, Calendar, ShieldCheck, Download, Search, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";

interface KeysTableProps {
  initialKeys: any[];
}

export default function KeysTable({ initialKeys }: KeysTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  // Search and Filter Logic
  const filteredKeys = useMemo(() => {
    return initialKeys.filter((k) => {
      const searchStr = search.toLowerCase();
      const keyMatch = k.key.toLowerCase().includes(searchStr);
      const productMatch = k.product?.name?.toLowerCase().includes(searchStr);
      const customerMatch = k.purchase?.customerName?.toLowerCase().includes(searchStr);
      return keyMatch || productMatch || customerMatch;
    });
  }, [initialKeys, search]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentKeys = filteredKeys.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyingId(id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* Controls Area */}
      <div className="admin-toolbar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search keys, products, or customers..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="input"
            style={{ paddingLeft: '40px', height: '44px' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="input"
            style={{ width: '80px', height: '36px', padding: '0 8px', fontSize: '12px' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", borderStyle: 'solid' }}>
        <div className="table-wrapper">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}><Key size={14} style={{ marginRight: "6px" }} /> License Key</th>
                <th><Tag size={14} style={{ marginRight: "6px" }} /> Produk</th>
                <th><User size={14} style={{ marginRight: "6px" }} /> Status / Pembeli</th>
                <th><Calendar size={14} style={{ marginRight: "6px" }} /> Tanggal</th>
                <th style={{ paddingRight: '24px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-muted">
                    <ShieldCheck size={48} style={{ opacity: 0.1, marginBottom: '16px', margin: '0 auto' }} />
                    <p>No matching license keys found.</p>
                  </td>
                </tr>
              ) : (
                currentKeys.map((k: any) => (
                  <tr key={k.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <div className="flex items-center gap-2">
                        <code style={{ 
                          fontFamily: "var(--font-mono)", 
                          fontSize: "12px", 
                          background: k.purchaseId ? 'transparent' : 'var(--accent-glow)',
                          color: k.purchaseId ? "var(--text-muted)" : "var(--accent-green)", 
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: k.purchaseId ? 'none' : '1px solid var(--accent-glow-strong)'
                        }}>
                          {k.key}
                        </code>
                        <button 
                          onClick={() => handleCopy(k.key, k.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          title="Copy Key"
                        >
                          {copyingId === k.id ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", fontWeight: 600 }}>{k.product?.name || "Unknown"}</td>
                    <td>
                      {k.purchase ? (
                        <div className="flex flex-col">
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-bright)" }}>{k.purchase.customerName || "Customer"}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: 'var(--font-mono)' }}>{k.purchase.gatewayOrderId}</span>
                        </div>
                      ) : (
                        <span className={`badge ${k.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                          {k.status}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(k.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ paddingRight: '24px' }}>
                      <div className="flex gap-2">
                        <button className="btn-icon-sm" title="Download Key"><Download size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="admin-pagination" style={{ 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border-subtle)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'var(--bg-surface)'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredKeys.length)} of {filteredKeys.length} keys
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-icon-sm"
                style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ color: 'var(--text-bright)' }}>{currentPage}</span>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text-muted)' }}>{totalPages}</span>
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-icon-sm"
                style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
