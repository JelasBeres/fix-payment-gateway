"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ThemeToggle from "../ThemeToggle";
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Key, 
  Settings, 
  Users, 
  LogOut,
  Tags,
  Ban,
  Image as ImageIcon
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/admin/promos", label: "Hero Promos", icon: <ImageIcon size={20} /> },
  { href: "/admin/products", label: "Inventory", icon: <Package size={20} /> },
  { href: "/admin/categories", label: "Categories", icon: <Tags size={20} /> },
  { href: "/admin/keys", label: "License Vault", icon: <Key size={20} /> },
  { href: "/admin/blocklist", label: "Blocklist", icon: <Ban size={20} /> },
  { href: "/admin/transactions", label: "Sales History", icon: <History size={20} /> },
  { href: "/admin/users", label: "Team Members", icon: <Users size={20} /> },
  { href: "/admin/settings", label: "System Config", icon: <Settings size={20} /> },
];

import { useAdmin } from "@/context/AdminContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useAdmin();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ 
        height: '100px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? '0' : '0 24px', 
        borderBottom: '1px solid var(--border-subtle)', 
        overflow: 'hidden' 
      }}>
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: isCollapsed ? '40px' : '80px', 
              height: isCollapsed ? '40px' : '80px', 
              minWidth: isCollapsed ? '40px' : '80px', 
              transition: 'all 0.3s ease',
              objectFit: 'contain', 
              filter: 'drop-shadow(0 0 25px var(--accent-glow))' 
            }}
          />
          {!isCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.5px', color: 'var(--text-bright)', lineHeight: 1 }}>
                DRIP<span style={{ color: 'var(--accent-green)' }}>CLIENT</span>
              </h1>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
                ADMIN_PANEL.v2
              </p>
            </div>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '12px' }}>
        {navItems.map((item: any) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`sidebar-link ${active ? "active" : ""}`}
              title={isCollapsed ? item.label : ""}
            >
              <div className="nav-icon-wrapper">
                {item.icon}
              </div>
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ 
        padding: isCollapsed ? "24px 12px" : "32px 24px", 
        background: 'var(--bg-elevated)', 
        borderTop: "1px solid var(--border-subtle)",
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCollapsed ? 'center' : 'stretch',
        gap: '16px'
      }}>
        <button
          className={`btn btn-danger ${isCollapsed ? 'btn-icon' : 'btn-full'}`}
          style={{ height: '44px', width: isCollapsed ? '44px' : '100%', fontWeight: 600, padding: isCollapsed ? '0' : '0 16px' }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? "Termination" : ""}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Termination</span>}
        </button>
      </div>
    </aside>
  );
}
