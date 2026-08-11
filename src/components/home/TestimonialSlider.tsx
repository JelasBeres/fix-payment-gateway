"use client";

import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, MessageSquare, ThumbsUp, ShieldCheck } from "lucide-react";

const names = [
  "Budi Santoso", "Andi Wijaya", "Siti Aminah", "Agus Prasetyo", "Putri Lestari",
  "Hendra Setiawan", "Rina Kusuma", "Eko Raharjo", "Maya Indah", "Dedi Kurniawan",
  "Siska Amelia", "Bambang Hermawan", "Ani Suryani", "Doni Saputra", "Fitri Handayani",
  "Guntur Pratama", "Hani Puspita", "Indra Jaya", "Junaedi", "Kiki Saputri",
  "Lucky Ramadhan", "Mega Utami", "Nana Marlina", "Okky Setiawan", "Panji Nugroho",
  "Qory Sandioriva", "Raka Aditya", "Susi Susanti", "Taufik Hidayat", "Udin Sedunia",
  "Vina Panduwinata", "Wawan Kurniawan", "Xena", "Yanto", "Zaki", "Ahmad",
  "Bagus", "Cahyo", "Deni", "Erna", "Fajar", "Gilang", "Heru", "Ika",
  "Joko", "Kusuma", "Laras", "Mamat", "Neneng", "Opik"
];

const comments = [
  "Mantap bang key nya langsung masuk, fast respon parah!",
  "Udah 3 bulan pake aman terus, gokil pelayanannya.",
  "Seller terpercaya, jangan ragu beli disini guys.",
  "Gak sampe 1 menit key udah ada di email. Edan!",
  "Softwarenya aman banget, no banned beneran.",
  "Awalnya ragu, tapi ternyata beneran amanah. Thanks gan.",
  "Harga termurah dibanding lapak sebelah, kualitas sama.",
  "Adminnya ramah banget dibantuin sampe bisa.",
  "Support 24 jam emang bukan kaleng-kaleng.",
  "Langganan terus disini pokoknya.",
  "Produk berkualitas, fitur lengkap kap kap.",
  "Gak nyesel beli disini, worth it banget harganya.",
  "Prosesnya cepet banget, gak pake ribet.",
  "Terbaik lah pokoknya, bintang 5 buat seller.",
  "Key nya work 100%, gak ada kendala sama sekali.",
  "Recomended seller buat yang mau push rank aman.",
  "Pelayanan bintang lima, harga kaki lima.",
  "Auto win pake ini, gampang banget settingnya.",
  "Gak nyangka seaman ini, mantap jiwa!",
  "Website nya keren, transaksinya juga gampang."
];

// Deterministic pseudo-random to avoid SSR hydration mismatch
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Generated once at module level — same on server and client
const testimonials = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  name: names[i % names.length],
  comment: comments[i % comments.length],
  likes: Math.floor(seededRandom(i * 2) * 500) + 120,
  time: `${Math.floor(seededRandom(i * 2 + 1) * 50) + 10}m ago`,
}));

export default function TestimonialSlider() {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 3500, stopOnInteraction: false })
  ]);

  return (
    <div className="testimonial-container" style={{ marginBottom: '20px' }}>
      <div className="card-glass" style={{ 
        borderRadius: '24px', 
        padding: '24px', 
        border: '1px solid var(--border-strong)', 
        background: 'linear-gradient(135deg, var(--bg-card-glass) 0%, rgba(209, 0, 255, 0.05) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Element */}
        <div style={{ 
          position: 'absolute', 
          top: '-20%', 
          right: '-10%', 
          width: '150px', 
          height: '150px', 
          background: 'var(--accent-glow)', 
          filter: 'blur(60px)', 
          borderRadius: '50%',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-green)', padding: '10px', borderRadius: '12px', color: '#000' }}>
                <MessageSquare size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: 'var(--text-bright)', letterSpacing: '1px' }}>ULASAN PEMBELI</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '1px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />)}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 800 }}>4.9/5.0 RATING</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-bright)' }}>5.500+</div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL ULASAN</div>
            </div>
          </div>

          <div className="embla" ref={emblaRef} style={{ overflow: 'hidden' }}>
            <div className="embla__container" style={{ display: 'flex' }}>
              {testimonials.map((t) => (
                <div className="embla__slide" key={t.id} style={{ flex: '0 0 100%', minWidth: 0, padding: '0 4px' }}>
                  <div style={{ 
                    background: 'rgba(0,0,0,0.25)', 
                    padding: '20px', 
                    borderRadius: '20px', 
                    border: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '14px', 
                          background: 'linear-gradient(45deg, var(--bg-elevated), var(--bg-surface))', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '16px', 
                          fontWeight: 900, 
                          color: 'var(--accent-green)', 
                          border: '1px solid var(--border-subtle)' 
                        }}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-bright)' }}>{t.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={10} color="var(--accent-green)" />
                            <span style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: 700, letterSpacing: '0.5px' }}>VERIFIED BUYER</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.time}</span>
                    </div>

                    <p style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '18px', 
                      lineHeight: '1.6',
                      fontWeight: 500
                    }}>
                      "{t.comment}"
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '12px', 
                        color: 'var(--accent-green)', 
                        fontWeight: 800,
                        background: 'var(--accent-glow)',
                        padding: '4px 10px',
                        borderRadius: '8px'
                      }}>
                        <ThumbsUp size={12} fill="var(--accent-green)" /> {t.likes}
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="#fbbf24" color="#fbbf24" />)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-subtle)' }}></div>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--border-subtle)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
