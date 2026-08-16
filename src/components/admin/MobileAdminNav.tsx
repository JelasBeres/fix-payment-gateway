"use client";

import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Package, 
  Tags,
  Key, 
  History,
  Users,
  Settings,
  LogOut,
  X,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, desc: "Overview & analytics" },
  { href: "/admin/promos", label: "Hero Promos", icon: <ImageIcon size={20} />, desc: "Slider & Banners" },
  { href: "/admin/products", label: "Products", icon: <Package size={20} />, desc: "Manage inventory" },
  { href: "/admin/categories", label: "Categories", icon: <Tags size={20} />, desc: "Organize products" },
  { href: "/admin/keys", label: "License Vault", icon: <Key size={20} />, desc: "Key management" },
  { href: "/admin/transactions", label: "Sales History", icon: <History size={20} />, desc: "Orders & revenue" },
  { href: "/admin/users", label: "Team Members", icon: <Users size={20} />, desc: "Staff management" },
  { href: "/admin/settings", label: "System Config", icon: <Settings size={20} />, desc: "Settings & security" },
];

export default function MobileAdminNav() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useAdmin();

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* Slide-in Drawer */}
      <nav className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="mobile-menu-header">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ 
                width: '44px', 
                height: '44px', 
                objectFit: 'contain', 
                filter: 'drop-shadow(0 0 25px var(--accent-glow))' 
              }}
            />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', color: 'var(--text-bright)', lineHeight: 1 }}>
                DRIP<span style={{ color: 'var(--accent-green)' }}>CLIENT</span>
              </h1>
              <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
                ADMIN_PANEL
              </p>
            </div>
          </div>
          <button 
            onClick={closeMobileMenu}
            className="mobile-menu-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="mobile-menu-links">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`mobile-menu-link ${active ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                <div className={`mobile-menu-icon ${active ? "active" : ""}`}>
                  {item.icon}
                </div>
                <div className="mobile-menu-link-text">
                  <span className="mobile-menu-link-label">{item.label}</span>
                  <span className="mobile-menu-link-desc">{item.desc}</span>
                </div>
                {active && (
                  <div className="mobile-menu-active-dot" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mobile-menu-footer">
          <button
            className="btn btn-danger btn-full"
            style={{ height: '48px', fontWeight: 700, borderRadius: '14px' }}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} />
            <span>Termination</span>
          </button>
        </div>
      </nav>
    </>
  );
}
