import Link from "next/link";
import { ChevronLeft, MessageCircle, Users, Star, MessageSquare, Send } from "lucide-react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "FAQ & Community | DripClient" };

export default function FAQPage() {
  const faqs = [
    {
      q: "Ini beneran aman dan terpercaya nggak sih?",
      a: "Real talk aja, Bro. Kita udah punya komunitas yang solid banget. Cek aja Saluran WA kita yang udah tembus 15k+ pengikut dan Channel Telegram dengan 6k+ member aktif. Angka nggak pernah bohong, dan kita nggak bakal ada di titik ini kalau nggak trusted. Join komunitasnya biar lu bisa liat sendiri vibe-nya!"
    },
    {
      q: "Ada bukti testimoni dari pembeli lain?",
      a: "Banyak banget, sampai tumpah-tumpah! Lu bisa cek archive testimoni kita di Telegram. Semua real feedback dari para user yang udah ngerasain gokilnya produk dari Drip Client. Kita main bersih, service nomor satu."
    },
    {
      q: "Kalau ada masalah pas malem-malem gimana?",
      a: "Santai, kita on fire terus! Tim support Drip Client siap bantuin lu 24 jam nonstop via WhatsApp maupun Telegram. Mau lu nemu kendala jam 2 pagi pas lagi asyik mabar, langsung ping aja, kita bakal gercep buat fix urusan lu."
    },
    {
      q: "Kenapa harus beli di Web Drip Client?",
      a: "Karena kita nggak cuma jualan, tapi ngebangun komunitas. Dengan basis massa yang gede di WA dan Tele, kita selalu jaga kualitas biar member nggak kecewa. Plus, sistem kita otomatis, jadi lu nggak perlu nunggu admin bangun tidur buat dapet barangnya."
    }
  ];

  return (
    <main className="mobile-container cylindrical-container">
      <div className="sticky-hero" style={{ paddingBottom: '20px' }}>
        <header className="landing-header" style={{ marginBottom: '12px' }}>
          <Link href="/" className="btn-icon-sm">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="logo-text" style={{ fontSize: '18px' }}>FAQ <span style={{ color: 'var(--text-primary)' }}>COMMUNITY</span></h1>
          <div style={{ width: '32px' }}></div>
        </header>
        <p style={{ fontSize: '11px', color: 'var(--accent-green)', textAlign: 'center', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
          TRUSTED BY THOUSANDS
        </p>
      </div>

      <div className="scroll-content" style={{ paddingTop: '10px' }}>
        {/* Counter Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '32px' }}>
          <div className="card-glass" style={{ textAlign: 'center', padding: '15px 5px', borderTop: '2px solid var(--accent-green)' }}>
            <Users size={16} style={{ margin: '0 auto 8px', color: 'var(--accent-green)' }} />
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-bright)' }}>15K+</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>WA FOLLOWERS</div>
          </div>
          <div className="card-glass" style={{ textAlign: 'center', padding: '15px 5px', borderTop: '2px solid var(--accent-green)' }}>
            <Send size={16} style={{ margin: '0 auto 8px', color: 'var(--accent-green)' }} />
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-bright)' }}>6K+</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>TELE MEMBERS</div>
          </div>
          <div className="card-glass" style={{ textAlign: 'center', padding: '15px 5px', borderTop: '2px solid var(--accent-green)' }}>
            <Star size={16} style={{ margin: '0 auto 8px', color: 'var(--accent-green)' }} />
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-bright)' }}>10K+</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>REAL TESTI</div>
          </div>
        </div>

        {/* FAQ List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq: any, i: number) => (
            <div key={i} className="card" style={{ padding: '24px', borderLeft: '2px solid var(--accent-green)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '10px' }}>Q: {faq.q}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>A:</span> {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons Section */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="https://t.me/addlist/j0vQlg751OMyYTI9" target="_blank" className="btn btn-primary btn-full glow-pulse" style={{ height: '56px', background: 'linear-gradient(90deg, #0088cc, #d100ff)' }}>
            <Send size={20} /> CEK TESTIMONI DI TELEGRAM
          </Link>
          <Link href="https://whatsapp.com/channel/0029VbC0ZJg9sBIHKHI2kV1s" target="_blank" className="btn btn-outline btn-full" style={{ height: '56px', borderColor: '#25D366', color: '#25D366' }}>
            <MessageCircle size={20} /> GABUNG SALURAN WA
          </Link>
        </div>

        <Footer />
      </div>
    </main>
  );
}
