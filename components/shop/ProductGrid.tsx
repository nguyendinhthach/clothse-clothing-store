import Link from "next/link";
import { PAGE_SIZE, type SortKey } from "@/lib/catalog-constants";
import type { Listing, ProductCardData } from "@/lib/services/catalog";
import { buildShopQuery, type ShopParams } from "@/lib/shop-params";
import { ProductCard } from "@/components/product/ProductCard";
import styles from "./shop.module.css";

interface Props {
  basePath: string;
  params: ShopParams;
  listing: Listing;
  favouriteIds: Set<number> | null; // null = guest
  emptyTitle?: string;
  emptyHint?: string;
  /** Optional per-card note (New Arrivals: "3 days ago", Sale: "save 160.000₫"). */
  noteFor?: (p: ProductCardData) => string;
  defaultSort?: SortKey;
}

export function ProductGrid({ basePath, params, listing, favouriteIds, emptyTitle = "Không có món nào khớp", emptyHint = "Nới khoảng giá hoặc bỏ một danh mục thử xem.", noteFor, defaultSort = "new" }: Props) {
  if (listing.total === 0) {
    return (
      <div className={styles.empty}>
        <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
        <p className={styles.emptyHint}>{emptyHint}</p>
        <Link href={basePath} className={styles.emptyBtn}>Xoá bộ lọc</Link>
      </div>
    );
  }
  return (
    <>
      <div className={styles.grid}>
        {listing.items.map((p) => (
          <ProductCard key={p.id} product={p} variant="grid" favourite={favouriteIds ? favouriteIds.has(p.id) : null} note={noteFor?.(p)} />
        ))}
      </div>
      {listing.shown < listing.total && (
        <div className={styles.more}>
          <Link href={basePath + buildShopQuery({ ...params, show: listing.shown + PAGE_SIZE }, defaultSort)} scroll={false} className={styles.moreBtn}>
            Xem thêm
          </Link>
        </div>
      )}
    </>
  );
}
