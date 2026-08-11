"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingBag, X, Plus, Minus, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils/currency";
import CheckoutModal from "../checkout/CheckoutModal";

export default function CartDrawer() {
  const { cart, totalItems, totalPrice, updateQuantity, removeFromCart, isOpen, setIsOpen } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  if (totalItems === 0) return null;

  return (
    <>
      {/* Floating Trigger */}
      <div 
        className={`cart-trigger glow-pulse ${pulse ? 'pulse' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <ShoppingBag size={24} />
        <span className="cart-badge">{totalItems}</span>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ height: 'auto', maxHeight: '80vh' }}>
            <div className="section-header">
              <span className="section-title">Keranjang Belanja</span>
              <button onClick={() => setIsOpen(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {cart.map((item: any) => (
                <div key={item.id} className="card-glass" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {item.imageUrl && (
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-green)' }}>{formatRupiah(item.price)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2" style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn-icon-sm">
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn-icon-sm">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="btn-icon" style={{ color: 'var(--danger)' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-muted">Total Bayar:</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-green)' }}>{formatRupiah(totalPrice)}</span>
            </div>

            <button 
              className="btn btn-primary btn-full btn-lg"
              onClick={() => {
                setIsOpen(false);
                setShowCheckout(true);
              }}
            >
              <CreditCard size={18} /> CHECKOUT SEKARANG
            </button>
          </div>
        </div>
      )}

      {/* Reusing CheckoutModal but with cart logic if needed */}
      {showCheckout && (
        <CheckoutModal 
          // Passing a special "cart" product or updating the modal to handle context
          isCartCheckout={true}
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </>
  );
}
