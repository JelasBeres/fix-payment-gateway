"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Ban, Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";

interface BlockedEmail {
  id: string;
  email: string;
  reason: string | null;
  createdAt: string;
}

export default function AdminBlocklistPage() {
  const [blocked, setBlocked] = useState<BlockedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  const fetchBlocklist = async () => {
    try {
      const res = await fetch("/api/admin/blocklist");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlocked(data);
    } catch {
      toast.error("Gagal memuat blocklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Email diblokir");
        setEmail("");
        setReason("");
        fetchBlocklist();
      } else {
        toast.error(data.error || "Gagal menambahkan email");
      }
    } catch {
      toast.error("Kesalahan saat menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus email ini dari blocklist?")) return;
    try {
      const res = await fetch(`/api/admin/blocklist/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Email dihapus dari blocklist");
        fetchBlocklist();
      } else {
        toast.error("Gagal menghapus email");
      }
    } catch {
      toast.error("Kesalahan saat menghubungi server");
    }
  };

  return (
    <div className="fade-in">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Blocklist</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            CUSTOMER_BLOCKLIST ACTIVE_NODES: {blocked.length}
            <br />
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>INFO:</span> Email di daftar ini tidak bisa checkout.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <span className="badge badge-danger" style={{ padding: '8px 12px' }}>{blocked.length} BLOCKED</span>
        </div>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Ban size={18} className="text-primary" /> Tambah Email ke Blocklist
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-6">
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>EMAIL CUSTOMER</label>
            <input
              type="email"
              className="input"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ height: '44px' }}
            />
          </div>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)' }}>ALASAN (OPSIONAL)</label>
            <input
              className="input"
              placeholder="cth: chargeback / penipuan"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ height: '44px' }}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !email.trim()} style={{ height: '44px', padding: '0 24px' }}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Blokir Email
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}><ShieldCheck size={14} style={{ marginRight: '6px' }} /> Email</th>
                <th>Alasan</th>
                <th>Tanggal Ditambahkan</th>
                <th style={{ paddingRight: '24px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px' }}>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : blocked.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Ban size={48} />
                      <p>Blocklist kosong. Tidak ada email yang diblokir.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                blocked.map((b: BlockedEmail) => (
                  <tr key={b.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <code style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 700 }}>{b.email}</code>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{b.reason || "-"}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(b.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ paddingRight: '24px' }}>
                      <button onClick={() => handleDelete(b.id)} className="btn-icon-sm text-danger" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
