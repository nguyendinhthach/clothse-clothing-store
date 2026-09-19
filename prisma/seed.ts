// Seed — two layers:
//
//   npm run db:seed         framework only: categories, sizes, tags, item types and
//                           the admin account from .env. Safe on a live database;
//                           also what `prisma migrate reset` runs.
//   npm run db:seed:demo    framework + the demo catalogue from the design files
//                           (brands, 24 products, batches, orders, a demo customer).
//                           WIPES products/batches/orders first — never run on real data.
//
// Idempotent. Framework rows are upserted; demo data is rebuilt every run.

import "dotenv/config";
import { DEFAULT_ITEM_TYPES } from "../lib/sku-codes";
import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import type { OrderStatus, PaymentStatus } from "../lib/generated/prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Design prices are ×10 000 (SPEC §7): `price: 135` → 1 350 000₫ */
const vnd = (n: number) => Math.round(n * 10_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env (see .env.example)`);
  return v;
}

// ─── Fixed vocabulary (SPEC §5 "Giá trị cố định") ─────────────────────────────

const CATEGORIES = ["Tops", "Bottoms", "Accessories", "Footwear"] as const;
type Cat = (typeof CATEGORIES)[number];

// Demo only — a real store adds its own brands in Store Management.
const BRANDS = ["Carhartt", "Stüssy", "Nike", "Champion"] as const;
type BrandName = (typeof BRANDS)[number];

// Demo customer (the design's "Mai Tran"). Fixed, not from .env — it only exists with demo data.
const DEMO_USER = { email: "mai.tran@clothse.test", password: "clothse123", name: "Mai Tran", phone: "0912 345 678" };

const SIZES: Record<Cat, string[]> = {
  Tops: ["XS", "S", "M", "L", "XL", "XXL"],
  Bottoms: ["XS", "S", "M", "L", "XL", "XXL"],
  Accessories: ["One size", "S", "M", "L", "XL"],
  Footwear: ["35", "36", "37", "38", "39", "40", "41", "42", "43"],
};

// Descriptive tags only (SPEC §6.12). New / Restocked / Best seller / Sale /
// Low stock / Core are badges — computed, never stored.
const TAGS = ["Men", "Women", "Unisex", "Limited", "Organic cotton", "Waterproof", "Heavyweight"];

// ─── Demo catalogue (Shop Listing `ALL` + Store Management `SEED_PRODUCTS`) ───

type Stock = "full" | "low" | "out" | "mixed";
interface Seed {
  name: string;
  code: string; // SKU segment, design pattern CSE-XXX-price
  brand: BrandName;
  cat: Cat;
  price: number;
  sale?: number;
  added: number; // design ordinal, 24 = newest
  tags: string[];
  stock: Stock;
  restocked?: boolean;
}

const PRODUCTS: Seed[] = [
  { name: "Static Boxy Tee", code: "TEE", brand: "Carhartt", cat: "Tops", price: 48, added: 24, tags: ["Unisex"], stock: "full" },
  { name: "Grid Cargo Pant", code: "PNT", brand: "Stüssy", cat: "Bottoms", price: 118, added: 23, tags: ["Men", "Heavyweight"], stock: "mixed" },
  { name: "Overdye Hoodie", code: "HDY", brand: "Champion", cat: "Tops", price: 135, added: 22, tags: ["Unisex", "Organic cotton"], stock: "low" },
  { name: "Signal Beanie", code: "BNE", brand: "Carhartt", cat: "Accessories", price: 32, added: 21, tags: ["Unisex"], stock: "full" },
  { name: "Panel Work Jacket", code: "JKT", brand: "Stüssy", cat: "Tops", price: 186, added: 20, tags: ["Men"], stock: "full" },
  { name: "Loop Cross Bag", code: "BAG", brand: "Champion", cat: "Accessories", price: 74, added: 19, tags: ["Women"], stock: "full" },
  { name: "Court Low Sneaker", code: "SNK", brand: "Nike", cat: "Footwear", price: 154, added: 18, tags: ["Unisex"], stock: "out" },
  { name: "Wide Denim 001", code: "JEN", brand: "Carhartt", cat: "Bottoms", price: 128, added: 17, tags: ["Women"], stock: "full" },
  { name: "Blank Heavy Tee", code: "TEE", brand: "Stüssy", cat: "Tops", price: 42, added: 16, tags: ["Unisex", "Heavyweight"], stock: "full" },
  { name: "Logo Crew Sock 3pk", code: "SCK", brand: "Champion", cat: "Accessories", price: 24, added: 15, tags: ["Unisex"], stock: "full" },
  { name: "Trail Runner GT", code: "RUN", brand: "Nike", cat: "Footwear", price: 172, added: 14, tags: ["Men", "Waterproof"], stock: "mixed" },
  { name: "Nylon Track Pant", code: "PNT", brand: "Carhartt", cat: "Bottoms", price: 96, added: 13, tags: ["Men"], stock: "full", restocked: true },
  { name: "Half-Zip Fleece", code: "FLC", brand: "Stüssy", cat: "Tops", price: 142, added: 12, tags: ["Unisex"], stock: "full", restocked: true },
  { name: "Canvas Tote XL", code: "BAG", brand: "Champion", cat: "Accessories", price: 58, added: 11, tags: ["Women"], stock: "full" },
  { name: "Mule Slide 02", code: "SDL", brand: "Nike", cat: "Footwear", price: 88, sale: 62, added: 10, tags: ["Women"], stock: "mixed" },
  { name: "Pleated Skate Short", code: "SHT", brand: "Carhartt", cat: "Bottoms", price: 76, added: 9, tags: ["Women"], stock: "full", restocked: true },
  { name: "Boxy Rugby Shirt", code: "SHR", brand: "Stüssy", cat: "Tops", price: 112, added: 8, tags: ["Men"], stock: "full", restocked: true },
  { name: "Chain Belt Nº7", code: "BLT", brand: "Champion", cat: "Accessories", price: 46, added: 7, tags: ["Unisex"], stock: "full" },
  { name: "Suede Court Hi", code: "SNK", brand: "Nike", cat: "Footwear", price: 198, added: 6, tags: ["Men", "Limited"], stock: "mixed" },
  { name: "Carpenter Jean", code: "JEN", brand: "Carhartt", cat: "Bottoms", price: 134, added: 5, tags: ["Men"], stock: "full" },
  { name: "Mesh Layer Tee", code: "TEE", brand: "Stüssy", cat: "Tops", price: 52, sale: 36, added: 4, tags: ["Women"], stock: "full" },
  { name: "Bucket Hat 01", code: "CAP", brand: "Champion", cat: "Accessories", price: 38, added: 3, tags: ["Unisex"], stock: "full" },
  { name: "Sport Sandal FX", code: "SDL", brand: "Nike", cat: "Footwear", price: 92, sale: 64, added: 2, tags: ["Women"], stock: "full" },
  { name: "Utility Flare Pant", code: "PNT", brand: "Carhartt", cat: "Bottoms", price: 148, added: 1, tags: ["Women"], stock: "full" },
];

// Display-only JSON (SPEC §6.6), copied from the design's DETAIL_HINTS.
const DETAILS: Record<Cat, { label: string; value: string }[]> = {
  Tops: [
    { label: "Fabric", value: "480gsm brushed loopback, 100% organic cotton" },
    { label: "Fit", value: "Boxy, true to size" },
    { label: "Made in", value: "Portugal" },
    { label: "Care", value: "Cold wash, dry flat" },
  ],
  Bottoms: [
    { label: "Fabric", value: "12oz cotton canvas" },
    { label: "Fit", value: "Relaxed, mid rise" },
    { label: "Made in", value: "Portugal" },
    { label: "Care", value: "Cold wash, line dry" },
  ],
  Accessories: [
    { label: "Material", value: "Recycled nylon, metal hardware" },
    { label: "Made in", value: "Vietnam" },
    { label: "Care", value: "Spot clean only" },
  ],
  Footwear: [
    { label: "Upper", value: "Suede and mesh" },
    { label: "Sole", value: "Rubber cupsole" },
    { label: "Made in", value: "Vietnam" },
    { label: "Care", value: "Brush clean, keep dry" },
  ],
};

/** Deterministic per-size stock so re-seeding gives the same numbers. */
function stockFor(p: Seed, sizeIdx: number, sizeCount: number): number {
  const mid = Math.abs(sizeIdx - (sizeCount - 1) / 2) < 1.5; // core sizes sell out slower
  switch (p.stock) {
    case "out":
      return 0;
    case "low":
      return [0, 2, 4, 0, 3, 0, 0, 0, 0][sizeIdx] ?? 0;
    case "mixed":
      return sizeIdx % 3 === 0 ? 0 : mid ? 9 : 3;
    default:
      return mid ? 24 : 12;
  }
}

/** Unit cost ≈ 55–65 % of list price, nudged per size so FIFO has a visible trend. */
function costFor(price: number, k: number): number {
  return vnd(price * (0.55 + 0.05 * ((k % 3) / 2)));
}

// ─── Demo orders (Store Management `SEED_ORDERS`, one buyer = the demo user) ──

interface OrderSeed {
  code: string;
  daysAgo: number;
  status: OrderStatus;
  lines: [productName: string, sizeLabel: string, qty: number][];
}

const ORDERS: OrderSeed[] = [
  { code: "CSE-4417", daysAgo: 1, status: "PENDING", lines: [["Static Boxy Tee", "M", 2], ["Signal Beanie", "One size", 1]] },
  { code: "CSE-4416", daysAgo: 1, status: "PENDING", lines: [["Grid Cargo Pant", "M", 1]] },
  { code: "CSE-4415", daysAgo: 2, status: "PROCESSING", lines: [["Panel Work Jacket", "L", 1], ["Blank Heavy Tee", "L", 2], ["Bucket Hat 01", "One size", 1]] },
  { code: "CSE-4413", daysAgo: 2, status: "PROCESSING", lines: [["Trail Runner GT", "42", 1]] },
  { code: "CSE-4409", daysAgo: 4, status: "SHIPPING", lines: [["Half-Zip Fleece", "M", 1], ["Canvas Tote XL", "One size", 1]] },
  { code: "CSE-4404", daysAgo: 6, status: "SHIPPING", lines: [["Mule Slide 02", "39", 1], ["Logo Crew Sock 3pk", "M", 1]] },
  { code: "CSE-4398", daysAgo: 8, status: "COMPLETED", lines: [["Suede Court Hi", "42", 1], ["Boxy Rugby Shirt", "M", 1]] },
  { code: "CSE-4391", daysAgo: 10, status: "COMPLETED", lines: [["Wide Denim 001", "M", 1]] },
  { code: "CSE-4386", daysAgo: 12, status: "CANCELLED", lines: [["Pleated Skate Short", "S", 1]] },
  { code: "CSE-4380", daysAgo: 14, status: "REFUND", lines: [["Carpenter Jean", "L", 1]] },
  // older completed orders so the monthly "Best seller" query has something to rank
  { code: "CSE-4371", daysAgo: 16, status: "COMPLETED", lines: [["Blank Heavy Tee", "M", 3], ["Static Boxy Tee", "L", 1]] },
  { code: "CSE-4365", daysAgo: 19, status: "COMPLETED", lines: [["Sport Sandal FX", "37", 2]] },
  { code: "CSE-4358", daysAgo: 22, status: "COMPLETED", lines: [["Mesh Layer Tee", "S", 2], ["Chain Belt Nº7", "One size", 1]] },
  { code: "CSE-4350", daysAgo: 26, status: "COMPLETED", lines: [["Blank Heavy Tee", "S", 2]] },
];

const SHIPPING_FEE = vnd(3);      // 30 000₫ (SPEC §6.8)
const FREE_SHIP_OVER = vnd(100);  // 1 000 000₫

const paymentFor = (s: OrderStatus): PaymentStatus =>
  s === "COMPLETED" ? "PAID" : s === "REFUND" ? "REFUNDED" : "UNPAID";

// ─── Main ─────────────────────────────────────────────────────────────────────

const DEMO = process.argv.includes("--demo") || process.env.SEED_DEMO === "1";

async function main() {
  // 1. Vocabulary — upsert, never wiped (orders reference sizes)
  const catId: Record<string, number> = {};
  for (const name of CATEGORIES) {
    catId[name] = (await prisma.category.upsert({ where: { name }, update: {}, create: { name } })).id;
  }
  const sizeId: Record<string, number> = {}; // "Tops/M" → id
  for (const cat of CATEGORIES) {
    for (const [i, label] of SIZES[cat].entries()) {
      const s = await prisma.sizeOption.upsert({
        where: { categoryId_label: { categoryId: catId[cat], label } },
        update: { sortOrder: i + 1 },
        create: { categoryId: catId[cat], label, sortOrder: i + 1 },
      });
      sizeId[`${cat}/${label}`] = s.id;
    }
  }
  const typeId: Record<string, number> = {}; // code → id
  for (const t of DEFAULT_ITEM_TYPES) {
    typeId[t.code] = (await prisma.itemType.upsert({ where: { code: t.code }, update: { label: t.label }, create: { code: t.code, label: t.label, categoryId: catId[t.category] } })).id;
  }
  const tagId: Record<string, number> = {};
  for (const name of TAGS) {
    tagId[name] = (await prisma.tag.upsert({ where: { name }, update: {}, create: { name } })).id;
  }

  // 2. Admin — upsert; password reset on every seed so .env stays the truth
  const adminEmail = env("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await hash(env("SEED_ADMIN_PASSWORD"), 10), role: "ADMIN" },
    create: { email: adminEmail, passwordHash: await hash(env("SEED_ADMIN_PASSWORD"), 10), name: "ClothSE Admin", role: "ADMIN" },
  });

  if (!DEMO) {
    console.log(`Seeded framework: ${CATEGORIES.length} categories, ${TAGS.length} tags, ${DEFAULT_ITEM_TYPES.length} item types, admin ${admin.email}. (Add --demo for the sample catalogue.)`);
    return;
  }

  // ── Demo layer ──────────────────────────────────────────────────────────────
  const brandId: Record<string, number> = {};
  for (const name of BRANDS) {
    brandId[name] = (await prisma.brand.upsert({ where: { name }, update: {}, create: { name } })).id;
  }
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { passwordHash: await hash(DEMO_USER.password, 10), role: "USER" },
    create: { email: DEMO_USER.email, passwordHash: await hash(DEMO_USER.password, 10), name: DEMO_USER.name, phone: DEMO_USER.phone, role: "USER" },
  });
  await prisma.address.deleteMany({ where: { userId: user.id } });
  const home = await prisma.address.create({
    data: { userId: user.id, label: "Nhà", name: DEMO_USER.name, phone: DEMO_USER.phone, line: "12 Nguyễn Chí Thanh, Phường 1", city: "Đà Lạt", isDefault: true },
  });

  // 3. Demo data — wipe in FK order, then rebuild
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.product.deleteMany();

  // In-memory FIFO ledger: batches per variant, oldest first.
  type Ledger = { batchId: number; remaining: number; unitCost: number };
  const ledger = new Map<number, Ledger[]>(); // variantId → batches
  const variantId = new Map<string, number>(); // "Product/Size" → id
  const listPrice = new Map<number, number>(); // variantId → current sell price
  const productId = new Map<string, number>();

  for (const p of PRODUCTS) {
    const sizes = SIZES[p.cat];
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: `CSE-${p.code}-${String(p.price).padStart(3, "0")}`,
        typeId: typeId[p.code],
        price: vnd(p.price),
        salePrice: p.sale ? vnd(p.sale) : null,
        onSale: !!p.sale,
        description: `${p.name} by ${p.brand}. Part of the ClothSE ${p.cat.toLowerCase()} range.`,
        details: DETAILS[p.cat],
        modelFitNote: p.cat === "Accessories" ? null : "Model is 180 cm and wears size M.",
        createdAt: daysAgo((25 - p.added) * 3),
        restockedAt: p.restocked ? daysAgo(3) : null,
        brandId: brandId[p.brand],
        categoryId: catId[p.cat],
        tags: { create: p.tags.map((t) => ({ tagId: tagId[t] })) },
      },
    });
    productId.set(p.name, product.id);

    for (const [i, label] of sizes.entries()) {
      const stock = stockFor(p, i, sizes.length);
      const v = await prisma.variant.create({
        data: { productId: product.id, sizeOptionId: sizeId[`${p.cat}/${label}`], stock: 0 },
      });
      variantId.set(`${p.name}/${label}`, v.id);
      listPrice.set(v.id, vnd(p.sale ?? p.price));
      ledger.set(v.id, []);

      // Two batches for core sizes (visible FIFO cost trend), one otherwise.
      // "out" products still get a fully consumed batch so history isn't empty.
      const received = stock === 0 ? 4 : stock;
      const split = received >= 12 ? [Math.ceil(received / 2), Math.floor(received / 2)] : [received];
      for (const [k, qty] of split.entries()) {
        const b = await prisma.batch.create({
          data: {
            variantId: v.id,
            brandId: brandId[p.brand],
            categoryId: catId[p.cat],
            sizeOptionId: sizeId[`${p.cat}/${label}`],
            itemDescription: `${p.name} · ${label}`,
            receivedAt: daysAgo(60 - k * 25 - i),
            qtyReceived: qty,
            qtyRemaining: qty,
            unitCost: costFor(p.price, k + i),
          },
        });
        ledger.get(v.id)!.push({ batchId: b.id, remaining: qty, unitCost: b.unitCost });
      }
      // "out" products: the 4 units were sold long ago (outside any order below)
      if (stock === 0) for (const l of ledger.get(v.id)!) l.remaining = 0;
    }
  }

  // Unlinked batches — goods received, not yet listed (design `SEED_BATCHES`)
  const unlinked: [BrandName, string, Cat, string, number, number, number][] = [
    ["Champion", "Reverse weave hood — grey marl", "Tops", "M", 80, 62, 28],
    ["Champion", "Reverse weave hood — grey marl", "Tops", "S", 24, 58, 27],
    ["Champion", "Reverse weave hood — grey marl", "Tops", "L", 32, 60, 26],
    ["Stüssy", "Washed cord overshirt — sand", "Tops", "M", 28, 74, 24],
    ["Stüssy", "Washed cord overshirt — sand", "Tops", "L", 22, 76, 23],
  ];
  for (const [brand, item, cat, size, qty, cost, ago] of unlinked) {
    await prisma.batch.create({
      data: {
        brandId: brandId[brand],
        categoryId: catId[cat],
        sizeOptionId: sizeId[`${cat}/${size}`],
        itemDescription: item,
        receivedAt: daysAgo(ago),
        qtyReceived: qty,
        qtyRemaining: qty,
        unitCost: vnd(cost),
      },
    });
  }

  // 4. Orders — consume the ledger FIFO exactly as the service will (SPEC §6.4).
  //    CANCELLED / REFUND orders were deducted then returned: net zero on stock,
  //    but the items still carry the COGS captured at sale time.
  for (const o of ORDERS) {
    const items: { variantId: number; qty: number; unitPrice: number; unitCogs: number }[] = [];
    for (const [pname, size, qty] of o.lines) {
      const vid = variantId.get(`${pname}/${size}`);
      if (!vid) throw new Error(`Order ${o.code}: no variant ${pname}/${size}`);
      const batches = ledger.get(vid)!;
      const available = batches.reduce((s, b) => s + b.remaining, 0);
      if (available < qty) throw new Error(`Order ${o.code}: ${pname}/${size} has ${available}, needs ${qty}`);

      let left = qty, cogs = 0;
      const returned = o.status === "CANCELLED" || o.status === "REFUND";
      for (const b of batches) {
        if (left === 0) break;
        const take = Math.min(left, b.remaining);
        cogs += take * b.unitCost;
        if (!returned) b.remaining -= take;
        left -= take;
      }
      items.push({ variantId: vid, qty, unitPrice: listPrice.get(vid)!, unitCogs: Math.round(cogs / qty) });
    }
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const shippingFee = subtotal >= FREE_SHIP_OVER ? 0 : SHIPPING_FEE;
    await prisma.order.create({
      data: {
        code: o.code,
        status: o.status,
        paymentStatus: paymentFor(o.status),
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        shipName: home.name,
        shipPhone: home.phone,
        shipAddress: `${home.line}, ${home.city}`,
        createdAt: daysAgo(o.daysAgo),
        userId: user.id,
        items: { create: items },
      },
    });
  }

  // 5. Write the ledger back: batch.qtyRemaining and variant.stock = Σ remaining
  for (const [vid, batches] of ledger) {
    for (const b of batches) {
      await prisma.batch.update({ where: { id: b.batchId }, data: { qtyRemaining: b.remaining } });
    }
    await prisma.variant.update({
      where: { id: vid },
      data: { stock: batches.reduce((s, b) => s + b.remaining, 0) },
    });
  }

  // 6. Demo user's favourites and cart (design Favourites / My Bag pages)
  await prisma.favourite.createMany({
    data: [
      { userId: user.id, productId: productId.get("Court Low Sneaker")!, notify: true },
      { userId: user.id, productId: productId.get("Overdye Hoodie")!, notify: true },
      { userId: user.id, productId: productId.get("Half-Zip Fleece")!, notify: false },
      { userId: user.id, productId: productId.get("Mule Slide 02")!, notify: false },
    ],
  });
  await prisma.cartItem.createMany({
    data: [
      { userId: user.id, variantId: variantId.get("Wide Denim 001/M")!, qty: 1 },
      { userId: user.id, variantId: variantId.get("Signal Beanie/One size")!, qty: 2 },
    ],
  });

  const counts = {
    products: await prisma.product.count(),
    variants: await prisma.variant.count(),
    batches: await prisma.batch.count(),
    orders: await prisma.order.count(),
  };
  console.log(`Seeded framework + demo: admin ${admin.email}, demo customer ${user.email} / ${DEMO_USER.password}`, counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
