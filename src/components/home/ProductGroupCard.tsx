"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ProductActionButtons from "@/components/checkout/DirectBuyButton";
import { X, Clock, ShoppingCart, CreditCard, ChevronRight, CheckCircle2, Minus, Plus, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CheckoutModal from "@/components/checkout/CheckoutModal";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  durationDays?: number | null;
  features: string[];
  description: string;
  availableKeys: number;
  stock: number;
  category?: { name: string };
}

interface ProductGroupCardProps {
  baseName: string;
  products: ProductVariant[];
}

export default function ProductGroupCard({ baseName, products }: ProductGroupCardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { addToCart, setIsOpen } = useCart();

  useEffect(() => { setMounted(true); }, []);

  // Sort variants by price ascending
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedProducts[0]?.price || 0;
  const baseProduct = sortedProducts[0];

  const openModal = () => {
    setStep(1);
    setSelectedVariant(null);
    setQuantity(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const selectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
    setStep(2);
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price,
        imageUrl: selectedVariant.imageUrl,
      });
    }
    setIsOpen(true);
    closeModal();
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price,
        imageUrl: selectedVariant.imageUrl,
      });
    }
    closeModal();
    setShowCheckout(true);
  };

  // Extract duration label from name
  const isOutOfStock = (p: any) => {
    // If stock is -1 (managed by keys), check keys only
    // User wants to guard if stock is 1 or less (except -1)
    if (p.stock !== undefined && p.stock !== -1 && p.stock <= 1) return true;
    if (p.availableKeys !== undefined && p.availableKeys <= 1) return true;
    return false;
  };

  const groupIsOutOfStock = sortedProducts.every(p => isOutOfStock(p));

  // Extract duration label from name
  const getDurationLabel = (variant: ProductVariant) => {
    let label = variant.name.replace(baseName, '').trim();
    label = label.replace(/^[-|]+/, '').trim();
    if (!label) label = variant.durationDays ? `${variant.durationDays} Hari` : 'Default';
    return label;
  };

  // Single product – render with same layout as grouped
  if (products.length === 1) {
    const p = products[0];
    const outOfStock = isOutOfStock(p);

    return (
      <div className="product-card-wrapper">
        <div className="product-card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'flex-start', opacity: outOfStock ? 0.7 : 1 }}>
          {/* Left Column: Image + Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, width: '100px' }}>
            {p.imageUrl && (
              <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', filter: outOfStock ? 'grayscale(100%)' : 'none' }}>
                <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            {/* Badge hidden for single product as requested */}
            <div style={{ height: '24px' }} />
          </div>

          {/* Right Column: Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: "6px", flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px', background: outOfStock ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                {outOfStock ? "OUT OF STOCK" : (p.category?.name || "Premium")}
              </span>
              <div style={{ textAlign: 'right' }}>
                <span className="price-text" style={{ fontSize: '15px', color: outOfStock ? 'var(--text-muted)' : 'var(--accent-green)' }}>Rp {new Intl.NumberFormat("id-ID").format(p.price)}</span>
              </div>
            </div>

            <h4 className="product-title" style={{ fontSize: '15px', marginBottom: '4px', color: outOfStock ? 'var(--text-muted)' : 'var(--text-bright)' }}>{p.name}</h4>
            <p className="product-desc" style={{ fontSize: '11px', marginBottom: '8px', WebkitLineClamp: 2 }}>{p.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>999+ Terjual</span>
            </div>

            <button
              onClick={() => {
                if (outOfStock) return;
                setSelectedVariant(p);
                setStep(2);
                setShowModal(true);
              }}
              className={outOfStock ? "btn btn-outline" : "btn btn-primary"}
              style={{ width: '100%', height: '36px', fontSize: '12px', padding: '0 12px', cursor: outOfStock ? 'not-allowed' : 'pointer', borderColor: outOfStock ? 'var(--border-subtle)' : 'var(--accent-green)', color: outOfStock ? 'var(--text-muted)' : '' }}
              disabled={outOfStock}
            >
              {outOfStock ? <Package size={14} /> : <ShoppingCart size={14} />}
              <span>{outOfStock ? "STOK HABIS" : "BELI SEKARANG"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Product Card */}
      <div className="product-card-wrapper">
        <div className="product-card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'flex-start', opacity: groupIsOutOfStock ? 0.7 : 1 }}>
          {/* Left Column: Image + Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, width: '100px' }}>
            {baseProduct?.imageUrl && (
              <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <img src={baseProduct.imageUrl} alt={baseName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            {/* Duration count badge - moved here */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 6px', borderRadius: '6px', background: 'var(--accent-glow)', border: '1px solid var(--border-subtle)', fontSize: '9px', color: 'var(--accent-green)', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
              <Clock size={10} />
              {sortedProducts.length} DURASI
            </div>
          </div>

          {/* Right Column: Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', marginBottom: "6px", flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>{baseProduct?.category?.name || "Premium"}</span>
              <div style={{ textAlign: 'right' }}>
                <span className="price-text" style={{ fontSize: '15px' }}>Rp {new Intl.NumberFormat("id-ID").format(lowestPrice)}</span>
              </div>
            </div>

            <h4 className="product-title" style={{ fontSize: '15px', marginBottom: '4px' }}>{baseName}</h4>
            <p className="product-desc" style={{ fontSize: '11px', marginBottom: '8px', WebkitLineClamp: 2 }}>{baseProduct?.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>999+ Terjual</span>
            </div>

            <button
              onClick={openModal}
              className="btn btn-primary"
              style={{ width: '100%', height: '36px', fontSize: '12px', padding: '0 12px' }}
            >
              <ShoppingCart size={14} />
              <span>BELI SEKARANG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Step Popup — rendered via Portal to document.body */}
      {showModal && mounted && createPortal(
        <div
          className="purchase-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="purchase-modal-content fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle - only visible on mobile via CSS */}
            <div className="mobile-drag-handle" style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '999px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Step Indicator */}
            <div style={{ padding: '16px 24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '14px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '2px', background: 'var(--border-subtle)', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', width: step === 2 ? '100px' : '0px', height: '2px', background: 'var(--accent-green)', zIndex: 0, transition: 'width 0.4s ease' }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', zIndex: 1, marginRight: '70px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', background: step >= 1 ? 'var(--accent-green)' : 'var(--bg-primary)', color: step >= 1 ? '#000' : 'var(--text-muted)', border: step >= 1 ? 'none' : '2px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                    {step > 1 ? <CheckCircle2 size={14} /> : '1'}
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: step >= 1 ? 'var(--accent-green)' : 'var(--text-muted)', letterSpacing: '0.5px' }}>DURASI</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', zIndex: 1 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', background: step >= 2 ? 'var(--accent-green)' : 'var(--bg-primary)', color: step >= 2 ? '#000' : 'var(--text-muted)', border: step >= 2 ? 'none' : '2px solid var(--border-subtle)', transition: 'all 0.3s ease' }}>
                    2
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: step >= 2 ? 'var(--accent-green)' : 'var(--text-muted)', letterSpacing: '0.5px' }}>KONFIRMASI</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '2px', marginBottom: '4px' }}>
                    {step === 1 ? '🕐 PILIH DURASI' : '✅ KONFIRMASI PESANAN'}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-bright)', margin: 0, lineHeight: 1.2 }}>{baseName}</h3>
                </div>
                <button onClick={closeModal} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              {step === 1 && (
                <div style={{ maxHeight: '45vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
                  {sortedProducts.map((variant) => {
                    const label = getDurationLabel(variant);
                    const variantOutOfStock = isOutOfStock(variant);
                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          if (variantOutOfStock) return;
                          selectVariant(variant);
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 14px', 
                          borderRadius: '12px', 
                          border: '1px solid var(--border-subtle)', 
                          background: variantOutOfStock ? 'rgba(0,0,0,0.05)' : 'var(--bg-elevated)', 
                          cursor: variantOutOfStock ? 'not-allowed' : 'pointer', 
                          transition: 'all 0.2s ease', 
                          width: '100%', 
                          textAlign: 'left', 
                          flexShrink: 0,
                          opacity: variantOutOfStock ? 0.5 : 1
                        }}
                        onMouseEnter={e => { 
                          if (variantOutOfStock) return;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-green)'; 
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-glow)'; 
                        }}
                        onMouseLeave={e => { 
                          if (variantOutOfStock) return;
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; 
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={14} color={variantOutOfStock ? "var(--text-muted)" : "var(--accent-green)"} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: variantOutOfStock ? 'var(--text-muted)' : 'var(--text-bright)' }}>{label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {variantOutOfStock ? 'Stok sedang habis' : `Masa aktif ${label.toLowerCase()}`}
                              </div>
                              {!variantOutOfStock && (
                                <div style={{ fontSize: '10px', background: 'var(--bg-primary)', padding: '1px 6px', borderRadius: '4px', color: 'var(--accent-green)', fontWeight: 700, border: '1px solid var(--border-subtle)' }}>
                                  Stok: {variant.availableKeys}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: variantOutOfStock ? 'var(--text-muted)' : 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                            {variantOutOfStock ? "SOLD OUT" : `Rp ${new Intl.NumberFormat("id-ID").format(variant.price)}`}
                          </span>
                          {!variantOutOfStock && <ChevronRight size={14} color="var(--text-muted)" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && selectedVariant && (
                <div>
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-green)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {selectedVariant.imageUrl && (
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                          <img src={selectedVariant.imageUrl} alt={selectedVariant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-bright)' }}>{baseName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700, marginTop: '2px' }}>
                          <Clock size={11} />
                          {getDurationLabel(selectedVariant)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL HARGA</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-green)' }}>
                        Rp {new Intl.NumberFormat("id-ID").format(selectedVariant.price * quantity)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-bright)' }}>Jumlah Pesanan</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sedia: {selectedVariant.availableKeys} kunci</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: quantity <= 1 ? 'var(--text-muted)' : 'var(--text-bright)' }}
                        disabled={quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-bright)', minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                      <button 
                        onClick={() => setQuantity(q => Math.min(selectedVariant.availableKeys - 1, q + 1))}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: quantity >= (selectedVariant.availableKeys - 1) ? 'var(--text-muted)' : 'var(--text-bright)' }}
                        disabled={quantity >= (selectedVariant.availableKeys - 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedVariant.features && selectedVariant.features.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>FITUR TERMASUK</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedVariant.features.slice(0, 4).map((f, i) => (
                          <span key={i} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', background: 'var(--accent-glow)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            • {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={handleBuyNow} className="btn btn-primary" style={{ width: '100%', height: '52px', fontSize: '15px', fontWeight: 900 }}>
                      <CreditCard size={18} /> BAYAR SEKARANG
                    </button>
                    <button onClick={handleAddToCart} className="btn btn-outline" style={{ width: '100%', height: '44px', fontSize: '13px' }}>
                      <ShoppingCart size={16} /> Tambah ke Keranjang
                    </button>
                  </div>

                  <button
                    onClick={() => { setStep(1); setSelectedVariant(null); }}
                    style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}
                  >
                    ← Ganti durasi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showCheckout && mounted && createPortal(
        <CheckoutModal isCartCheckout={true} onClose={() => setShowCheckout(false)} />,
        document.body
      )}
    </>
  );
}
