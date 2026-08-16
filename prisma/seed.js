const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin Account ──────────────────────────────────────
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!rawPassword) {
    console.error("ERROR: ADMIN_INITIAL_PASSWORD is not set in .env");
    process.exit(1);
  }
  const adminPassword = await bcrypt.hash(rawPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dripclient.id" },
    update: {},
    create: {
      email: "admin@dripclient.id",
      password: adminPassword,
      name: "Super Admin",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ── Categories ────────────────────────────────────────
  const categories = [
    { name: "Aimlock", slug: "aimlock", description: "Cheat otomatis headshot dan lock target." },
    { name: "Rank Push", slug: "rank-push", description: "Bantuan push rank cepat dan aman." },
    { name: "Skin Unlock", slug: "skin-unlock", description: "Buka semua skin premium gratis." },
    { name: "Antiban", slug: "antiban", description: "Sistem pengaman agar tidak terkena ban." },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log("✅ Categories seeded:", categories.length);

  // ── Products ───────────────────────────────────────────
  const products = [
    {
      name: "ESP + Aimlock Pro",
      slug: "esp-aimlock-pro",
      description: "Fitur lengkap ESP (wallhack) dan Aimlock auto headshot untuk Free Fire. Undetected & stabil.",
      categoryId: categoryMap["aimlock"],
      price: 150000,
      features: ["Auto Headshot", "ESP Wallhack", "Long Range Aimlock", "Anti-Report System", "Daily Update"],
      durationDays: 30,
      stock: 100,
    },
    {
      name: "Rank Push Bundle CS",
      slug: "rank-push-bundle-cs",
      description: "Tool otomatis untuk push rank Clash Squad ke Diamond & Heroic dengan aman.",
      categoryId: categoryMap["rank-push"],
      price: 200000,
      features: ["Auto Win CS", "Safe Mode", "Undetected", "Support All Device", "24/7 Active"],
      durationDays: 7,
      stock: 50,
    },
    {
      name: "Skin Unlock All",
      slug: "skin-unlock-all",
      description: "Unlock semua skin premium termasuk Chrono, Shirou, dan koleksi terbaru tanpa bayar.",
      categoryId: categoryMap["skin-unlock"],
      price: 100000,
      features: ["All Character Skins", "All Gun Skins", "All Pets", "Updated Monthly", "No Root Required"],
      durationDays: 30,
      stock: 200,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log("✅ Products seeded:", products.length, "products");

  // ── Site Config ────────────────────────────────────────
  const siteConfigs = [
    { key: "site_name", value: "DripClient", description: "Nama website" },
    { key: "site_tagline", value: "Premium Digital Tools and Game Mods", description: "Tagline website" },
    { key: "telegram_support", value: "@dripclient_support", description: "Telegram support" },
  ];

  for (const cfg of siteConfigs) {
    await prisma.siteConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log("✅ Site config seeded");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
