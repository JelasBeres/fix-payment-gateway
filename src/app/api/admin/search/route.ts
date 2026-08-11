import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [products, transactions, keys] = await Promise.all([
      // 1. Search Products
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5,
        select: { id: true, name: true, slug: true }
      }),

      // 2. Search Transactions (Invoices/Customers)
      prisma.purchase.findMany({
        where: {
          OR: [
            { gatewayOrderId: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5,
        include: { product: { select: { name: true } } }
      }),

      // 3. Search License Keys
      prisma.licenseKey.findMany({
        where: {
          key: { contains: query, mode: "insensitive" }
        },
        take: 5,
        include: { 
          product: { select: { name: true } },
          purchase: { select: { customerEmail: true } }
        }
      })
    ]);

    // Format Results
    const formattedResults = [
      ...products.map(p => ({
        id: p.id,
        type: "PRODUCT",
        title: p.name,
        subtitle: `Manage inventory & settings`,
        link: `/admin/products/${p.id}`
      })),
      ...transactions.map(t => ({
        id: t.id,
        type: "TRANSACTION",
        title: t.gatewayOrderId,
        subtitle: `Invoice for ${t.customerName || t.customerEmail}`,
        link: `/admin/transactions/${t.id}`
      })),
      ...keys.map(k => ({
        id: k.id,
        type: "LICENSE_KEY",
        title: k.key,
        subtitle: `Sold to: ${k.purchase?.customerEmail || 'Available'}`,
        link: k.purchaseId ? `/admin/transactions/${k.purchaseId}` : `/admin/keys?search=${k.key}`
      }))
    ];

    // Add unique customers from transaction search results
    const uniqueEmails = [...new Set(transactions.map(t => t.customerEmail))];
    const customerResults = uniqueEmails.map(email => {
      const lastTrx = transactions.find(t => t.customerEmail === email);
      return {
        id: email,
        type: "CUSTOMER",
        title: lastTrx?.customerName || "Anonymous Customer",
        subtitle: email,
        link: `/admin/customers/${encodeURIComponent(email)}`
      };
    });

    // 4. Combine and De-duplicate by Link
    const allResults = [...formattedResults, ...customerResults];
    const uniqueResults = [];
    const seenLinks = new Set();

    for (const res of allResults) {
      if (!seenLinks.has(res.link)) {
        seenLinks.add(res.link);
        uniqueResults.push(res);
      }
    }

    return NextResponse.json({ results: uniqueResults });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
