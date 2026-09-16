"use client";

import { useRouter } from "next/navigation";
import type { SortKey } from "@/lib/catalog-constants";
import { buildShopQuery, type ShopParams } from "@/lib/shop-params";
import styles from "./shop.module.css";

const DEFAULT_OPTIONS: [SortKey, string][] = [
  ["new", "Newest"],
  ["asc", "Price: Low to High"],
  ["desc", "Price: High to Low"],
];

interface Props {
  basePath: string;
  params: ShopParams;
  options?: [SortKey, string][];
  /** Inline (label beside select) as on the Sale page, vs stacked on Shop. */
  inline?: boolean;
  /** The page's implicit sort (omitted from the URL). Sale uses "discount". */
  defaultSort?: SortKey;
}

export function SortSelect({ basePath, params, options = DEFAULT_OPTIONS, inline, defaultSort = "new" }: Props) {
  const router = useRouter();
  return (
    <div className={inline ? styles.sortInline : styles.sortWrap}>
      <span className={styles.groupLabel}>Sort by</span>
      <select
        value={params.sort}
        aria-label="Sort products"
        className={styles.select}
        onChange={(e) => router.replace(basePath + buildShopQuery({ ...params, sort: e.target.value as SortKey, show: undefined }, defaultSort), { scroll: false })}
      >
        {options.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    </div>
  );
}
