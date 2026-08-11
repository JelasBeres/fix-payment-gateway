"use client";

import React from "react";
import { useAdmin } from "@/context/AdminContext";
import AdminSidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";
import MobileAdminNav from "./MobileAdminNav";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useAdmin();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <AdminHeader />
        <div className="admin-content">
          {children}
        </div>
        
        {/* Ultra-Compact Footer */}
        <footer className="admin-footer">
          <div className="admin-footer-content">
            <div className="footer-left">
              <span className="logo-text-sm">DRIP<span className="text-[var(--accent-green)]">CLIENT</span></span>
              <span className="footer-divider"></span>
              <span className="footer-copy">© 2026 Admin</span>
            </div>

            <div className="footer-right">
              <nav className="footer-nav-simple">
                <a href="#">Support</a>
                <a href="#">Status</a>
              </nav>
              <div className="footer-version-tag">
                v2.4.0
              </div>
            </div>
          </div>
        </footer>
      </main>
      <MobileAdminNav />
    </div>
  );
}
