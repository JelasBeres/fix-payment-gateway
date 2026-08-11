import { prisma } from "@/lib/prisma";
import PaymentConfigForm from "@/components/admin/PaymentConfigForm";
import SystemControlsForm from "@/components/admin/SystemControlsForm";
import type { Metadata } from "next";
import { 
  Settings, 
  Shield, 
  CreditCard, 
  Bell, 
  ShieldAlert, 
  Server, 
  Zap, 
  Database,
  Globe,
  Lock
} from "lucide-react";

export const metadata: Metadata = { title: "System Configuration | DripClient" };

export default async function AdminSettingsPage() {
  const configs = await prisma.paymentConfig.findMany({ orderBy: { method: "asc" } });

  return (
    <div className="fade-in admin-form-container" style={{ maxWidth: '1200px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: "40px", borderBottom: '1px solid var(--border-subtle)', paddingBottom: '24px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
          <div style={{ background: 'var(--accent-glow)', padding: '10px', borderRadius: '12px', color: 'var(--accent-green)' }}>
            <Server size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: '-0.5px' }}>System Configuration</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              // KERNEL_PARAMETERS // SECURITY_PROTOCOLS // NODE_V1.2.4
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: Financial & Payment Infrastructure */}
        <div className="flex flex-col gap-8">
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-bright)' }}>
                <CreditCard size={20} style={{ color: 'var(--accent-green)' }} /> Payment Infrastructure
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Configure transaction fees and active payment gateways for your store.
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {configs.length === 0 ? (
                <div className="card text-center p-12 text-muted" style={{ borderStyle: 'dashed' }}>
                  <Database size={32} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                  <p>No gateway configurations found in database.</p>
                </div>
              ) : (
                configs.map((config: any) => (
                  <PaymentConfigForm
                    key={config.method}
                    config={{
                      method: config.method,
                      label: config.label ?? config.method.toString(),
                      feePercent: Number(config.feePercent),
                      feeFixed: Number(config.feeFixed),
                      isActive: config.isActive,
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security, Controls & Notifications */}
        <div className="flex flex-col gap-12">
          
          {/* Advanced Controls Section */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-bright)' }}>
                <ShieldAlert size={20} style={{ color: '#ff4757' }} /> Security & Overrides
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Manage high-level system permissions and database safety constraints.
              </p>
            </div>
            <SystemControlsForm />
          </div>
        </div>
      </div>
    </div>
  );
}
