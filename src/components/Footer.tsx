import Link from "next/link";
import { Users, MessageCircle, Send, Play, Video } from "lucide-react";

export default function Footer() {
  return (
    <footer className="landing-footer" style={{ marginTop: "24px", paddingBottom: "80px", borderTop: "1px solid var(--border-subtle)", paddingTop: "40px" }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.1em' }}>HOME</Link>
        <Link href="/faq" style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.1em' }}>FAQ</Link>
        <Link href="/about" style={{ fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.1em' }}>ABOUT US</Link>
      </div>

      {/* Social Hub - Inside Footer */}
      <div style={{ padding: '0 20px 40px' }}>
        <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Users size={14} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1.5px', color: 'var(--text-primary)' }}>JOIN OUR COMMUNITY</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <Link href="https://whatsapp.com/channel/0029VbC0ZJg9sBIHKHI2kV1s" target="_blank" className="social-btn wa">
              <img src="/social_media/wa.jpg" alt="WhatsApp" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <span>WA</span>
            </Link>
            <Link href="https://t.me/addlist/j0vQlg751OMyYTI9" target="_blank" className="social-btn tg">
              <img src="/social_media/tele.jpg" alt="Telegram" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <span>TELE</span>
            </Link>
            <Link href="https://youtube.com/@dripclient999" target="_blank" className="social-btn yt">
              <img src="/social_media/yt.jpg" alt="YouTube" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <span>YT</span>
            </Link>
            <Link href="https://www.tiktok.com/@dripteam999?_r=1&_t=ZS-965KNshsCST" target="_blank" className="social-btn tk">
              <img src="/social_media/tiktok.jpg" alt="TikTok" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
              <span>TIKTOK</span>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-primary)",
          background: 'var(--accent-glow)',
          padding: '8px 20px',
          borderRadius: '30px',
          marginBottom: '24px',
          border: '1px solid var(--border-default)',
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-green)' }}></span>
          SYSTEM SECURED | 256-BIT ENCRYPTION | VERIFIED
        </div>

        <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: '0.1em', marginBottom: '16px' }}>
          © 2026 <span style={{ color: 'var(--accent-green)' }}>DRIPCLIENT ID</span>. ALL RIGHTS RESERVED.
        </p>
        <Link href="/login" style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.4, textDecoration: 'none', letterSpacing: '0.1em', display: 'inline-block' }}>
          STAFF ACCESS
        </Link>
      </div>
    </footer>
  );
}
