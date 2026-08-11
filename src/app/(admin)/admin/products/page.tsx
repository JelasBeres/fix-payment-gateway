"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Edit2, 
  Zap, 
  Tags, 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye
} from "lucide-react";
import { formatRupiah } from "@/lib/utils/currency";

const ITEMS_PER_PAGE = 10;

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  categoryId: string;
  category: {
    name: string;
  } | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      // Ensure prices are numbers (serialization safety)
      const serializedData = data.map((p: any) => ({
        ...p,
        price: Number(p.price)
      }));
      setProducts(serializedData);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Product removed from inventory");
        setDeleteConfirmId(null);
        fetchProducts();
      } else {
        const msg = await res.text();
        toast.error(msg);
      }
    } catch (err) {
      toast.error("Critical error during deletion");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="fade-in">
        <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Product Inventory</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
              DATABASE_SYNCED ACTIVE NODES: {products.length} <br/>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>INFO:</span> Product stock is now managed automatically by the <span style={{ color: 'var(--warning)' }}>License Vault</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/categories" className="btn btn-outline btn-sm">
              <Tags size={16} /> Categories
            </Link>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={16} /> New Product
            </Link>
          </div>
        </div>

        {/* Toolbar / Search */}
        <div className="card admin-toolbar" style={{ padding: '12px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderStyle: 'solid' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              placeholder="Search products by name, slug, or category..." 
              style={{ height: '40px', paddingLeft: '40px', fontSize: '13px', background: 'var(--bg-primary)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-0" style={{ padding: "0", overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Information</th>
                <th>Category</th>
                <th>Pricing</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Package size={48} />
                      <p>{searchQuery ? "No products match your criteria." : "Inventory is empty."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p: Product) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-4">
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '10px', 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-subtle)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={20} style={{ opacity: 0.2 }} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{p.name}</span>
                          <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/{p.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted" style={{ fontWeight: 600 }}>
                        {p.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {formatRupiah(p.price)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: p.stock === 0 ? 'var(--danger)' : (p.stock <= 5 ? 'var(--warning)' : 'var(--accent-green)') 
                        }}></div>
                        <span style={{ 
                          fontWeight: 700, 
                          color: p.stock === 0 ? "var(--danger)" : (p.stock <= 5 ? "var(--warning)" : "var(--text-primary)") 
                        }}>
                          {p.stock} <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '4px' }}>VAULT</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: '10px' }}>
                        {p.isActive ? "ACTIVE" : "OFFLINE"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/keys?productId=${p.id}`} className="btn-icon-sm" title="Vault" style={{ color: 'var(--warning)' }}>
                          <Zap size={14} />
                        </Link>
                        <Link href={`/admin/products/${p.id}/edit`} className="btn-icon-sm" title="Edit">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => setDeleteConfirmId(p.id)} className="btn-icon-sm text-danger" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="admin-pagination" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Showing <span style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span style={{ color: 'var(--text-primary)' }}>{filteredProducts.length}</span> entries
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0 12px', height: '32px' }}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ minWidth: '32px', height: '32px', padding: '0' }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0 12px', height: '32px' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'rgba(255, 71, 87, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ff4757',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={32} />
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Delete Product?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              You are about to remove this product from the store. This action cannot be undone. <br/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff4757' }}>NOTE: Associated license keys will remain but the product will be gone.</span>
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="btn btn-outline btn-full"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="btn btn-danger btn-full"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="animate-spin" /> : "Remove Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
