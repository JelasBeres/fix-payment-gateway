"use client";

import { useState } from "react";
import { X, CreditCard, Mail, User, ArrowRight, ShoppingCart, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/utils/currency";

const ADMIN_FEE = 2500;

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
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

  const items = isCartCheckout ? cart : (product ? [{ ...product, quantity: 1 }] : []);
  const subtotal = isCartCheckout ? totalPrice : (product?.price || 0);
  const grandTotal = subtotal + ADMIN_FEE;

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
          adminFee: ADMIN_FEE,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan");

      const snap = (window as any).snap;

      if (data.token && snap) {
        if (isCartCheckout) localStorage.setItem('pending_cart_checkout', 'true');
        // Small delay to ensure any previous snap instance is cleared
        setTimeout(() => {
          try {
            snap.pay(data.token, {
              onSuccess: function (result: any) {
                window.location.href = `/order/success?order_id=${data.orderId}`;
              },
              onPending: function (result: any) {
                alert("Pesanan Diterima! Segera selesaikan pembayaran Anda sesuai instruksi di layar.");
                onClose();
              },
              onError: function (result: any) {
                console.error("Snap Error:", result);
                setError("Terjadi kesalahan saat memproses pembayaran. Mencoba mengalihkan ke halaman pembayaran...");
                setTimeout(() => {
                  window.location.href = data.paymentUrl;
                }, 2000);
              },
              onClose: function () {
                setLoading(false);
              },
            });
          } catch (snapErr) {
            console.error("Snap Launch Error:", snapErr);
            window.location.href = data.paymentUrl;
          }
        }, 100);
      } else if (data.paymentUrl) {
        if (isCartCheckout) localStorage.setItem('pending_cart_checkout', 'true');
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Gagal menginisialisasi pembayaran");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

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
          padding: '16px' // Lebih rapat
        }}>
          <div className="flex flex-col gap-2">
            {/* 1. Area Daftar Barang (Scrollable) - Slim Version */}
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
                {formatRupiah(grandTotal)}
              </span>
            </div>
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

          <div style={{ marginTop: "8px" }}>
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ height: '52px', fontSize: '14px' }}
            >
              {loading ? <span className="spinner"></span> : (
                <>
                  <CreditCard size={18} /> BAYAR SEKARANG ({formatRupiah(grandTotal)})
                </>
              )}
            </button>
          </div>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center", display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', color: 'var(--accent-green)' }}>
            <ShieldCheck size={12} /> Pembayaran Terenkripsi & Aman oleh Midtrans
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            License Key akan di-generate otomatis setelah pembayaran sukses.
          </p>
        </div>
      </div>
    </div>
  );
}
