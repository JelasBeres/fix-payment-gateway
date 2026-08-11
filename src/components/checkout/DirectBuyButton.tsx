"use client";

import { useState } from "react";
import { ShoppingCart, PlusCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
}

export default function ProductActionButtons({ product }: { product: Product }) {
  const { addToCart, setIsOpen } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const handleBuyNow = () => {
    addToCart(product);
    setIsOpen(true);
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleAddToCart}
        className={`btn ${isAdded ? 'btn-success' : 'btn-outline'}`}
        style={{ flex: 1, minWidth: '90px' }}
        title="Tambah ke Keranjang"
      >
        {isAdded ? (
          <>
            <PlusCircle size={18} className="success-pop" />
            <span>ADDED</span>
          </>
        ) : (
          <>
            <PlusCircle size={18} />
            <span>CART</span>
          </>
        )}
      </button>

      <button 
        onClick={handleBuyNow}
        className="btn btn-primary"
        style={{ flex: 2 }}
      >
        <ShoppingCart size={18} />
        <span>BUY NOW</span>
      </button>
    </div>
  );
}
