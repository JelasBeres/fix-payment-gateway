import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!product) notFound();

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href={`/admin/products/${id}`} className="btn btn-outline btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Details
        </Link>
        <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-bright)' }}>Edit Product</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Updating: <b>{product.name}</b></p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '40px', background: 'var(--bg-elevated)' }}>
        <ProductForm initialData={{
          ...product,
          price: Number(product.price)
        }} />
      </div>
    </div>
  );
}
