import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Default Categories
  const categoryData = [
    { name: "AIMLOCK", slug: "aimlock", description: "Premium aim assist tools" },
    { name: "RANK PUSH", slug: "rank-push", description: "Account leveling services" },
    { name: "SKIN UNLOCK", slug: "skin-unlock", description: "Cosmetic unlockers" },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(createdCat);
  }
  console.log("✅ Categories ready");

  // 2. Admin Account (Security: Use ENV or fallback)
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || "DripClient@2026";
  const adminPassword = await bcrypt.hash(rawPassword, 12);
  
  await prisma.user.upsert({
    where: { email: "admin@dripclient.id" },
    update: {},
    create: {
      email: "admin@dripclient.id",
      password: adminPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin account secured");

  // 3. Payment Methods (Initial Config)
  const paymentMethods = ["QRIS", "BANK_BCA", "DANA", "GOPAY"];
  for (const method of paymentMethods) {
    await prisma.paymentConfig.upsert({
      where: { method: method as any },
      update: {},
      create: {
        method: method as any,
        label: method.replace("_", " "),
        isActive: true,
      },
    });
  }
  console.log("✅ Payment methods initialized");

  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────");
  console.log("ADMIN_USER : admin@dripclient.id");
  console.log("PASSWORD   : (Sesuai ADMIN_INITIAL_PASSWORD di .env)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
