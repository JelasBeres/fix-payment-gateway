"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, CreditCard, Mail, User, ArrowRight, ShoppingCart, ShieldCheck, Copy, Check, QrCode, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/utils/currency";
import { ADMIN_FEE } from "@/lib/payment/constants";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

interface PaymentMethod {
  group: string;
  code: string;
  name: string;
  image: string;
  feeAmount: string | null;
  feePercent: string | null;
  typeFee: string;
}

export default function CheckoutModal({
  product,
  onClose,
  isCartCheckout = false
}: {
  product?: Product,
  onClose: () => void,
  isCartCheckout?: boolean
}) {
  const { cart, totalPrice, clearCart } = useCart();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [payment, setPayment] = useState<{ orderId: string; data: any } | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const pollingRef = useRef(false);

  const items = isCartCheckout ? cart : (product ? [{ ...product, quantity: 1 }] : []);
  const subtotal = isCartCheckout ? totalPrice : (product?.price || 0);
  const grandTotal = subtotal + ADMIN_FEE;

  // For customer-fee channels (e.g. QRIS) the gateway adds its fee on top of
  // the nominal, so we estimate it here to show the customer the real charge.
  const selected = methods.find((m) => m.code === selectedMethod);
  const gatewayFee = useMemo(() => {
    if (!selected || selected.typeFee !== "customer") return 0;
    const percent = Number(selected.feePercent ?? 0);
    const fixed = Number(selected.feeAmount ?? 0);
    return Math.ceil((grandTotal * percent) / 100) + fixed;
  }, [selected, grandTotal]);
  const estimatedTotal = grandTotal + gatewayFee;

  // Load active payment channels from WijayaPay.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.methods) && data.methods.length > 0) {
          setMethods(data.methods);
          const defaultQris = data.methods.find((m: any) => m.code === "QRIS");
          setSelectedMethod(defaultQris?.code ?? data.methods[0].code);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const pollStatus = useCallback(async () => {
    if (!payment || pollingRef.current) return;
    pollingRef.current = true;
    try {
      const res = await fetch(`/api/checkout/status?ref_id=${encodeURIComponent(payment.orderId)}`);
      const data = await res.json().catch(() => ({}));
      if (data.status === "paid") {
        window.location.href = `/order/success?order_id=${encodeURIComponent(payment.orderId)}`;
        return;
      }
      if (data.status === "expired") {
        setError("Pembayaran sudah kedaluwarsa. Silakan buat pesanan baru.");
      }
    } catch {
      // transient error, keep polling
    } finally {
      pollingRef.current = false;
    }
  }, [payment]);

  // Auto-check payment status while the payment screen is shown.
  useEffect(() => {
    if (!payment) return;
    const t = setInterval(pollStatus, 8000);
    return () => clearInterval(t);
  }, [payment, pollStatus]);

  const handleCheckNow = async () => {
    setChecking(true);
    await pollStatus();
    setChecking(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i: any) => ({ id: i.id, quantity: i.quantity })),
          email,
          name,
          paymentMethod: selectedMethod || "QRIS",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");

      if (isCartCheckout) localStorage.setItem('pending_cart_checkout', 'true');
      setPayment({ orderId: data.orderId, data: data.payment });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value.replace(" ", "T"));
    return isNaN(d.getTime()) ? value : d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };

  const totalBayar = Number(payment?.data?.total_bayar ?? grandTotal);

  // ---------- PAYMENT SCREEN ----------
  if (payment) {
    const p = payment.data || {};
    const qrImage = p.qr_image;
    const qrString = p.qr_string;
    const vaNumber = p.va_number;
    const paymentCode = p.payment_code;
    const instructions = p.tutorial_pembayaran;
    const paymentMethodLabel = p.payment_name || selectedMethod;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
          <div className="section-header" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: "15px", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} color="var(--accent-green)" />
              Selesaikan Pembayaran
            </h3>
            <button onClick={onClose} className="btn-icon">
              <X size={20} />
            </button>
          </div>

          <div className="card" style={{
            marginBottom: "12px",
            background: 'var(--bg-primary)',
            borderStyle: "dashed",
            overflow: 'visible',
            padding: '16px'
          }}>
            <div className="flex flex-col items-center gap-3">
              <div className="flex justify-between items-center w-full text-sm">
                <span className="text-muted">Metode</span>
                <span className="font-bold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {p.payment_image && <img src={p.payment_image} alt="" style={{ height: '18px', width: 'auto' }} />}
                  {paymentMethodLabel}
                </span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span className="text-muted">Total Bayar</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {formatRupiah(totalBayar)}
                </span>
              </div>

              {qrImage && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                  <img src={qrImage} alt="QRIS" style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '8px' }} />
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Scan QR di atas dengan aplikasi pembayaran (GoPay, OVO, DANA, m-Banking, dll).
                  </p>
                </div>
              )}

              {qrString && (
                <button
                  onClick={() => handleCopy(qrString)}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', height: '34px', padding: '0 14px', borderColor: 'var(--border-strong)' }}
                >
                  {copied === qrString ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  {copied === qrString ? " QR Tersalin" : " Salin Kode QR"}
                </button>
              )}

              {(vaNumber || paymentCode) && (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    Kode Pembayaran
                  </p>
                  <button
                    onClick={() => handleCopy(vaNumber || paymentCode || "")}
                    className="btn btn-outline btn-full"
                    style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', height: '44px', borderColor: 'var(--border-strong)' }}
                  >
                    {copied === (vaNumber || paymentCode) ? <Check size={16} color="var(--accent-green)" /> : <Copy size={16} />}
                    <span style={{ letterSpacing: '2px' }}>{vaNumber || paymentCode}</span>
                  </button>
                </div>
              )}

              {instructions && (
                <div style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px', maxHeight: '140px', overflowY: 'auto' }} className="custom-scrollbar">
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{instructions}</p>
                </div>
              )}

              <div className="flex justify-between items-center w-full" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Berlaku s.d.</span>
                <span>{formatDate(p.expired)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger fade-in" style={{ padding: '8px', fontSize: '12px', marginBottom: '10px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleCheckNow}
              disabled={checking}
              className="btn btn-primary btn-full btn-lg"
              style={{ height: '52px', fontSize: '14px' }}
            >
              {checking ? <span className="spinner"></span> : (<><RefreshCw size={18} /> Saya Sudah Bayar</>)}
            </button>
            <button
              onClick={() => { setPayment(null); setLoading(false); setError(""); }}
              className="btn btn-outline btn-full"
              style={{ height: '44px', fontSize: '12px', borderColor: 'var(--border-subtle)' }}
            >
              <ArrowLeft size={16} /> Ganti Metode / Buat Ulang
            </button>
          </div>

          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              License Key akan dikirim otomatis setelah pembayaran sukses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- CHECKOUT FORM ----------
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: "15px", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} color="var(--accent-green)" />
            {isCartCheckout ? 'Checkout Keranjang' : 'Beli Langsung'}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="card" style={{
          marginBottom: "12px",
          background: 'var(--bg-primary)',
          borderStyle: "dashed",
          overflow: 'visible',
          padding: '16px'
        }}>
          <div className="flex flex-col gap-2">
            {/* 1. Area Daftar Barang (Scrollable) */}
            <div style={{ maxHeight: '90px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
              <div className="flex flex-col gap-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex gap-3 flex-1">
                      {item.imageUrl && (
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.quantity}x {formatRupiah(item.price)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Garis Pembatas */}
            <div className="divider" style={{ margin: '6px 0' }}></div>

            {/* 3. Rincian Biaya */}
            <div className="flex justify-between items-center text-xs text-muted">
              <span>Subtotal:</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted">
              <span>Biaya Admin (Layanan):</span>
              <span>{formatRupiah(ADMIN_FEE)}</span>
            </div>

            <div className="flex justify-between items-center" style={{ marginTop: '2px' }}>
              <span className="text-sm font-bold">TOTAL BAYAR:</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)' }}>
                {formatRupiah(estimatedTotal)}
              </span>
            </div>
            {gatewayFee > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>
                Termasuk fee {selected?.name} (Rp {formatRupiah(gatewayFee)})
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleCheckout} className="flex flex-col gap-3">
          {error && (
            <div className="alert alert-danger fade-in" style={{ padding: '8px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px' }}><User size={11} style={{ marginRight: "4px" }} /> Nama Anda</label>
            <input
              type="text"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ height: '40px', fontSize: '13px' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px' }}><Mail size={11} style={{ marginRight: "4px" }} /> Email Pengiriman</label>
            <input
              type="email"
              className="input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ height: '40px', fontSize: '13px' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px' }}><CreditCard size={11} style={{ marginRight: "4px" }} /> Metode Pembayaran</label>
            {methods.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Memuat metode pembayaran...
              </div>
            ) : (
              <div className="flex flex-col gap-2 custom-scrollbar" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {methods.map((m) => (
                  <button
                    type="button"
                    key={m.code}
                    onClick={() => setSelectedMethod(m.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selectedMethod === m.code ? 'var(--accent-green)' : 'var(--border-subtle)'}`,
                      background: selectedMethod === m.code ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {m.image && <img src={m.image} alt="" style={{ height: '20px', width: 'auto' }} />}
                      {m.name}
                    </span>
                    <span style={{ color: selectedMethod === m.code ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {selectedMethod === m.code ? '✓' : '○'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: "8px" }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || methods.length === 0}
              style={{ height: '52px', fontSize: '14px' }}
            >
              {loading ? <span className="spinner"></span> : (
                <>
                  <CreditCard size={18} /> BAYAR SEKARANG ({formatRupiah(estimatedTotal)})
                </>
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center", display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent-green)' }}>
            <ShieldCheck size={12} /> Pembayaran Terenkripsi & Aman oleh WijayaPay
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            License Key akan di-generate otomatis setelah pembayaran sukses.
          </p>
        </div>
      </div>
    </div>
  );
}
