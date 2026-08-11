import Link from "next/link";
import { ChevronLeft, Zap, Rocket, ShieldCheck, Gavel, Cpu } from "lucide-react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "About the Fast Lane | DripClient" };

export default function AboutPage() {
  return (
    <main className="mobile-container cylindrical-container">
      <div className="sticky-hero" style={{ paddingBottom: '20px' }}>
        <header className="landing-header" style={{ marginBottom: '12px' }}>
          <Link href="/" className="btn-icon-sm">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="logo-text" style={{ fontSize: '18px' }}>ABOUT <span style={{ color: 'var(--text-primary)' }}>US</span></h1>
          <div style={{ width: '32px' }}></div>
        </header>
        <p style={{ fontSize: '11px', color: 'var(--accent-green)', textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
          SPEED_IS_EVERYTHING.v3
        </p>
      </div>

      <div className="scroll-content" style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Hero Message */}
          <section className="card-glass" style={{ padding: '32px 24px', textAlign: 'center', borderTop: '2px solid var(--accent-green)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-bright)', marginBottom: '12px', letterSpacing: '-0.03em' }}>
              WELCOME TO THE <span style={{ color: 'var(--accent-green)' }}>FAST LANE.</span>
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Di DripClient, <span style={{ fontWeight: 800, color: 'var(--text-bright)' }}>speed is everything.</span> Makanya, kita nggak mau bikin lu nunggu lama-lama kayak nunggu gebetan bales chat.
            </p>
          </section>

          {/* Automation Section */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '10px', borderRadius: '12px', color: 'var(--accent-green)' }}>
                <Cpu size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '8px' }}>FULLY AUTOMATED</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Kita ngerakit platform ini dengan sistem yang fully automated. Lu checkout, bayar, dan <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>BOOM!</span> Produk langsung landing di tangan lu saat itu juga.
                </p>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '10px', borderRadius: '12px', color: '#ffd700' }}>
                <Rocket size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '8px' }}>SEAMLESS EXPERIENCE</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Kita nggak cuma sekadar jualan, tapi kita kasih experience belanja yang seamless dengan standar quality control yang ketat.
                </p>
              </div>
            </div>
          </section>

          {/* Promise Section */}
          <section className="card" style={{ padding: '32px 24px', background: 'var(--bg-card)', border: '1px solid var(--accent-green)' }}>
            <div style={{ textAlign: 'center' }}>
              <Zap size={32} style={{ color: 'var(--accent-green)', marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '12px' }}>
                LOW PRICE, HIGH PERFORMANCE, AND INSTANT DELIVERY.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Itu janji kita. So, let’s upgrade your game and get your drip now!
              </p>
            </div>
          </section>

          {/* Legal Protocol - Keeping it professional for protection */}
          <section style={{ marginTop: '20px', padding: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '10px' }}>
              <Gavel size={16} />
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>LEGAL_DISCLAIMER</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              DripClient adalah distributor digital independen. Kami tidak bertanggung jawab atas segala konsekuensi yang timbul dari penggunaan software pihak ketiga. Seluruh risiko penggunaan sepenuhnya menjadi tanggung jawab user.
            </p>
          </section>

        </div>

        <Footer />
      </div>
    </main>
  );
}
