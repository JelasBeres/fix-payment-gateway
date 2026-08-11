import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { Users, Plus, Shield, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Manajemen Staff | DripClient" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="fade-in">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "20px", marginBottom: "4px" }}>Manajemen Staff</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            // ADMIN_RECORDS: {users.length} STAFF
          </p>
        </div>
        <Link href="/admin/users/new" className="btn btn-primary">
          <Plus size={18} /> Tambah Admin
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {users.map((user: any) => (
          <div key={user.id} className="card" style={{ padding: "16px 20px" }}>
            <div className="admin-user-card-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="flex items-center gap-4">
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "var(--bg-elevated)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <Shield size={20} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-bright)" }}>{user.name}</span>
                    <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                      {user.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} /> {user.email}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      ID: {user.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              
              <Link href={`/admin/users/${user.id}`} className="btn btn-ghost btn-sm">
                Edit Staff
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px", padding: "16px", background: "var(--danger-dim)", border: "1px solid rgba(255,59,59,0.2)", borderRadius: "var(--radius-md)" }}>
        <h4 style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "4px" }}>Peringatan Keamanan</h4>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Setiap akun admin memiliki akses penuh ke manajemen produk dan transaksi. Pastikan hanya memberikan akses kepada staff yang terpercaya.
        </p>
      </div>
    </div>
  );
}
