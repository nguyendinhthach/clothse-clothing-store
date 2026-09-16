"use client";

import { useRouter } from "next/navigation";
import type { SortKey } from "@/lib/catalog-constants";
import { buildShopQuery, type ShopParams } from "@/lib/shop-params";
import styles from "./shop.module.css";

export function SortSelect({ basePath, params }: { basePath: string; params: ShopParams }) {
  const router = useRouter();
  return (
    <div className={styles.sortWrap}>
      <span className={styles.groupLabel}>Sort by</span>
      <select
        value={params.sort}
        aria-label="Sort products"
        className={styles.select}
        onChange={(e) => router.replace(basePath + buildShopQuery({ ...params, sort: e.target.value as SortKey, show: undefined }), { scroll: false })}
      >
        <option value="new">Newest</option>
        <option value="asc">Price: Low to High</option>
        <option value="desc">Price: High to Low</option>
      </select>
    </div>
  );
}
