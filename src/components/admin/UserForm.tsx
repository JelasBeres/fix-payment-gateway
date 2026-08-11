"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Loader2, Shield, Mail, Lock, User as UserIcon } from "lucide-react";

interface UserFormProps {
  initialData?: any;
}

export default function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    isActive: initialData?.isActive ?? true,
  });

  const isEdit = !!initialData;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/users/${initialData.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Something went wrong");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this staff? This cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${initialData.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card admin-form-container" style={{ padding: "32px", maxWidth: "600px" }}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label flex items-center gap-2">
            <UserIcon size={14} /> Full Name
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label flex items-center gap-2">
            <Mail size={14} /> Email Address
          </label>
          <input
            type="email"
            className="input"
            placeholder="admin@dripclient.id"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        {!isEdit && (
          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEdit}
            />
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Password must be at least 6 characters.
            </p>
          </div>
        )}

        {isEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--bg-elevated)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: "18px", height: "18px", accentColor: "var(--accent-green)" }}
            />
            <label htmlFor="isActive" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-bright)", cursor: "pointer" }}>
              Account Active Status
            </label>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Update Staff Info" : "Create Admin Account"}
          </button>

          {isEdit && (
            <button type="button" onClick={onDelete} className="btn btn-outline" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} disabled={loading}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
