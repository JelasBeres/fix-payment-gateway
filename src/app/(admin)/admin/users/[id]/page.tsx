import React from "react";
import Link from "next/link";
import { ChevronLeft, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import UserForm from "@/components/admin/UserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return notFound();
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/users" className="btn-icon-sm" style={{ display: "inline-flex", marginBottom: "12px" }}>
          <ChevronLeft size={20} /> Back to Staff List
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ padding: "10px", background: "var(--accent-glow)", borderRadius: "12px", color: "var(--accent-green)" }}>
            <UserCog size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900 }}>Edit Staff Settings</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Modifikasi otoritas atau status aktif staff: <span style={{ color: "var(--text-bright)" }}>{user.name}</span></p>
          </div>
        </div>
      </div>

      <UserForm initialData={{
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }} />
    </div>
  );
}
