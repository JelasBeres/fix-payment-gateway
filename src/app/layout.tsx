import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import ThemeToggle from "@/components/ThemeToggle";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://dripclient.id"),
  title: {
    template: "%s | DripClient",
    default: "DripClient - Premium Digital Tools Marketplace",
  },
  description: "The most professional and exclusive marketplace for premium digital tools and software solutions.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DripClient - Premium Digital Tools Marketplace",
    description: "The most professional and exclusive marketplace for premium digital tools and software solutions.",
    url: "https://dripclient.id",
    siteName: "DripClient",
    images: [
      {
        url: "https://dripclient.id/logo.png",
        width: 800,
        height: 800,
        alt: "DripClient Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DripClient - Premium Digital Tools Marketplace",
    description: "The most professional and exclusive marketplace for premium digital tools and software solutions.",
    images: ["https://dripclient.id/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#080014",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var savedTheme = localStorage.getItem("drip_theme");
                if (savedTheme) {
                  document.documentElement.setAttribute("data-theme", savedTheme);
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="antialiased">
        <Toaster 
          position="bottom-right"
          containerStyle={{ zIndex: 20001 }}
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
            },
          }}
        />
        <CartProvider>
          <div className="page-wrapper">
            {children}
            <ThemeToggle />
          </div>
        </CartProvider>
        {/* Midtrans Snap Script */}
        <Script
          src={process.env.MIDTRANS_IS_PRODUCTION === "true" 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js"}
          data-client-key={process.env.MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
