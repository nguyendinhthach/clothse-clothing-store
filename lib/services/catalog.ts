import { prisma } from "@/lib/prisma";
import { BEST_SELLER_TOP, NEW_WINDOW_DAYS, computeBadge, type Badge, type BadgeContext } from "@/lib/badges";
import type { Prisma } from "@/lib/generated/prisma/client";
import { PAGE_SIZE, PRICE_MAX, PRICE_MIN, type SortKey } from "@/lib/catalog-constants";

/** Product count per category, in the fixed display order (SPEC §5). */
export async function getCategoryCounts() {
  const rows = await prisma.category.findMany({
    orderBy: { id: "asc" },
    select: { name: true, _count: { select: { products: true } } },
  });
  return rows.map((c) => ({ name: c.name, count: c._count.products }));
}

// ─── Product cards ────────────────────────────────────────────────────────────

export interface ProductCardData {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  badge: Badge;
  image: { url: string; alt: string | null } | null;
  /** In-stock size labels in the category's sort order. */
  sizesInStock: string[];
  createdAt: Date;
}

const cardInclude = {
  brand: { select: { name: true } },
  category: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: {
    select: { stock: true, sizeOption: { select: { label: true, sortOrder: true } } },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: ProductRow, bestSellerIds: Set<number>, context: BadgeContext, now: Date): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand.name,
    category: p.category.name,
    price: p.price,
    salePrice: p.salePrice,
    onSale: p.onSale,
    badge: computeBadge(
      {
        stocks: p.variants.map((v) => v.stock),
        onSale: p.onSale,
        restockedAt: p.restockedAt,
        createdAt: p.createdAt,
        isBestSeller: bestSellerIds.has(p.id),
      },
      context,
      now,
    ),
    image: p.images[0] ?? null,
    createdAt: p.createdAt,
    sizesInStock: p.variants
      .filter((v) => v.stock > 0)
      .sort((a, b) => a.sizeOption.sortOrder - b.sizeOption.sortOrder)
      .map((v) => v.sizeOption.label),
  };
}

// ─── Best sellers (SPEC §6.11: units sold this calendar month, completed orders) ──

async function unitsSoldByProduct(since: Date | null): Promise<Map<number, number>> {
  const groups = await prisma.orderItem.groupBy({
    by: ["variantId"],
    where: { order: { status: "COMPLETED", ...(since ? { createdAt: { gte: since } } : {}) } },
    _sum: { qty: true },
  });
  if (groups.length === 0) return new Map();
  const variants = await prisma.variant.findMany({
    where: { id: { in: groups.map((g) => g.variantId) } },
    select: { id: true, productId: true },
  });
  const productOf = new Map(variants.map((v) => [v.id, v.productId]));
  const totals = new Map<number, number>();
  for (const g of groups) {
    const pid = productOf.get(g.variantId);
    if (pid === undefined) continue;
    totals.set(pid, (totals.get(pid) ?? 0) + (g._sum.qty ?? 0));
  }
  return totals;
}

function topIds(totals: Map<number, number>, n: number): number[] {
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id);
}

function monthStart(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Product ids that carry the "Best seller" badge right now. */
export async function getBestSellerIds(now = new Date()): Promise<Set<number>> {
  return new Set(topIds(await unitsSoldByProduct(monthStart(now)), BEST_SELLER_TOP));
}

// ─── Homepage queries ─────────────────────────────────────────────────────────

export async function getNewArrivals(limit = 8, now = new Date()): Promise<ProductCardData[]> {
  const [rows, best] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: cardInclude }),
    getBestSellerIds(now),
  ]);
  return rows.map((p) => toCard(p, best, "default", now));
}

/**
 * Top sellers this month; if the month is young and has fewer than `limit`,
 * fill the rest from all-time sales so the block is never empty.
 */
export async function getBestSellers(limit = 4, now = new Date()): Promise<ProductCardData[]> {
  const thisMonth = await unitsSoldByProduct(monthStart(now));
  const ids = topIds(thisMonth, limit);
  if (ids.length < limit) {
    for (const id of topIds(await unitsSoldByProduct(null), limit * 3)) {
      if (ids.length >= limit) break;
      if (!ids.includes(id)) ids.push(id);
    }
  }
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: cardInclude });
  const best = new Set(topIds(thisMonth, BEST_SELLER_TOP));
  const byId = new Map(rows.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is ProductRow => !!p).map((p) => toCard(p, best, "default", now));
}

/** Homepage "Shop by" tiles: three tag counts plus the New badge count (SPEC §6.12). */
export async function getShopByCounts(now = new Date()) {
  const newSince = new Date(now.getTime() - NEW_WINDOW_DAYS * 86_400_000);
  const [tags, newCount] = await Promise.all([
    prisma.tag.findMany({
      where: { name: { in: ["Men", "Women", "Unisex"] } },
      select: { name: true, _count: { select: { products: true } } },
    }),
    prisma.product.count({ where: { createdAt: { gte: newSince } } }),
  ]);
  const count = (name: string) => tags.find((t) => t.name === name)?._count.products ?? 0;
  return [
    { label: "Men", count: count("Men"), tag: "Men" },
    { label: "Women", count: count("Women"), tag: "Women" },
    { label: "Unisex", count: count("Unisex"), tag: "Unisex" },
    { label: "New Arrivals", count: newCount, tag: null },
  ];
}

/** Largest markdown among products currently on sale, for the "Up to X% off" banner. */
export async function getMaxSalePercent(): Promise<number> {
  const rows = await prisma.product.findMany({
    where: { onSale: true, salePrice: { not: null } },
    select: { price: true, salePrice: true },
  });
  let max = 0;
  for (const r of rows) {
    const pct = Math.round((1 - r.salePrice! / r.price) * 100);
    if (pct > max) max = pct;
  }
  return Math.floor(max / 5) * 5;
}

// ─── Listing (Shop / New Arrivals / Sale) ─────────────────────────────────────


export interface ListingQuery {
  cats?: string[];
  tags?: string[];
  brands?: string[];
  min?: number;
  max?: number;
  q?: string;
  sort?: SortKey;
  /** Page scope: only products on sale, or only "New" ones (created in the last 30 days). */
  scope?: "all" | "sale" | "new";
  context?: BadgeContext;
  /** How many to return (load-more grows this). */
  show?: number;
}

export interface Listing {
  items: ProductCardData[];
  total: number;
  shown: number;
}

const effectivePrice = (p: ProductCardData) => (p.onSale && p.salePrice != null ? p.salePrice : p.price);

export async function listProducts(query: ListingQuery, now = new Date()): Promise<Listing> {
  const where: Prisma.ProductWhereInput = {};
  if (query.cats?.length) where.category = { name: { in: query.cats } };
  if (query.brands?.length) where.brand = { name: { in: query.brands } };
  if (query.tags?.length) where.tags = { some: { tag: { name: { in: query.tags } } } };
  if (query.q) where.OR = [{ name: { contains: query.q, mode: "insensitive" } }, { brand: { name: { contains: query.q, mode: "insensitive" } } }];
  if (query.scope === "sale") where.onSale = true;
  if (query.scope === "new") where.createdAt = { gte: new Date(now.getTime() - NEW_WINDOW_DAYS * 86_400_000) };

  const [rows, best] = await Promise.all([prisma.product.findMany({ where, include: cardInclude }), getBestSellerIds(now)]);
  let items = rows.map((p) => toCard(p, best, query.context ?? "default", now));

  // Price filters use the price the customer pays, so they run after the sale price is known.
  const min = query.min ?? PRICE_MIN;
  const max = query.max ?? PRICE_MAX;
  items = items.filter((p) => effectivePrice(p) >= min && (max >= PRICE_MAX || effectivePrice(p) <= max));

  const sort = query.sort ?? "new";
  const pctOff = (p: ProductCardData) => (p.onSale && p.salePrice != null ? 1 - p.salePrice / p.price : 0);
  if (sort === "asc") items.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (sort === "desc") items.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (sort === "discount") items.sort((a, b) => pctOff(b) - pctOff(a) || b.createdAt.getTime() - a.createdAt.getTime());
  else items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const show = Math.max(PAGE_SIZE, query.show ?? PAGE_SIZE);
  return { items: items.slice(0, show), total: items.length, shown: Math.min(show, items.length) };
}

/** Sidebar vocab: categories, every tag in the database (SPEC §6.12), brands with product counts. */
export async function getFilterFacets() {
  const [categories, tags, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" }, select: { name: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { name: true, _count: { select: { products: true } } } }),
  ]);
  return {
    categories: categories.map((c) => c.name),
    tags: tags.map((t) => t.name),
    brands: brands.map((b) => ({ name: b.name, count: b._count.products })),
  };
}

// ─── Product detail ───────────────────────────────────────────────────────────

export interface DetailLine {
  label: string;
  value: string;
}

export interface ProductDetail extends ProductCardData {
  sku: string;
  description: string | null;
  details: DetailLine[];
  modelFitNote: string | null;
  /** Size label → guide text (SPEC §6.6, phase 2 — may be empty). */
  sizeGuide: Record<string, string>;
  images: { url: string; alt: string | null }[];
  /** Every variant, in size order, including sold-out ones (rendered disabled). */
  sizes: { variantId: number; label: string; stock: number }[];
}

function asDetailLines(json: unknown): DetailLine[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((d): d is { label: unknown; value: unknown } => !!d && typeof d === "object")
    .map((d) => ({ label: String(d.label ?? ""), value: String(d.value ?? "") }))
    .filter((d) => d.label && d.value);
}

function asSizeGuide(json: unknown): Record<string, string> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return Object.fromEntries(Object.entries(json as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
}

export async function getProductDetail(id: number, now = new Date()): Promise<ProductDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [p, best] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        ...cardInclude,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
        variants: {
          select: { id: true, stock: true, sizeOption: { select: { label: true, sortOrder: true, active: true } } },
        },
      },
    }),
    getBestSellerIds(now),
  ]);
  if (!p) return null;
  const card = toCard({ ...p, images: p.images.slice(0, 1) }, best, "default", now);
  return {
    ...card,
    sku: p.sku,
    description: p.description,
    details: asDetailLines(p.details),
    modelFitNote: p.modelFitNote,
    sizeGuide: asSizeGuide(p.sizeGuide),
    images: p.images,
    sizes: p.variants
      .filter((v) => v.sizeOption.active || v.stock > 0)
      .sort((a, b) => a.sizeOption.sortOrder - b.sizeOption.sortOrder)
      .map((v) => ({ variantId: v.id, label: v.sizeOption.label, stock: v.stock })),
  };
}

/** "You may also like": same category first, then anything else, never the product itself. */
export async function getRelatedProducts(product: { id: number; category: string }, limit = 4, now = new Date()): Promise<ProductCardData[]> {
  const [same, best] = await Promise.all([
    prisma.product.findMany({
      where: { id: { not: product.id }, category: { name: product.category } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: cardInclude,
    }),
    getBestSellerIds(now),
  ]);
  let rows = same;
  if (rows.length < limit) {
    const more = await prisma.product.findMany({
      where: { id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
      orderBy: { createdAt: "desc" },
      take: limit - rows.length,
      include: cardInclude,
    });
    rows = [...rows, ...more];
  }
  return rows.map((p) => toCard(p, best, "default", now));
}

// ─── Favourites page ──────────────────────────────────────────────────────────

export interface FavouriteCard extends ProductCardData {
  notify: boolean;
  savedAt: Date;
}

export async function getFavouriteCards(userId: number, now = new Date()): Promise<FavouriteCard[]> {
  const [rows, best] = await Promise.all([
    prisma.favourite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { product: { include: cardInclude } } }),
    getBestSellerIds(now),
  ]);
  return rows.map((f) => ({ ...toCard(f.product, best, "default", now), notify: f.notify, savedAt: f.createdAt }));
}
