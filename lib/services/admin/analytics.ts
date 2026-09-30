import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { LOW_STOCK_MAX } from "@/lib/badges";
import { formatDate } from "@/lib/format";
import { vnDate, vnDayFromIso, vnIsoDay, vnMonthStart, vnParts, vnStartOfDay } from "@/lib/vn-time";

// SPEC §6.4 — Revenue = Σ qty × unit_price, COGS = Σ qty × unit_cogs, Profit = the
// difference; both read from the snapshots on OrderItem. Only COMPLETED orders
// count (paid, delivered); a refunded order drops out of the report (§6.3).

const DAY = 86_400_000;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  revenueMonth: number;
  revenuePrevMonth: number;
  totalOrders: number;
  pendingOrders: number;
  lowSizes: number;
  outSizes: number;
  recentOrders: { id: number; code: string; customer: string; total: number; status: OrderStatus; createdAt: Date }[];
  topSellers: { productId: number; name: string; brand: string; units: number; image: string | null }[];
  attention: { productId: number; name: string; brand: string; size: string; stock: number; warehouse: number }[];
}

async function revenueBetween(from: Date, to: Date): Promise<number> {
  const items = await prisma.orderItem.findMany({ where: { order: { status: "COMPLETED", createdAt: { gte: from, lt: to } } }, select: { qty: true, unitPrice: true } });
  return items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

export async function getDashboard(now = new Date()): Promise<DashboardData> {
  const monthStart = vnMonthStart(now);
  const prevStart = vnMonthStart(now, -1);
  const nextStart = vnMonthStart(now, 1);

  const [revenueMonth, revenuePrevMonth, totalOrders, pendingOrders, recent, lowVariants, sold] = await Promise.all([
    revenueBetween(monthStart, nextStart),
    revenueBetween(prevStart, monthStart),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } }),
    prisma.variant.findMany({
      where: { stock: { lte: LOW_STOCK_MAX } },
      include: { product: { select: { id: true, name: true, brandId: true, categoryId: true, brand: { select: { name: true } } } }, sizeOption: { select: { id: true, label: true, sortOrder: true } } },
      orderBy: [{ stock: "asc" }],
    }),
    prisma.orderItem.groupBy({ by: ["variantId"], where: { order: { status: "COMPLETED", createdAt: { gte: monthStart } } }, _sum: { qty: true } }),
  ]);

  // Top selling this month (falls back to all-time when the month is quiet)
  const allTime = sold.length < 3 ? await prisma.orderItem.groupBy({ by: ["variantId"], where: { order: { status: "COMPLETED" } }, _sum: { qty: true } }) : null;
  const groups = allTime ?? sold;
  const variants = groups.length ? await prisma.variant.findMany({ where: { id: { in: groups.map((g) => g.variantId) } }, select: { id: true, product: { select: { id: true, name: true, brand: { select: { name: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } } } }) : [];
  const byVariant = new Map(variants.map((v) => [v.id, v.product]));
  const perProduct = new Map<number, { name: string; brand: string; units: number; image: string | null }>();
  for (const g of groups) {
    const p = byVariant.get(g.variantId);
    if (!p) continue;
    const cur = perProduct.get(p.id) ?? { name: p.name, brand: p.brand.name, units: 0, image: p.images[0]?.url ?? null };
    cur.units += g._sum.qty ?? 0;
    perProduct.set(p.id, cur);
  }
  const topSellers = [...perProduct.entries()].map(([productId, v]) => ({ productId, ...v })).sort((a, b) => b.units - a.units).slice(0, 5);

  // Needs attention: low / out sizes, with unlinked warehouse units of the same brand + category + size
  const unlinked = await prisma.batch.groupBy({ by: ["brandId", "categoryId", "sizeOptionId"], where: { variantId: null, qtyRemaining: { gt: 0 } }, _sum: { qtyRemaining: true } });
  const whKey = (b: number, c: number, s: number) => `${b}|${c}|${s}`;
  const wh = new Map(unlinked.map((u) => [whKey(u.brandId, u.categoryId, u.sizeOptionId), u._sum.qtyRemaining ?? 0]));
  const attention = lowVariants
    .sort((a, b) => a.stock - b.stock || a.product.name.localeCompare(b.product.name) || a.sizeOption.sortOrder - b.sizeOption.sortOrder)
    .map((v) => ({
      productId: v.product.id,
      name: v.product.name,
      brand: v.product.brand.name,
      size: v.sizeOption.label,
      stock: v.stock,
      warehouse: wh.get(whKey(v.product.brandId, v.product.categoryId, v.sizeOption.id)) ?? 0,
    }));

  return {
    revenueMonth,
    revenuePrevMonth,
    totalOrders,
    pendingOrders,
    lowSizes: attention.filter((a) => a.stock > 0).length,
    outSizes: attention.filter((a) => a.stock === 0).length,
    recentOrders: recent.map((o) => ({ id: o.id, code: o.code, customer: o.user.name, total: o.total, status: o.status, createdAt: o.createdAt })),
    topSellers,
    attention,
  };
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export type RangeKey = "week" | "month" | "year" | "custom";

export interface RevenueRange {
  key: RangeKey;
  from: Date;
  to: Date; // exclusive
  label: string;
}

const fmt = (d: Date) => formatDate(d);

export function resolveRange(key: RangeKey, custom: { from?: string; to?: string } = {}, now = new Date()): RevenueRange {
  const today = vnStartOfDay(now);
  if (key === "week") {
    const dow = (vnParts(today).weekday + 6) % 7; // Monday = 0
    const from = new Date(today.getTime() - dow * DAY);
    const to = new Date(from.getTime() + 7 * DAY);
    return { key, from, to, label: `${fmt(from)} – ${fmt(new Date(to.getTime() - DAY))}` };
  }
  if (key === "year") {
    const { year } = vnParts(now);
    return { key, from: vnDate(year, 0, 1), to: vnDate(year + 1, 0, 1), label: `Năm ${year} · tới hôm nay` };
  }
  if (key === "custom" && custom.from && custom.to) {
    let a = vnDayFromIso(custom.from);
    let b = vnDayFromIso(custom.to);
    if (a && b) {
      if (a > b) [a, b] = [b, a];
      const to = new Date(b.getTime() + DAY);
      return { key, from: a, to, label: `${fmt(a)} – ${fmt(b)}` };
    }
  }
  const from = vnMonthStart(now);
  const to = vnMonthStart(now, 1);
  return { key: "month", from, to, label: `${fmt(from)} – ${fmt(new Date(to.getTime() - DAY))}` };
}

export interface RevenueData {
  range: RevenueRange;
  totals: { revenue: number; cogs: number; profit: number; orders: number; units: number; aov: number; margin: number };
  prior: { revenue: number };
  /** One bucket per day or per month, in order. */
  series: { unit: "day" | "month"; buckets: { label: string; title: string; revenue: number; profit: number }[] };
  byBrand: { name: string; units: number; revenue: number; cogs: number; margin: number; share: number }[];
  byCategory: { name: string; revenue: number; cogs: number; margin: number; share: number }[];
  marginTop: { name: string; brand: string; margin: number; units: number }[];
  marginBottom: { name: string; brand: string; margin: number; units: number }[];
}

export async function getRevenue(range: RevenueRange): Promise<RevenueData> {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: "COMPLETED", createdAt: { gte: range.from, lt: range.to } } },
    select: {
      qty: true,
      unitPrice: true,
      unitCogs: true,
      order: { select: { id: true, createdAt: true } },
      variant: { select: { product: { select: { id: true, name: true, brand: { select: { name: true } }, category: { select: { name: true } } } } } },
    },
  });

  const revenue = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const cogs = items.reduce((s, i) => s + i.qty * i.unitCogs, 0);
  const orderIds = new Set(items.map((i) => i.order.id));
  const units = items.reduce((s, i) => s + i.qty, 0);
  const profit = revenue - cogs;

  // Prior period of the same length, for the "vs prior" note
  const span = range.to.getTime() - range.from.getTime();
  const priorRevenue = await revenueBetween(new Date(range.from.getTime() - span), range.from);

  // Series
  const useMonths = range.key === "year" || span > 45 * DAY;
  const buckets: RevenueData["series"]["buckets"] = [];
  const index = new Map<string, number>();
  if (useMonths) {
    for (let d = vnMonthStart(range.from); d < range.to; d = vnMonthStart(d, 1)) {
      const { year, month } = vnParts(d);
      index.set(`${year}-${month}`, buckets.length);
      buckets.push({ label: `T${month + 1}`, title: `Tháng ${month + 1}/${year}`, revenue: 0, profit: 0 });
    }
  } else {
    for (let d = new Date(range.from); d < range.to; d = new Date(d.getTime() + DAY)) {
      const { day, weekday } = vnParts(d);
      index.set(vnIsoDay(d), buckets.length);
      buckets.push({ label: range.key === "week" ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][weekday] : String(day), title: fmt(d), revenue: 0, profit: 0 });
    }
  }
  for (const i of items) {
    const d = i.order.createdAt;
    const p = vnParts(d);
    const k = useMonths ? `${p.year}-${p.month}` : vnIsoDay(d);
    const at = index.get(k);
    if (at === undefined) continue;
    buckets[at].revenue += i.qty * i.unitPrice;
    buckets[at].profit += i.qty * (i.unitPrice - i.unitCogs);
  }

  // Breakdowns
  type Acc = { units: number; revenue: number; cogs: number };
  const acc = (m: Map<string, Acc>, k: string, i: (typeof items)[number]) => {
    const cur = m.get(k) ?? { units: 0, revenue: 0, cogs: 0 };
    cur.units += i.qty;
    cur.revenue += i.qty * i.unitPrice;
    cur.cogs += i.qty * i.unitCogs;
    m.set(k, cur);
  };
  const brands = new Map<string, Acc>();
  const cats = new Map<string, Acc>();
  const products = new Map<number, Acc & { name: string; brand: string }>();
  for (const i of items) {
    const p = i.variant.product;
    acc(brands, p.brand.name, i);
    acc(cats, p.category.name, i);
    const cur = products.get(p.id) ?? { name: p.name, brand: p.brand.name, units: 0, revenue: 0, cogs: 0 };
    cur.units += i.qty;
    cur.revenue += i.qty * i.unitPrice;
    cur.cogs += i.qty * i.unitCogs;
    products.set(p.id, cur);
  }
  const marginOf = (a: Acc) => (a.revenue > 0 ? (a.revenue - a.cogs) / a.revenue : 0);
  const shareOf = (a: Acc) => (revenue > 0 ? a.revenue / revenue : 0);
  const byBrand = [...brands.entries()].map(([name, a]) => ({ name, units: a.units, revenue: a.revenue, cogs: a.cogs, margin: marginOf(a), share: shareOf(a) })).sort((a, b) => b.revenue - a.revenue);
  const byCategory = [...cats.entries()].map(([name, a]) => ({ name, revenue: a.revenue, cogs: a.cogs, margin: marginOf(a), share: shareOf(a) })).sort((a, b) => b.revenue - a.revenue);
  const ranked = [...products.values()].map((p) => ({ name: p.name, brand: p.brand, units: p.units, margin: marginOf(p) })).sort((a, b) => b.margin - a.margin);

  return {
    range,
    totals: { revenue, cogs, profit, orders: orderIds.size, units, aov: orderIds.size ? Math.round(revenue / orderIds.size) : 0, margin: revenue > 0 ? profit / revenue : 0 },
    prior: { revenue: priorRevenue },
    series: { unit: useMonths ? "month" : "day", buckets },
    byBrand,
    byCategory,
    marginTop: ranked.slice(0, 3),
    marginBottom: ranked.length > 3 ? ranked.slice(-3).reverse() : [],
  };
}
