"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, Bell, Search, ChevronRight, Menu, Package, Receipt, Key, Loader2, X, ShoppingBag, Settings, Users, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAdmin } from "@/context/AdminContext";
import ThemeToggle from "../ThemeToggle";
import Link from "next/link";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, toggleMobileMenu } = useAdmin();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = pathname.split('/').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || "Admin";

  // Focus mobile search input when opened
  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileSearchOpen]);

  // Handle Notifications Fetching
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Notif error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handle Search Fetching
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.results || []);
          setShowResults(true);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (link: string) => {
    setQuery("");
    setShowResults(false);
    router.push(link);
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id })
      });
      setShowNotifications(false);
      fetchNotifications();
      router.push(`/admin/transactions/${notif.id}`);
    } catch (err) {
      console.error("Notif update error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      fetchNotifications();
    } catch (err) {
      console.error("Mark all error:", err);
    }
  };

  const renderSearchResults = (isMobile = false) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8 gap-2 text-muted">
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Analyzing system...</span>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="p-8 text-center text-muted" style={{ fontSize: '12px' }}>
          No matches found for "{query}"
        </div>
      );
    }

    return (
      <div className={`flex flex-col gap-2 ${isMobile ? 'p-4' : ''}`}>
        {['PRODUCT', 'TRANSACTION', 'CUSTOMER', 'LICENSE_KEY'].map((type, index) => {
          const groupResults = results.filter(r => r.type === type);
          if (groupResults.length === 0) return null;

          return (
            <div key={type} className="admin-search-group" style={{ marginTop: index === 0 ? '0' : '24px', marginBottom: '8px' }}>
              <div className="admin-search-group-header" style={{
                fontSize: '11px',
                fontWeight: 900,
                color: 'var(--text-muted)',
                padding: '8px 12px',
                letterSpacing: '1.5px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: 0.8
              }}>
                {type === 'PRODUCT' && <Package size={14} />}
                {type === 'TRANSACTION' && <Receipt size={14} />}
                {type === 'CUSTOMER' && <User size={14} />}
                {type === 'LICENSE_KEY' && <Key size={14} />}
                {type.replace('_', ' ')}
              </div>
              <div className="flex flex-col gap-1">
                {groupResults.map((res: any) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      handleSelectResult(res.link);
                      setIsMobileSearchOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl admin-search-item"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
                  >
                    <div className="flex flex-col flex-1 min-w-0" style={{ paddingLeft: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {res.subtitle}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted" style={{ marginRight: '8px', opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <header className="admin-top-bar">
      <div className="flex items-center gap-4">
        {/* Mobile Search Trigger (Hidden on Desktop) */}
        <button 
          className="admin-search-trigger-mobile btn-icon-sm"
          onClick={() => setIsMobileSearchOpen(true)}
        >
          <Search size={18} />
        </button>

        {/* Desktop: toggle sidebar collapse */}
        <button
          onClick={toggleSidebar}
          className="admin-toggle-desktop btn-icon-sm"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Menu size={20} />
        </button>

        <div className="admin-breadcrumb flex items-center gap-2 text-muted" style={{ fontSize: '13px', fontWeight: 500 }}>
          <span>Admin</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center" style={{ gap: '24px' }}>
        {/* Desktop Search Bar */}
        <div className="search-bar-wrapper admin-search-desktop" ref={searchRef} style={{ position: 'relative', width: '300px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search products, orders, keys..."
            className="search-input"
            style={{ width: '100%', transition: 'none' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}

          {/* Search Results Dropdown (Desktop Only) */}
          {showResults && (
            <div className="card shadow-xl admin-search-results" style={{
              position: 'absolute',
              top: '120%',
              left: 0,
              right: 0,
              zIndex: 1000,
              padding: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}>
              {renderSearchResults()}
            </div>
          )}
        </div>

        <div className="flex items-center" style={{ gap: '20px' }}>
          {/* Notifications Bell */}
          <div style={{ position: 'relative' }} ref={notificationRef} className="admin-notif-wrapper">
            <button
              className="btn-icon-sm"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-surface)',
                  fontSize: '10px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="card shadow-2xl admin-notif-dropdown">
                <div className="admin-notif-header">
                  <div className="flex items-center gap-2">
                    <span className="admin-notif-title">NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <span className="admin-notif-badge">{unreadCount} NEW</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="admin-notif-mark-read">
                      MARK ALL AS READ
                    </button>
                  )}
                </div>

                <div className="admin-notif-list">
                  {notifications.length === 0 ? (
                    <div className="admin-notif-empty">
                      <div className="admin-notif-empty-icon">
                        <Bell size={28} />
                      </div>
                      <div className="admin-notif-empty-title">All caught up!</div>
                      <div className="admin-notif-empty-subtitle">No new sale notifications yet.</div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`admin-notif-item ${n.isAdminRead ? 'read' : 'unread'}`}
                        >
                          {!n.isAdminRead && (
                            <div className="admin-notif-unread-indicator"></div>
                          )}
                          
                          <div className="admin-notif-icon-wrapper">
                            <ShoppingBag size={20} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="admin-notif-item-header">
                              <span className="admin-notif-item-title">{n.product?.name || 'Unknown Product'}</span>
                              <span className="admin-notif-item-time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="admin-notif-item-message">
                              Buyer: {n.customerName || n.customerEmail}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Link 
                  href="/admin/transactions" 
                  onClick={() => setShowNotifications(false)} 
                  className="admin-notif-footer"
                >
                  EXPLORE ALL TRANSACTIONS
                </Link>
              </div>
            )}
          </div>

          <ThemeToggle variant="admin" />

          {/* User Profile - Desktop Only */}
          <div className="admin-user-profile-desktop" ref={userMenuRef} style={{ position: 'relative' }}>
            <div 
              className="user-profile-badge"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <div className="user-name">Root Admin</div>
                <div className="user-role">System Operator</div>
              </div>
            </div>

            {showUserMenu && (
              <div className="admin-user-dropdown">
                <div className="admin-user-dropdown-header">
                  <div className="user-avatar big">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="user-name-big">Root Admin</div>
                    <div className="user-email-small">admin@dripclient.com</div>
                  </div>
                </div>
                
                <div className="admin-user-dropdown-list">
                  <Link href="/admin/settings" onClick={() => setShowUserMenu(false)} className="admin-user-dropdown-item">
                    <Settings size={16} />
                    <span>System Settings</span>
                  </Link>
                  <Link href="/admin/users" onClick={() => setShowUserMenu(false)} className="admin-user-dropdown-item">
                    <Users size={16} />
                    <span>Manage Team</span>
                  </Link>
                  <div className="admin-user-dropdown-divider"></div>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/login" })} 
                    className="admin-user-dropdown-item logout"
                  >
                    <LogOut size={16} />
                    <span>Terminate Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: toggle drawer menu (Three Lines) - Mobile Only */}
          <button
            onClick={toggleMobileMenu}
            className="btn-icon-sm admin-toggle-mobile-right"
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              color: 'var(--text-muted)', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>
        </div>
        {/* Mobile Search Modal Overlay */}
        {isMobileSearchOpen && (
          <div className="admin-search-modal-overlay">
            <div className="admin-search-modal card shadow-2xl">
              <div className="admin-search-modal-header">
                <div className="search-bar-wrapper" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={18} className="search-icon" style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Search system..."
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ 
                      width: '100%', 
                      fontSize: '16px', 
                      height: '48px', 
                      padding: '0 40px 0 42px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px'
                    }}
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setIsMobileSearchOpen(false)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--accent-green)', 
                    fontWeight: 800, 
                    fontSize: '13px',
                    padding: '0 4px',
                    cursor: 'pointer'
                  }}
                >
                  CANCEL
                </button>
              </div>
              
              <div className="admin-search-modal-results">
                {renderSearchResults(true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
