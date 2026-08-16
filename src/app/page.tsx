import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingCart, ShieldCheck, Zap, Package, Users, MessageCircle, Send, Play, Video } from "lucide-react";
import ProductActionButtons from "@/components/checkout/DirectBuyButton";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import PromoSlider from "@/components/home/PromoSlider";
import ProductGroupCard from "@/components/home/ProductGroupCard";
import TestimonialSlider from "@/components/home/TestimonialSlider";

export default async function LandingPage() {
  const [products, promos] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      // Removed strict stock/key filtering to keep products visible even when 'Sold Out'
      // We will handle the 'Sold Out' UI in the ProductGroupCard component instead

      include: { 
        category: true,
        _count: {
          select: {
            licenseKeys: {
              where: {
                purchaseId: null,
                status: "ACTIVE"
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.promo.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  // Group products by their Base Name
  const groupedProducts: Record<string, any[]> = {};
  products.forEach((product: any) => {
    let baseName = product.name;
    if (baseName.includes('|')) {
      baseName = baseName.split('|')[0].trim();
    } else if (baseName.includes(' - ')) {
      baseName = baseName.split(' - ')[0].trim();
    }
    
    if (!groupedProducts[baseName]) {
      groupedProducts[baseName] = [];
    }

    // Explicitly map all fields to ensure no hidden Prisma classes/Decimals are passed
    const serializedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      isActive: product.isActive,
      imageUrl: product.imageUrl,
      features: product.features,
      durationDays: product.durationDays,
      categoryId: product.categoryId,
      availableKeys: product._count.licenseKeys,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      } : null
    };

    groupedProducts[baseName].push(serializedProduct);
  });

  return (
    <>
      <main className="mobile-container cylindrical-container">
        <header className="landing-header">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                height: '60px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px var(--accent-glow))'
              }}
            />
            <h1 className="logo-text" style={{ fontSize: '22px', margin: 0, color: 'var(--accent-green)', fontWeight: 900 }}>DRIP<span style={{ color: "var(--text-primary)" }}>CLIENT</span></h1>
          </Link>
        </header>

        {/* Promo Slider Section */}
        <div className="promo-section" style={{ padding: '0 20px' }}>
          <PromoSlider promos={promos.map(p => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl,
            linkUrl: p.linkUrl
          }))} />
        </div>

        {/* Scrolling Content Area */}
        <div className="scroll-content">
          <div className="content-inner">
            <h3 className="section-title" style={{ padding: '0 0 20px' }}>Available Products</h3>

            <div className="product-list">
              {Object.keys(groupedProducts).length === 0 ? (
                <div className="empty-state">
                  <Package />
                  <p>No products available at the moment.</p>
                </div>
              ) : (
                Object.keys(groupedProducts).map((baseName) => (
                  <ProductGroupCard 
                    key={baseName} 
                    baseName={baseName} 
                    products={groupedProducts[baseName]} 
                  />
                ))
              )}
            </div>
          </div>

          <div style={{ margin: '60px 0 40px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)' }}></div>
          <TestimonialSlider />
          <Footer />
        </div>

      </main>
      <CartDrawer />
    </>
  );
}
