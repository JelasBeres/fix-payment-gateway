"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/admin/dashboard",
      });

      if (res?.error) {
        setError("Email atau password salah, atau akun tidak aktif.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan saat login, coba lagi.");
      setLoading(false);
    }
  };

  return (
    <main className="mobile-container" style={{ padding: "60px 24px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Link href="/" style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "var(--text-muted)",
        textDecoration: "none",
        fontSize: "13px",
        marginBottom: "40px"
      }}>
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: "24px" }}>
            <img
              src="/logo.png"
              alt="DripClient"
              style={{
                height: '220px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 50px var(--accent-glow))'
              }}
            />
          </div>
          <h1 style={{ fontSize: "24px", color: "var(--text-bright)", letterSpacing: "0.05em", fontWeight: 900 }}>ADMIN PANEL</h1>
          <div style={{ marginTop: '8px' }}>
            <span className="typing-container" style={{ color: "var(--accent-green)", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              RESTRICTED AREA ACCESS ONLY
            </span>
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin/dashboard" })}
          className="btn-google-premium"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            height: "64px",
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "18px",
            color: "var(--accent-green)",
            fontSize: "14px",
            fontWeight: 900,
            letterSpacing: "1px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ 
            background: "white", 
            width: "32px", 
            height: "32px", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
          }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: "18px", height: "18px" }} />
          </div>
          CONTINUE WITH GOOGLE
        </button>

        <style jsx>{`
          .btn-google-premium:hover {
            border-color: var(--accent-green);
            background: var(--accent-glow) !important;
            box-shadow: 0 0 25px var(--accent-glow);
            transform: translateY(-2px);
          }
          .btn-google-premium:active {
            transform: translateY(0);
          }
        `}</style>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "28px 0", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          ATAU LOGIN DENGAN EMAIL
          <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        </div>

        <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-3" style={{ width: "100%" }}>
          {error && (
            <div className="alert alert-danger fade-in" style={{ padding: "10px", fontSize: "12px" }}>
              {error}
            </div>
          )}

          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ height: "52px", fontSize: "14px" }}
          />
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ height: "52px", fontSize: "14px" }}
          />

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ height: "56px", fontSize: "14px", fontWeight: 900, letterSpacing: "1px" }}
          >
            {loading ? <span className="spinner"></span> : "MASUK"}
          </button>
        </form>

        <div style={{ marginTop: "48px", textAlign: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Sistem ini hanya ditujukan untuk staff resmi.<br />
            Pastikan email Google Anda sudah terdaftar di sistem.
          </p>
        </div>
      </div>
    </main>
  );
}
