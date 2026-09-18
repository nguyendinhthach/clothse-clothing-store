// SPEC §6.11 — every product carries exactly one badge, computed at read time.

export type Badge = "Out of stock" | "Low stock" | "Sale" | "Restocked" | "Best seller" | "New" | "Core";

/** What the customer sees on the chip. Keys are stable identifiers used in filters — never rename them. */
export const BADGE_LABEL: Record<Badge, string> = {
  "Out of stock": "Hết hàng",
  "Low stock": "Sắp hết",
  Sale: "Sale",
  Restocked: "Có hàng lại",
  "Best seller": "Bán chạy",
  New: "Mới",
  Core: "Cơ bản",
};

/** Page context demotes the badge the page already implies (SPEC §6.11 exceptions). */
export type BadgeContext = "default" | "new-arrivals" | "sale";

export const RESTOCKED_WINDOW_DAYS = 14;
export const NEW_WINDOW_DAYS = 30;
export const LOW_STOCK_MAX = 5;
export const BEST_SELLER_TOP = 5;

export interface BadgeInput {
  stocks: number[];        // one entry per variant
  onSale: boolean;
  restockedAt: Date | null;
  createdAt: Date;
  isBestSeller: boolean;   // in the top-5 sold this month (see catalog service)
}

const daysAgo = (d: Date, now: Date) => (now.getTime() - d.getTime()) / 86_400_000;

export function computeBadge(p: BadgeInput, context: BadgeContext = "default", now = new Date()): Badge {
  const total = p.stocks.reduce((s, n) => s + n, 0);
  if (p.stocks.length > 0 && total === 0) return "Out of stock";
  if (p.stocks.some((n) => n >= 1 && n <= LOW_STOCK_MAX)) return "Low stock";

  const sale = p.onSale;
  const restocked = !!p.restockedAt && daysAgo(p.restockedAt, now) <= RESTOCKED_WINDOW_DAYS;
  const best = p.isBestSeller;
  const isNew = daysAgo(p.createdAt, now) <= NEW_WINDOW_DAYS;

  // Default order: Sale → Restocked → Best seller → New → Core.
  // A demoted badge drops to just above Core.
  const order: [Badge, boolean][] = [
    ["Sale", sale && context !== "sale"],
    ["Restocked", restocked],
    ["Best seller", best],
    ["New", isNew && context !== "new-arrivals"],
    ["Sale", sale && context === "sale"],
    ["New", isNew && context === "new-arrivals"],
  ];
  for (const [badge, hit] of order) if (hit) return badge;
  return "Core";
}

/** Visual tone per badge — matches the design's badgeStyle(). */
export function badgeTone(b: Badge): "core" | "dark" | "orange" {
  if (b === "Core") return "core";
  if (b === "Low stock" || b === "Out of stock") return "dark";
  return "orange";
}
