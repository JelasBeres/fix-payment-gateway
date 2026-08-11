"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ThemeToggle({ variant = "floating" }: { variant?: "admin" | "floating" }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/admin");

  useEffect(() => {
    const savedTheme = localStorage.getItem("drip_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("drip_theme", newTheme);
  };

  // If we are on public site and it's a floating variant, show it.
  // If we are in admin and it's the admin variant, show it.
  // Otherwise hide to avoid duplicates.
  if (variant === "floating" && isAdminPath) return null;

  if (variant === "admin") {
    return (
      <div 
        onClick={toggleTheme}
        className={`theme-slide-wrapper ${theme}`}
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      >
        <div className="theme-slide-track">
          <div className="theme-slide-knob">
            {theme === "dark" ? (
              <Moon size={12} fill="currentColor" />
            ) : (
              <Sun size={12} fill="currentColor" />
            )}
          </div>
        </div>

        <style jsx>{`
          .theme-slide-wrapper {
            cursor: pointer;
            user-select: none;
            transition: all 0.3s ease;
          }

          .theme-slide-track {
            width: 44px;
            height: 24px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-subtle);
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 3px;
            display: flex;
            align-items: center;
          }

          .theme-slide-wrapper.dark .theme-slide-track {
            background: rgba(139, 92, 246, 0.1);
            border-color: rgba(139, 92, 246, 0.3);
          }

          .theme-slide-wrapper.light .theme-slide-track {
            background: rgba(255, 160, 0, 0.1);
            border-color: rgba(255, 160, 0, 0.3);
          }

          .theme-slide-knob {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: absolute;
            left: 3px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }

          .theme-slide-wrapper.dark .theme-slide-knob {
            left: 3px;
            background: #8b5cf6;
            color: white;
            transform: rotate(-15deg);
          }

          .theme-slide-wrapper.light .theme-slide-knob {
            left: calc(100% - 21px);
            background: #ffa000;
            color: white;
            transform: rotate(0deg);
          }
        `}</style>
      </div>
    );
  }

  return (
    <button 
      onClick={toggleTheme}
      className="floating-theme-toggle-global"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun size={20} style={{ color: '#ffd700' }} />
      ) : (
        <Moon size={20} style={{ color: '#8b5cf6' }} />
      )}

      <style jsx>{`
        .floating-theme-toggle-global {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 15px var(--accent-glow);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .floating-theme-toggle-global:hover {
          transform: scale(1.1) rotate(12deg);
          border-color: var(--accent-green);
        }

        @media (max-width: 768px) {
          .floating-theme-toggle-global {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>
    </button>
  );
}
