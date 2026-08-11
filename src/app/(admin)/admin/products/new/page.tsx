import React from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/products" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontSize: "13px", marginBottom: "12px" }}>
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ padding: "10px", background: "var(--accent-glow)", borderRadius: "12px", color: "var(--accent-green)" }}>
            <PackagePlus size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900 }}>Create New Product</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Add a new digital performance tool to your marketplace catalog.</p>
          </div>
        </div>
      </div>

      <ProductForm />
    </div>
  );
}
