import React from "react";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import UserForm from "@/components/admin/UserForm";

export default function NewUserPage() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/users" className="btn-icon-sm" style={{ display: "inline-flex", marginBottom: "12px" }}>
          <ChevronLeft size={20} /> Back to Staff List
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ padding: "10px", background: "var(--accent-glow)", borderRadius: "12px", color: "var(--accent-green)" }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900 }}>Register New Admin</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tambahkan akses staff resmi ke dashboard DripClient.</p>
          </div>
        </div>
      </div>

      <UserForm />
    </div>
  );
}
