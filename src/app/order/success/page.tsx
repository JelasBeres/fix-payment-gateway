"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  Download,
  Mail,
  ShieldCheck
} from "lucide-react";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import html2canvas from "html2canvas";

import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setOrder(data);
            if (!hasCleared.current && localStorage.getItem('pending_cart_checkout') === 'true') {
              clearCart();
              localStorage.removeItem('pending_cart_checkout');
              hasCleared.current = true;
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    const copyButtons = receiptRef.current.querySelectorAll('.copy-trigger');
    copyButtons.forEach((btn: any) => btn.style.display = 'none');

    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: "#ffffff",
      scale: 3,
      logging: false,
      useCORS: true
    });

    copyButtons.forEach((btn: any) => btn.style.display = 'flex');

    const link = document.createElement("a");
    link.download = `DRIP-INVOICE-${orderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="loading-spinner" />
        <p className="mt-4 text-muted">Finalisasi invoice...</p>
      </div>
    );
  }

  return (
    <div className="scroll-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
      <div className="glow-pulse" style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '16px' }}>
        <CheckCircle2 size={42} color="var(--accent-green)" />
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '40px', letterSpacing: '-0.5px' }}>PEMBAYARAN BERHASIL</h2>

      {/* COMPACT THERMAL RECEIPT */}
      {order && (
        <div className="w-full max-w-[380px] mb-6 px-4">
          <div ref={receiptRef} className="thermal-receipt" style={{ background: '#fff', color: '#1a1a1a', padding: '48px 32px', borderRadius: '2px', textAlign: 'left', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 950, letterSpacing: '-1.5px', margin: 0, color: '#000' }}>DRIP<span style={{ color: '#8b5cf6' }}>CLIENT</span></h1>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '3px', color: '#888', marginTop: '6px', fontWeight: 800 }}>Premium Virtual Goods</p>
            </div>

            {/* Meta Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px', paddingBottom: '24px', borderBottom: '2px dashed #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ color: '#aaa', textTransform: 'uppercase' }}>Invoice ID</span>
                <span style={{ color: '#000', fontFamily: 'monospace' }}>{order.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ color: '#aaa', textTransform: 'uppercase' }}>Tanggal</span>
                <span style={{ color: '#000' }}>{new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ color: '#aaa', textTransform: 'uppercase' }}>Pelanggan</span>
                <span style={{ color: '#000' }}>{order.customerName || 'GUEST'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ color: '#aaa', textTransform: 'uppercase' }}>Metode</span>
                <span style={{ color: '#8b5cf6' }}>{order.paymentMethod || 'WIJAYAPAY'}</span>
              </div>
            </div>

            {/* Items & Keys Integrated */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#bbb', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1.5px' }}>Rincian Pembelian</div>

              {order.items.map((item: any, i: number) => (
                <div key={i} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#000', lineHeight: 1.15 }}>{item.productName}</div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>{item.quantity} Unit x Rp {item.price.toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#000' }}>Rp {item.total.toLocaleString('id-ID')}</div>
                  </div>

                  {/* Keys Container */}
                  <div style={{ marginTop: '16px', textAlign: 'left' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, marginBottom: '6px', color: '#1a1a1a', textTransform: 'uppercase' }}>{item.productName}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {order.isExpired ? (
                        <div style={{
                          padding: '10px',
                          background: '#f8f8f8',
                          borderRadius: '8px',
                          fontSize: '9px',
                          color: '#666',
                          border: '1px dashed #ccc',
                          textAlign: 'center'
                        }}>
                          <ShieldCheck size={12} style={{ marginBottom: '4px', color: 'var(--accent-green)' }} />
                          <br />
                          Kunci disembunyikan demi keamanan.<br />Silakan cek email Anda.
                        </div>
                      ) : (
                        item.keys && item.keys.length > 0 ? (
                          item.keys.map((key: string, kIdx: number) => (
                            <div
                              key={kIdx}
                              onClick={() => handleCopy(key)}
                              style={{
                                padding: '8px 12px',
                                background: '#f0f0f0',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: '#000',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                border: '1px solid #ddd'
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{key}</span>
                              {copied === key ? <Check size={12} color="#00aa00" /> : <Copy size={12} color="#999" />}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '10px', color: '#aaa', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Memproses kunci...</div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation */}
            <div style={{ borderTop: '2px solid #000', paddingTop: '28px', marginBottom: '44px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Bayar</span>
                <span style={{ fontSize: '24px', fontWeight: 1000, color: '#000' }}>Rp {order.grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Stamp */}
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <div style={{ display: 'inline-block', border: '4px solid #22c55e', color: '#22c55e', padding: '8px 24px', fontSize: '18px', fontWeight: 1000, borderRadius: '4px', transform: 'rotate(-6deg)', textTransform: 'uppercase', letterSpacing: '3px' }}>LUNAS / PAID</div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', borderTop: '2px dashed #eee', paddingTop: '28px' }}>
              <p style={{ fontSize: '9px', color: '#bbb', lineHeight: 1.7, maxWidth: '80%', margin: '0 auto' }}>
                Simpan struk ini sebagai bukti pembelian sah Anda.
              </p>
              <div style={{ marginTop: '24px', fontSize: '11px', fontWeight: 900, color: '#000', letterSpacing: '1.5px' }}>WWW.DRIPCLIENT.ID</div>
            </div>

            {/* Decorative Edge */}
            <div style={{ position: 'absolute', bottom: '-10px', left: 0, width: '100%', height: '10px', background: 'radial-gradient(circle, transparent, transparent 5px, #fff 5px, #fff)', backgroundSize: '20px 20px', transform: 'rotate(180deg)' }}></div>
          </div>
        </div>
      )}

      {/* CONSOLIDATED ACTION CARD */}
      <div className="card-glass w-full max-w-[340px] p-6 mb-10" style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        marginTop: '10px',
        paddingTop: '10px'
      }}>
        <button
          onClick={downloadReceipt}
          className="btn btn-primary"
          style={{
            height: '46px',
            borderRadius: '14px',
            fontSize: '12px',
            color: 'white',
            fontWeight: 800,
            padding: '0 24px',
            width: '240px',
            boxShadow: '0 8px 20px rgba(209, 0, 255, 0.2)'
          }}
        >
          <Download size={16} /> SIMPAN INVOICE (IMAGE)
        </button>

        <Link href="/" className="btn btn-primary" style={{
          height: '46px',
          borderRadius: '14px',
          fontSize: '12px',
          fontWeight: 800,
          padding: '0 24px',
          width: '240px',
          background: 'var(--accent-green)',
          color: 'white',
          boxShadow: '0 8px 20px rgba(209, 0, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <ShoppingBag size={16} /> LANJUT BELANJA
        </Link>

        <Link href="/" className="btn btn-outline" style={{
          height: '46px',
          borderRadius: '14px',
          fontSize: '12px',
          fontWeight: 800,
          padding: '0 24px',
          width: '240px',
          borderColor: 'var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          BALIK KE BERANDA <ArrowRight size={16} />
        </Link>

        <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
            Salinan invoice & license key telah dikirimkan ke email Anda.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            <Mail size={14} /> Cek folder Spam / Inbox
          </div>
        </div>
      </div>

      <div className="mt-20 w-full">
        <Footer />
      </div>

      <style jsx>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.1); }
          70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .glow-pulse {
          animation: pulse-green 3s infinite;
        }
        .shadow-glow {
          box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="mobile-container cylindrical-container" style={{ background: 'var(--bg-primary)' }}>
      <div className="sticky-hero" style={{ paddingBottom: '16px', background: 'linear-gradient(to bottom, var(--bg-primary) 80%, transparent)' }}>
        <header className="landing-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '32px' }} />
            <h1 className="logo-text" style={{ fontSize: '18px', margin: 0, color: 'var(--accent-green)' }}>DRIP<span style={{ color: "var(--text-primary)" }}>CLIENT</span></h1>
          </Link>
        </header>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="loading-spinner" />
          <p className="mt-4 text-muted font-bold text-xs tracking-widest uppercase">Membangun Invoice...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
