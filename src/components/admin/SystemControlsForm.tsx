"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { 
  ShieldAlert, 
  Loader2, 
  Power, 
  Info, 
  ShieldCheck, 
  AlertOctagon,
  X,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";

interface Config {
  key: string;
  value: string;
}

export default function SystemControlsForm() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      setConfigs(data);
    } catch (err) {
      console.error("Failed to fetch configs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = () => {
    const forceDeleteActive = getVal("ALLOW_FORCE_DELETE") === "true";
    if (!forceDeleteActive) {
      setShowConfirm(true);
    } else {
      executeToggle("ALLOW_FORCE_DELETE", "true");
    }
  };

  const executeToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    setUpdating(key);
    setShowConfirm(false);
    
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (res.ok) {
        toast.success(`${key.replace(/_/g, ' ')} ${newValue === "true" ? 'ENABLED' : 'DISABLED'}`, {
          icon: newValue === "true" ? '⚠️' : '🛡️',
          duration: 4000
        });
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
      } else {
        toast.error("Failed to update system parameter");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setUpdating(null);
    }
  };

  const getVal = (key: string) => configs.find(c => c.key === key)?.value || "false";

  if (loading) return (
    <div className="flex justify-center p-8 card-glass">
      <Loader2 size={24} className="animate-spin opacity-30" />
    </div>
  );

  const forceDeleteActive = getVal("ALLOW_FORCE_DELETE") === "true";

  // MODAL COMPONENT
  const SafetyModal = () => (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.8)', zIndex: 99999 }} onClick={() => setShowConfirm(false)}>
      <div 
        className="modal-content fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '440px', 
          padding: '0', 
          overflow: 'hidden', 
          border: '1px solid rgba(255, 71, 87, 0.4)',
          background: 'var(--bg-surface)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 100px rgba(255, 71, 87, 0.1)'
        }}
      >
        {/* Modal Header Area */}
        <div style={{ 
          background: 'linear-gradient(to bottom, rgba(255, 71, 87, 0.15), transparent)', 
          padding: '48px 32px 32px', 
          textAlign: 'center', 
          position: 'relative',
          borderBottom: '1px solid rgba(255, 71, 87, 0.1)'
        }}>
          <button 
            onClick={() => setShowConfirm(false)}
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
          
          <div style={{ 
            width: '88px', 
            height: '88px', 
            background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)', 
            borderRadius: '28px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            margin: '0 auto 24px',
            boxShadow: '0 15px 30px rgba(255, 71, 87, 0.4)',
            transform: 'rotate(-5deg)'
          }}>
            <Lock size={40} />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '4px', letterSpacing: '-0.5px' }}>Security Override</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: '#ff4757', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '11px', color: '#ff4757', fontWeight: 800, letterSpacing: '2px' }}>DANGEROUS PROTOCOL</span>
            <div style={{ width: '6px', height: '6px', background: '#ff4757', borderRadius: '50%' }}></div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '32px 40px 40px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, textAlign: 'center' }}>
              Enabling <span style={{ color: 'var(--text-bright)', fontWeight: 700 }}>Force Delete Mode</span> will bypass all database safety guards. This action allows the removal of critical transaction records.
            </p>
          </div>

          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)', textAlign: 'center', marginBottom: '32px' }}>
            Authorize system override?
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => executeToggle("ALLOW_FORCE_DELETE", "false")} 
              className="btn btn-danger btn-full"
              style={{ 
                height: '56px', 
                fontWeight: 900, 
                background: 'linear-gradient(to right, #ff4757, #ff6b81)',
                fontSize: '16px',
                color: '#ffffff',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                boxShadow: '0 10px 20px rgba(255, 71, 87, 0.3)',
                border: 'none'
              }}
            >
              <Unlock size={18} style={{ marginRight: '8px' }} /> Confirm & Unlock
            </button>
            <button 
              onClick={() => setShowConfirm(false)} 
              className="btn btn-ghost btn-full"
              style={{ height: '48px', fontWeight: 700, color: 'var(--text-muted)' }}
            >
              Return to Safety
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="card" style={{ 
        padding: '32px', 
        border: forceDeleteActive ? '2px solid #ff4757' : '1px solid var(--border-subtle)',
        background: forceDeleteActive 
          ? 'linear-gradient(135deg, rgba(255, 71, 87, 0.08) 0%, var(--bg-surface) 50%, rgba(255, 71, 87, 0.08) 100%)' 
          : 'var(--bg-elevated)',
        boxShadow: forceDeleteActive ? '0 0 40px rgba(255, 71, 87, 0.15)' : 'none',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Pulse for Active Mode */}
        {forceDeleteActive && <div className="pulse-bg" />}

        <div className="flex items-center gap-4" style={{ marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            background: forceDeleteActive ? '#ff4757' : 'var(--bg-primary)', 
            padding: '14px', 
            borderRadius: '16px', 
            color: forceDeleteActive ? '#fff' : 'var(--accent-green)',
            border: '1px solid ' + (forceDeleteActive ? '#ff4757' : 'var(--border-subtle)'),
            boxShadow: forceDeleteActive ? '0 0 20px rgba(255, 71, 87, 0.4)' : 'none',
            transition: 'all 0.4s ease'
          }}>
            {forceDeleteActive ? <AlertOctagon size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: forceDeleteActive ? '#ff4757' : 'var(--text-bright)', transition: 'all 0.4s ease' }}>
              {forceDeleteActive ? "RESTRICTIONS BYPASSED" : "Kernel Protection Active"}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Current Status: <span style={{ color: forceDeleteActive ? '#ff4757' : 'var(--accent-green)', fontWeight: 700 }}>
                {forceDeleteActive ? "OVERRIDE_ENABLED" : "SECURED"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex justify-between items-center admin-force-delete-section" style={{ 
            padding: '24px 32px',
            borderRadius: '20px', 
            background: 'var(--bg-primary)', 
            border: '1px solid ' + (forceDeleteActive ? 'rgba(255, 71, 87, 0.4)' : 'var(--border-subtle)'),
            boxShadow: forceDeleteActive ? '0 10px 30px rgba(255, 71, 87, 0.08)' : '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.4s ease'
          }}>
            <div className="flex flex-col gap-2">
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-bright)' }}>Force Delete Capability</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.6 }}>
                Bypass integrity checks to allow mass deletion of inventory nodes even with active transaction history.
              </span>
            </div>
            
            <button 
              onClick={handleToggleClick}
              disabled={updating === "ALLOW_FORCE_DELETE"}
              className={`btn ${forceDeleteActive ? 'btn-danger' : 'btn-outline'}`}
              style={{ 
                minWidth: '120px', 
                height: '44px', 
                borderRadius: '12px',
                boxShadow: forceDeleteActive ? '0 8px 16px rgba(255, 71, 87, 0.2)' : 'none'
              }}
            >
              {updating === "ALLOW_FORCE_DELETE" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Power size={16} />
                  <span style={{ fontWeight: 800 }}>{forceDeleteActive ? "DEACTIVATE" : "ACTIVATE"}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {forceDeleteActive ? (
          <div style={{ 
            marginTop: '40px', 
            padding: '24px', 
            background: 'rgba(255, 71, 87, 0.1)', 
            borderRadius: '16px', 
            border: '1px solid #ff4757',
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 1,
            marginBottom: '8px'
          }}>
            <div style={{ color: '#ff4757', marginTop: '4px' }}><Info size={20} /></div>
            <div>
              <p style={{ fontSize: '12px', color: '#ff4757', fontWeight: 700, lineHeight: 1.6, marginBottom: '4px' }}>
                CRITICAL SYSTEM STATE: OVERRIDE_MODE_ACTIVE
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                The safeguard preventing the deletion of products with existing purchases is currently DISABLED. Any deletion performed will be final and will cascade through the entire database.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '40px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', opacity: 0.5, marginBottom: '8px' }}>
            <ShieldCheck size={16} color="var(--accent-green)" />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Database integrity is being maintained by system defaults.</p>
          </div>
        )}

        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 0.05; }
            50% { opacity: 0.15; }
            100% { opacity: 0.05; }
          }
          .pulse-bg {
            position: absolute;
            inset: 0;
            background: #ff4757;
            animation: pulse 2s infinite ease-in-out;
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* PORTAL MODAL */}
      {showConfirm && mounted && createPortal(<SafetyModal />, document.body)}
    </>
  );
}
