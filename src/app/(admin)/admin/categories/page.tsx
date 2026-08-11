"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, Tags, Package, ShieldCheck, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingId ? "Category updated successfully!" : "Category created successfully!");
        setShowModal(false);
        setEditingId(null);
        setForm({ name: "", slug: "", description: "" });
        fetchCategories();
      } else {
        const msg = await res.text();
        toast.error(msg);
      }
    } catch (err) {
      console.error("Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Category deleted successfully!");
        setDeleteConfirmId(null);
        fetchCategories();
      } else {
        const msg = await res.text();
        toast.error(msg);
      }
    } catch (err) {
      console.error("Failed to delete category");
    } finally {
      setSubmitting(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", description: "" });
    setShowModal(true);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="fade-in">
        <div className="admin-page-header" style={{ marginBottom: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Category Inventory</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
              TAXONOMY_ENGINE ACTIVE NODES: {categories.length} <br />
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>INFO:</span> Total Products menunjukkan jumlah item produk yang terhubung ke masing-masing kategori.
            </p>
          </div>
          <button onClick={openNew} className="btn btn-primary btn-sm">
            <Plus size={18} /> Add Category
          </button>
        </div>

        {/* Toolbar / Search */}
        <div className="card admin-toolbar" style={{ padding: '12px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', borderStyle: 'solid' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              placeholder="Search categories by name or slug..."
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
                <th>Category Name</th>
                <th>Slug / URL</th>
                <th>Description</th>
                <th>Total Products</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <ShieldCheck size={48} />
                      <p>{searchQuery ? "No categories match your search." : "No categories found."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat: any) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ background: 'var(--accent-glow)', padding: '8px', borderRadius: '8px', color: 'var(--accent-green)' }}>
                          <Tags size={16} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/{cat.slug}</code>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.description || "-"}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 font-bold" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Package size={14} />
                        {cat._count?.products || 0} ITEMS
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(cat)} className="btn-icon-sm" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirmId(cat.id)} className="btn-icon-sm text-danger" title="Delete"><Trash2 size={14} /></button>
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
                Showing <span style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredCategories.length)}</span> of <span style={{ color: 'var(--text-primary)' }}>{filteredCategories.length}</span> entries
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingId ? "Update Category" : "Add New Category"}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>CATEGORY NAME</label>
                <input
                  className="input"
                  placeholder="e.g. Aimlock & ESP"
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      name: val,
                      slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                    });
                  }}
                  required
                  style={{ background: 'var(--bg-primary)', fontWeight: 600 }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>SLUG (URL PATH)</label>
                <input
                  className="input"
                  placeholder="aimlock-esp"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>DESCRIPTION (OPTIONAL)</label>
                <textarea
                  className="input"
                  style={{ minHeight: '100px', resize: 'vertical', background: 'var(--bg-primary)', fontSize: '13px' }}
                  placeholder="Describe the tools in this category..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div style={{ marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : editingId ? "Update Category" : "Register Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Confirm Deletion</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              Are you sure you want to delete this category? This action cannot be undone. <br/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff4757' }}>NOTE: Category must have 0 products.</span>
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
                {submitting ? <Loader2 className="animate-spin" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
