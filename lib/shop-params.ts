// URL ⇄ listing query. Client-safe (no server imports): the filter sidebar
// builds URLs with the same rules the page uses to read them.

import { PAGE_SIZE, PRICE_MAX, PRICE_MIN, PRICE_STEP, type SortKey } from "@/lib/catalog-constants";

export interface ShopParams {
  cats: string[];
  tags: string[];
  brands: string[];
  min: number;
  max: number;
  q: string;
  sort: SortKey;
  show: number;
}

type Raw = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).filter(Boolean);
const clampPrice = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(n / PRICE_STEP) * PRICE_STEP));
};

export function parseShopParams(raw: Raw): ShopParams {
  const sort = raw.sort;
  const show = Number(raw.show);
  return {
    cats: list(raw.cat),
    tags: list(raw.tag),
    brands: list(raw.brand),
    min: clampPrice(typeof raw.min === "string" ? raw.min : undefined, PRICE_MIN),
    max: clampPrice(typeof raw.max === "string" ? raw.max : undefined, PRICE_MAX),
    q: typeof raw.q === "string" ? raw.q.trim() : "",
    sort: sort === "asc" || sort === "desc" || sort === "discount" ? sort : "new",
    show: Number.isFinite(show) && show > PAGE_SIZE ? Math.floor(show) : PAGE_SIZE,
  };
}

/** Serialise back to a query string; defaults are omitted so URLs stay short. */
export function buildShopQuery(p: Partial<ShopParams>, defaultSort: SortKey = "new"): string {
  const sp = new URLSearchParams();
  if (p.cats?.length) sp.set("cat", p.cats.join(","));
  if (p.tags?.length) sp.set("tag", p.tags.join(","));
  if (p.brands?.length) sp.set("brand", p.brands.join(","));
  if (p.min != null && p.min > PRICE_MIN) sp.set("min", String(p.min));
  if (p.max != null && p.max < PRICE_MAX) sp.set("max", String(p.max));
  if (p.q) sp.set("q", p.q);
  if (p.sort && p.sort !== defaultSort) sp.set("sort", p.sort);
  if (p.show && p.show > PAGE_SIZE) sp.set("show", String(p.show));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function filtersActive(p: ShopParams): boolean {
  return p.cats.length > 0 || p.tags.length > 0 || p.brands.length > 0 || p.min > PRICE_MIN || p.max < PRICE_MAX || !!p.q;
}
