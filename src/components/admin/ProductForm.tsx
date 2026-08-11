"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Loader2, Package, Tag, Hash, FileText, Settings, Clock, ShieldCheck, Upload, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { nanoid } from "nanoid";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialData?: any;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  // Debug Log
  console.log("ProductForm Rendering with initialData:", !!initialData);

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    price: initialData?.price?.toString() || "",
    stock: initialData?.stock?.toString() || "-1",
    isActive: initialData?.isActive ?? true,
    imageUrl: initialData?.imageUrl || "",
    features: initialData?.features?.join(", ") || "",
    durationDays: initialData?.durationDays?.toString() || "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Processing & Uploading image...");

    try {
      // 1. Compression Options (Max 300KB, Keep HD)
      const options = {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8
      };

      const compressedFile = await imageCompression(file, options);
      
      // 2. Upload to our internal API
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Upload failed");
        } else {
          const errorText = await res.text();
          throw new Error(`Server Error (${res.status}): ${errorText.slice(0, 100)}`);
        }
      }

      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server (Not JSON)");
      }

      const { url } = await res.json();
      setForm(prev => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded & optimized successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Upload Error:", err);
      toast.error("Failed to upload image: " + err.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
      if (!initialData && data.length > 0) {
        setForm(prev => ({ ...prev, categoryId: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          durationDays: form.durationDays ? Number(form.durationDays) : null,
          features: form.features.split(",").map((f: string) => f.trim()).filter((f: string) => f !== ""),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan produk");
      }

      toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Are you sure? This will permanently delete the product if no purchases exist.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${initialData.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to delete");
      }

      toast.success("Product deleted successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container" style={{ maxWidth: "800px" }}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="grid-2">
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2"><Package size={14} /> Product Name</label>
            <input 
              className="input" 
              placeholder="e.g. DripClient Premium | 30 Days" 
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
            />
            <div style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '-4px' }}>
              💡 Gunakan format <code style={{ background: 'var(--bg-elevated)', padding: '2px 4px', borderRadius: '4px' }}>Nama Produk | Durasi</code> agar otomatis dikelompokkan (Contoh: Cheat A | 7 Hari)
            </div>
          </div>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2"><Tag size={14} /> Slug (URL)</label>
            <input 
              className="input" 
              placeholder="dripclient-premium-tool" 
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <label className="input-label flex items-center gap-2"><FileText size={14} /> Description</label>
          <textarea 
            className="input" 
            style={{ minHeight: "100px", resize: "vertical" }}
            placeholder="Describe the product benefits and usage..." 
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <label className="input-label flex items-center gap-2"><ImageIcon size={14} /> Product Image</label>
          <div style={{ 
            border: '2px dashed var(--border-subtle)', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center',
            background: 'var(--bg-elevated)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-green)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={uploading}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            
            {form.imageUrl ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={form.imageUrl} 
                  alt="Preview" 
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} 
                />
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                  Click to change image
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {uploading ? (
                  <Loader2 className="animate-spin" size={32} color="var(--accent-green)" />
                ) : (
                  <Upload size={32} color="var(--text-muted)" />
                )}
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {uploading ? "Compressing & Uploading..." : "Upload Product Image"}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Max 300KB (Auto-compressed), HD Quality preserved
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2">Category</label>
            <select 
              className="input" 
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2"><Hash size={14} /> Price (IDR)</label>
            <input 
              type="number" 
              className="input" 
              placeholder="50000" 
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2"><Package size={14} /> Stock Control</label>
            <div style={{ 
              height: '44px', 
              background: 'var(--bg-primary)', 
              borderRadius: '8px', 
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '12px',
              color: 'var(--accent-green)',
              fontWeight: 700,
              gap: '8px'
            }}>
              <ShieldCheck size={14} /> VAULT MANAGED (AUTOMATIC)
            </div>
          </div>
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label flex items-center gap-2"><Clock size={14} /> Duration (Days)</label>
            <input 
              type="number" 
              className="input" 
              placeholder="30" 
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <label className="input-label flex items-center gap-2">Features (Comma separated)</label>
          <input 
            className="input" 
            placeholder="Automatic Update, Secure, 24/7 Support" 
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2" style={{ marginTop: "24px" }}>
          <input 
            type="checkbox" 
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-green)' }}
          />
          <label htmlFor="isActive" style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-bright)", cursor: 'pointer' }}>
            Active / Visible in Catalog
          </label>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <button type="submit" className="btn btn-primary flex-1 btn-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Update Product Details" : "Create Product"}
          </button>

          {isEdit && (
            <button type="button" onClick={onDelete} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', height: '56px' }} disabled={loading}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
