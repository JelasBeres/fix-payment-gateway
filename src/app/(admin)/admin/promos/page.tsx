"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import imageCompression from "browser-image-compression";
import { Plus, Trash2, Edit2, Image as ImageIcon, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle, PlayCircle, Upload, Link as LinkIcon, ExternalLink, Activity, Save } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface Promo {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string;
  order: number;
  isActive: boolean;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", order: 0, isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promos");
      const data = await res.json();
      setPromos(data);
    } catch (err) {
      console.error("Failed to fetch promos");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Processing & Uploading promo image...");

    try {
      // 1. Compression Options
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload to our dynamic API
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('bucket', 'hero-files'); // Bucket Name as requested
      formData.append('folder', 'promos');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      setForm(prev => ({ ...prev, imageUrl: url }));
      toast.success("Promo banner uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to upload image: " + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error("Please upload a promo image first!");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/promos/${editingId}` : "/api/admin/promos";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingId ? "Promo updated successfully!" : "Promo created successfully!");
        setShowModal(false);
        setEditingId(null);
        setForm({ title: "", imageUrl: "", linkUrl: "", order: 0, isActive: true });
        fetchPromos();
      } else {
        const msg = await res.text();
        toast.error(msg);
      }
    } catch (err) {
      console.error("Failed to save promo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setForm({
      title: promo.title || "",
      imageUrl: promo.imageUrl,
      linkUrl: promo.linkUrl,
      order: promo.order,
      isActive: promo.isActive,
    });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/promos/${deleteConfirmId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Promo deleted successfully!");
        setDeleteConfirmId(null);
        fetchPromos();
      } else {
        const msg = await res.text();
        toast.error(msg);
      }
    } catch (err) {
      console.error("Failed to delete promo");
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination & Search
  const filteredPromos = promos.filter(p =>
    (p.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPromos.length / ITEMS_PER_PAGE);
  const paginatedPromos = filteredPromos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 fade-in">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Manage Promos</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            PROMO_SYSTEM_SYNCED ACTIVE_ADS: {promos.length} <br/>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>INFO:</span> Add and organize promotional banners to attract more customers.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ title: "", imageUrl: "", linkUrl: "", order: 0, isActive: true });
            setShowModal(true);
          }}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} /> Add Promo
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              className="input"
              placeholder="Search promos by title..."
              style={{ height: '40px', paddingLeft: '40px', fontSize: '13px', background: 'var(--bg-primary)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Banner Preview</th>
                <th>Promo Info</th>
                <th>Order</th>
                <th>Status</th>
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
              ) : paginatedPromos.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <ImageIcon size={48} />
                      <p>{searchQuery ? "No promos match your search." : "No promos found."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPromos.map((promo) => (
                  <tr key={promo.id}>
                    <td>
                      <div style={{ width: '120px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                        {promo.imageUrl ? (
                          <img src={promo.imageUrl} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontWeight: 800, fontSize: '14px' }}>{promo.title || "Untitled Promo"}</span>
                        <div style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <LinkIcon size={10} />
                          {promo.linkUrl.length > 30 ? promo.linkUrl.substring(0, 30) + '...' : promo.linkUrl}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={12} className="text-[var(--text-muted)]" />
                        <span className="font-mono text-sm font-bold">{promo.order}</span>
                      </div>
                    </td>
                    <td>
                      {promo.isActive ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(0,255,128,0.1)', color: 'var(--accent-green)', fontSize: '10px', fontWeight: 800 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                          ACTIVE
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontSize: '10px', fontWeight: 800 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b30' }}></span>
                          OFFLINE
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(promo)} className="btn-icon-sm" style={{ background: 'var(--bg-elevated)' }} title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirmId(promo.id)} className="btn-icon-sm text-danger" style={{ background: 'var(--bg-elevated)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing <span style={{ color: 'white' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span style={{ color: 'white' }}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredPromos.length)}</span> of {filteredPromos.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {mounted && showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                {editingId ? "Update Promo Banner" : "Add New Promo"}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Banner Upload Area */}
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>PROMO BANNER IMAGE</label>
                <div style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--bg-primary)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  />

                  {form.imageUrl ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--accent-green)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Upload size={12} /> CLICK TO CHANGE IMAGE
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {uploading ? (
                        <Loader2 className="animate-spin text-[var(--accent-green)]" size={28} />
                      ) : (
                        <Upload size={28} className="text-[var(--text-muted)]" />
                      )}
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-bright)' }}>{uploading ? "Uploading..." : "Click to Upload Banner"}</div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Recommended: 16:9 ratio</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>PROMO TITLE (OPTIONAL)</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Special Weekend Deal"
                  style={{ background: 'var(--bg-primary)', fontWeight: 600 }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>DESTINATION LINK URL</label>
                <input
                  required
                  className="input"
                  value={form.linkUrl}
                  onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://..."
                  style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>DISPLAY ORDER</label>
                  <input
                    required
                    type="number"
                    className="input"
                    value={form.order}
                    onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    style={{ background: 'var(--bg-primary)' }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>STATUS</label>
                  <select
                    className="input"
                    value={form.isActive ? "true" : "false"}
                    onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}
                    style={{ background: 'var(--bg-primary)', fontWeight: 700 }}
                  >
                    <option value="true">ACTIVE (VISIBLE)</option>
                    <option value="false">INACTIVE (HIDDEN)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting || uploading}>
                  {submitting ? <Loader2 className="animate-spin" /> : editingId ? "Update Promo Banner" : "Register New Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {mounted && deleteConfirmId && createPortal(
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

            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>Remove Promo?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              This will permanently remove this banner from your landing page slider. This action cannot be undone.
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
                {submitting ? <Loader2 className="animate-spin" /> : "Yes, Delete It"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
