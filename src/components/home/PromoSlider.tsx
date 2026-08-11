"use client";

import React, { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Zap } from "lucide-react";

interface Promo {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string;
}

interface PromoSliderProps {
  promos: Promo[];
}

export default function PromoSlider({ promos }: PromoSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false })
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const totalSlides = promos.length + 1;

  return (
    <div className="promo-slider-container">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {/* Static First Slide */}
          <div className="embla__slide">
            <div className="hero-card card-glass" style={{ margin: 0, width: '100%', aspectRatio: '2.1 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius: '20px' }}>
              <h2 style={{ fontSize: "16px", marginBottom: "4px", fontWeight: 800 }}>DIGITAL PREMIUM TOOLS</h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", padding: '0 20px' }}>
                Akses instan ke key premium dengan sistem otomatis.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <div className="hero-badge" style={{ fontSize: '10px' }}>
                  <ShieldCheck size={12} /> Safe
                </div>
                <div className="hero-badge" style={{ fontSize: '10px' }}>
                  <Zap size={12} /> Instant
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Promo Slides */}
          {promos.map((promo) => (
            <div className="embla__slide" key={promo.id}>
              <Link href={promo.linkUrl} target="_blank" className="promo-slide-link">
                <div className="promo-card">
                  <img 
                    src={promo.imageUrl} 
                    alt={promo.title || "Promo"} 
                    className="promo-image"
                  />
                  {promo.title && (
                    <div className="promo-overlay">
                      <div className="promo-content">
                        <span className="promo-label">SPECIAL OFFER</span>
                        <h3 className="promo-title">{promo.title}</h3>
                        <div className="promo-action">
                          Learn More <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation Dots */}
      {totalSlides > 1 && (
        <div className="promo-dots">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div 
              key={index} 
              className={`promo-dot ${index === selectedIndex ? "active" : ""}`} 
              onClick={() => emblaApi?.scrollTo(index)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .promo-slider-container {
          position: relative;
          width: 100%;
          margin-top: 16px;
          margin-bottom: 20px;
        }
        .embla {
          overflow: hidden;
          border-radius: 20px;
          /* Removed box shadow from here to prevent clipping sharp shadows */
        }
        .embla__container {
          display: flex;
        }
        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
          position: relative;
        }
        .promo-slide-link {
          display: block;
          text-decoration: none;
        }
        .promo-card {
          position: relative;
          width: 100%;
          aspect-ratio: 2.1 / 1;
          background: var(--bg-card);
          overflow: hidden;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .promo-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: conic-gradient(from 0deg, transparent, var(--accent-green), transparent 60%);
          animation: rotate 4s linear infinite;
          opacity: 0.5;
          z-index: 0;
        }
        .promo-card::after {
          content: '';
          position: absolute;
          inset: 1px;
          background: var(--bg-card);
          border-radius: 19px;
          z-index: 1;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .promo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 2;
        }
        .promo-slide-link:hover .promo-image {
          transform: scale(1.05);
        }
        .promo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top, 
            rgba(0,0,0,0.95) 0%, 
            rgba(0,0,0,0.4) 40%,
            rgba(0,0,0,0.1) 100%
          );
          display: flex;
          align-items: flex-end;
          padding: 24px;
          z-index: 3;
        }
        .promo-content {
          color: #ffffff !important;
          text-shadow: 0 4px 15px rgba(0,0,0,0.6);
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
        }
        .promo-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--accent-green) !important;
          letter-spacing: 3px;
          display: block;
          margin-bottom: 8px;
          text-transform: uppercase;
          opacity: 0.9;
        }
        .promo-title {
          font-size: 18px;
          font-weight: 900;
          color: #ffffff !important;
          margin: 0 0 14px 0;
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }
        .promo-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          color: #ffffff !important;
          padding: 10px 20px;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .promo-slide-link:hover .promo-action {
          background: var(--accent-green);
          color: #000000 !important;
          border-color: var(--accent-green);
        }
        .promo-dots {
          position: absolute;
          top: 16px;
          right: 20px;
          display: flex;
          gap: 6px;
          z-index: 10;
        }
        .promo-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-subtle);
          transition: all 0.3s ease;
        }
        .promo-dot.active {
          background: var(--accent-green);
          box-shadow: 0 0 8px var(--accent-green);
          width: 16px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
