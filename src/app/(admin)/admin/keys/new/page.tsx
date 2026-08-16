"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Key,
  ChevronLeft,
  Loader2,
  Plus,
  AlertCircle,
  Package,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

function NewKeysForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: initialProductId,
    keysText: ""
  });

  const [saveStep, setSaveStep] = useState<"IDLE" | "LOCAL_CHECK" | "DB_CHECK" | "SAVING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorDetails, setErrorDetails] = useState("");
  const [scanningKey, setScanningKey] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load product list");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.productId) {
      toast.error("Please select a target product");
      return;
    }

    setSubmitting(true);
    setErrorDetails("");

    try {
      // START THE SCANNING OVERLAY IMMEDIATELY
      setSaveStep("LOCAL_CHECK");

      const keysArray = form.keysText
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      if (keysArray.length === 0) {
        setSaveStep("ERROR");
        setErrorDetails("TIDAK ADA KEY YANG INPUT. MOHON MASUKKAN MINIMAL 1 KEY.");
        setSubmitting(false);
        return;
      }

      // Step 1: Local Check Visual Effect (Scan each key)
      // We'll scan max 15 keys for the visual, but check ALL for logic
      const visualKeys = keysArray.slice(0, 15);
      for (const key of visualKeys) {
        setScanningKey(key);
        await new Promise(r => setTimeout(r, 100)); // Super fast scan
      }
      setScanningKey("ANALYSIS COMPLETE");
      await new Promise(r => setTimeout(r, 500));

      const duplicates = keysArray.filter((item, index) => keysArray.indexOf(item) !== index);
      if (duplicates.length > 0) {
        const uniqueDupes = [...new Set(duplicates)];
        setSaveStep("ERROR");
        setErrorDetails(`DUPLIKAT TERDETEKSI DI INPUT: ${uniqueDupes.join(", ")}`);
        setSubmitting(false);
        return;
      }

      // Step 2: Database Check
      setSaveStep("DB_CHECK");
      setScanningKey("CROSS-REFERENCING VAULT...");
      await new Promise(r => setTimeout(r, 1200));

      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          keys: keysArray
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessCount(data.count);
        setSaveStep("SUCCESS");
        setScanningKey(`${data.count} KEYS DEPLOYED SUCCESSFULLY`);
        await new Promise(r => setTimeout(r, 2000));
        toast.success(`Successfully registered ${data.count} keys!`);
        router.push(`/admin/keys?productId=${form.productId}`);
        router.refresh();
      } else {
        setSaveStep("ERROR");
        setErrorDetails(data.error || "GAGAL MEMVERIFIKASI DENGAN DATABASE VAULT.");
        setSubmitting(false);
      }
    } catch (err: any) {
      setSaveStep("ERROR");
      setErrorDetails("CRITICAL SYSTEM ERROR: GAGAL MENGHUBUNGI SERVER.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in admin-form-container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/keys" className="flex items-center gap-2 text-muted hover:text-primary transition-colors" style={{ fontSize: '14px', marginBottom: '16px', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Back to Vault
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 900 }}>Register New Keys</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Add one or multiple license keys to your digital inventory.</p>
      </div>

      <div className="card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
        {/* Advanced Scanning Overlay */}
        {saveStep !== "IDLE" && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(10, 10, 10, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ position: 'relative' }}>
              <div className={saveStep === "ERROR" ? "" : "animate-spin"} style={{
                width: '80px',
                height: '80px',
                border: '4px solid',
                borderColor: saveStep === "ERROR" ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent-glow)',
                borderTopColor: saveStep === "ERROR" ? 'var(--danger)' : 'var(--accent-green)',
                borderRadius: '50%'
              }}></div>
              <ShieldCheck size={32} className={saveStep === "ERROR" ? "" : "animate-pulse"} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: saveStep === "ERROR" ? 'var(--danger)' : 'var(--accent-green)'
              }} />
            </div>

            <div style={{ textAlign: 'center', maxWidth: '80%' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '2px',
                color: saveStep === "ERROR" ? '#ff4d4d' : '#ffffff', // Fixed white
                marginBottom: '8px'
              }}>
                {saveStep === "SUCCESS" && "DEPLOYMENT COMPLETE"}
                {saveStep === "ERROR" && "SCANNING FAILED"}
                {(saveStep === "LOCAL_CHECK" || saveStep === "DB_CHECK") && "SYSTEM SCANNING..."}
              </h2>
              <p style={{
                fontSize: '13px',
                color: saveStep === "ERROR" ? '#ff8080' : '#00ff80', // Fixed bright green
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}>
                {saveStep === "LOCAL_CHECK" && "> ANALYZING INPUT PATTERNS..."}
                {saveStep === "DB_CHECK" && "> CROSS-REFERENCING VAULT DATABASE..."}
                {saveStep === "SUCCESS" && "> ALL KEYS VERIFIED & REGISTERED."}
                {saveStep === "ERROR" && `> ERROR: ${errorDetails}`}
              </p>
            </div>

            {/* Scanning Key Display (The Terminal Box) */}
            {saveStep !== "ERROR" && (
              <div className="admin-scan-terminal" style={{
                width: '320px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid',
                borderColor: saveStep === "SUCCESS" ? '#00ff80' : '#333',
                borderRadius: '12px',
                padding: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#00ff80',
                textAlign: 'center',
                boxShadow: saveStep === "SUCCESS" ? '0 0 30px rgba(0, 255, 128, 0.2)' : 'none',
                transition: 'all 0.5s ease'
              }}>
                <div style={{ marginBottom: '8px', fontSize: '9px', letterSpacing: '1px', color: '#aaaaaa', fontWeight: 600 }}>
                  {saveStep === "SUCCESS" ? "VAULT_SYNCHRONIZATION_RESULT" : "CURRENT_ANALYSIS_BUFFER"}
                </div>
                <div style={{
                  fontWeight: 900,
                  letterSpacing: '1px',
                  fontSize: saveStep === "SUCCESS" ? '16px' : '12px',
                  color: '#ffffff',
                  textShadow: '0 0 10px rgba(255,255,255,0.3)'
                }}>
                  {saveStep === "SUCCESS" ? `+ ${successCount} KEYS REGISTERED` : scanningKey}
                </div>
              </div>
            )}

            {saveStep === "ERROR" ? (
              <button
                onClick={() => setSaveStep("IDLE")}
                className="btn btn-outline"
                style={{
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)',
                  marginTop: '12px',
                  padding: '8px 24px',
                  fontSize: '12px',
                  fontWeight: 800
                }}
              >
                RETURN TO FORM & FIX
              </button>
            ) : (
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 1 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: (saveStep === "DB_CHECK" || saveStep === "SUCCESS") ? 'var(--accent-green)' : 'var(--accent-glow)' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: (saveStep === "DB_CHECK" || saveStep === "SUCCESS") ? 'var(--text-bright)' : 'var(--text-muted)' }}>LOCAL DUPLICATE SCAN</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: (saveStep === "DB_CHECK" || saveStep === "SUCCESS") ? 1 : 0.3 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: saveStep === "SUCCESS" ? 'var(--accent-green)' : 'var(--accent-glow)' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: saveStep === "SUCCESS" ? 'var(--text-bright)' : 'var(--text-muted)' }}>VAULT INTEGRITY CHECK</span>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Product Selection */}
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              TARGET PRODUCT
              {initialProductId && <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>[ PRE-SELECTED ]</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                className="input"
                style={{ paddingLeft: '44px', fontWeight: 600, background: 'var(--bg-primary)' }}
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {loading && <p style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '8px' }}>Loading products...</p>}
          </div>

          {/* Keys Input */}
          <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label className="input-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '1px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              LICENSE KEYS (BULK)
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>ONE KEY PER LINE</span>
            </label>
            <textarea
              className="input"
              style={{
                minHeight: '250px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                padding: '20px',
                lineHeight: 1.6,
                background: 'var(--bg-primary)',
                resize: 'vertical'
              }}
              placeholder={"XXXX-XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY-YYYY\nZZZZ-ZZZZ-ZZZZ-ZZZZ"}
              value={form.keysText}
              onChange={(e) => setForm({ ...form, keysText: e.target.value })}
              required
            />
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
              <AlertCircle size={14} />
              <span>You can paste hundreds of keys at once. System will clean empty lines automatically.</span>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{
                height: '64px',
                fontSize: '16px',
                fontWeight: 800,
              }}
              disabled={submitting || loading}
            >
              <CheckCircle2 size={20} /> DEPLOY KEYS TO VAULT
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function NewKeysPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <Loader2 className="animate-spin" />
      </div>
    }>
      <NewKeysForm />
    </Suspense>
  );
}
