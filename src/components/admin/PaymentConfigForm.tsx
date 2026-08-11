"use client";

import { useState } from "react";
import { Save, Check, Loader2, CreditCard, Percent, Banknote } from "lucide-react";
import toast from "react-hot-toast";

interface Config {
  method: string;
  label: string;
  feePercent: number;
  feeFixed: number;
  isActive: boolean;
}

export default function PaymentConfigForm({ config }: { config: Config }) {
  const [feePercent, setFeePercent] = useState(config.feePercent);
  const [feeFixed, setFeeFixed] = useState(config.feeFixed);
  const [isActive, setIsActive] = useState(config.isActive);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config/payment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: config.method, feePercent, feeFixed, isActive }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save configuration");
        return;
      }
      
      toast.success(`${config.label} settings updated`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Network error while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '24px', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div className="flex items-center gap-3">
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', color: 'var(--accent-green)', border: '1px solid var(--border-subtle)' }}>
            <CreditCard size={18} />
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-bright)" }}>{config.label}</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              ID: {config.method}
            </span>
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer p-2" style={{ borderRadius: '8px', background: isActive ? 'rgba(0, 255, 65, 0.05)' : 'transparent' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: "var(--accent-green)" }}
          />
          <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "var(--accent-green)" : "var(--text-muted)" }}>
            {isActive ? "ENABLED" : "DISABLED"}
          </span>
        </label>
      </div>

      <div className="flex gap-4 admin-config-inputs" style={{ marginBottom: "20px" }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label flex items-center gap-2"><Percent size={12} /> Fee Percent</label>
          <input
            type="number"
            className="input"
            style={{ height: '40px', background: 'var(--bg-primary)' }}
            value={feePercent}
            onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
            step={0.1}
            min={0}
            max={100}
          />
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label flex items-center gap-2"><Banknote size={12} /> Fee Fixed (IDR)</label>
          <input
            type="number"
            className="input"
            style={{ height: '40px', background: 'var(--bg-primary)' }}
            value={feeFixed}
            onChange={(e) => setFeeFixed(parseInt(e.target.value) || 0)}
            step={500}
            min={0}
          />
        </div>
      </div>

      <button
        className={`btn btn-sm ${saved ? "btn-outline" : "btn-primary"} btn-full`}
        style={{ height: '40px', fontSize: '13px', fontWeight: 700 }}
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        <span style={{ marginLeft: '8px' }}>{loading ? "SAVING..." : saved ? "SETTINGS SAVED" : `UPDATE ${config.label}`}</span>
      </button>
    </div>
  );
}
