import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SortSelect } from "@/components/shop/SortSelect";
import { categoryLabel } from "@/lib/catalog-constants";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getFilterFacets, getMaxSalePercent, listProducts } from "@/lib/services/catalog";
import { getFavouriteIds } from "@/lib/services/favourites";
import { getCurrentUser } from "@/lib/session";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import { parseShopParams } from "@/lib/shop-params";
import shop from "@/components/shop/shop.module.css";
import styles from "./sale.module.css";

export const metadata: Metadata = { title: "Sale" };

export default async function SalePage({ searchParams }: PageProps<"/sale">) {
  const raw = await searchParams;
  const params = parseShopParams(raw);
  // Sale defaults to biggest markdown first (design SORTS[0]).
  const sort = raw.sort ? params.sort : "discount";
  const cat = params.cats[0] ?? null;
  const user = await getCurrentUser();
  const [listing, all, facets, maxPercent, favouriteIds] = await Promise.all([
    listProducts({ cats: cat ? [cat] : [], sort, show: params.show, scope: "sale", context: "sale" }),
    listProducts({ scope: "sale", context: "sale", show: 1000 }),
    getFilterFacets(),
    getMaxSalePercent(),
    user ? getFavouriteIds(user.id) : null,
  ]);
  const lowStock = all.items.filter((p) => p.badge === "Low stock").length;
  const maxLabel = `${maxPercent}%`;
  const marquee = `Giá chốt ✱ Giảm đến ${maxLabel} ✱ Hết là thôi ✱ Không nhập lại ✱ Miễn ship từ ${formatVnd(FREE_SHIPPING_OVER)} ✱ `;

  return (
    <>
      <section className={styles.hero}>
        <span className={styles.heroLines} aria-hidden="true" />
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href={routes.home}>Trang chủ</Link>
              <span>/</span>
              <span className={styles.crumbOn}>Sale</span>
            </nav>
            {all.total > 0 && (
              <div className={styles.live}>
                <span className={styles.dot} />
                Đang diễn ra — giảm đến {maxLabel}
              </div>
            )}
            <h1 className={styles.h1}>
              <span>Sale</span>
              <span className={styles.bang}>!</span>
            </h1>
            <p className={styles.lead}>
              Đồ giảm giá, <strong>giảm một lần duy nhất</strong>. Size nào hết là hết — hàng sale không nhập lại.
            </p>
            <div className={styles.statRow}>
              <div className={`${styles.stat} ${styles.statDark}`}>
                <span className={styles.statNum}>{maxLabel}</span>
                <span className={styles.statLabel}>giảm sâu nhất</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{all.total}</span>
                <span className={styles.statLabel}>món đang giảm</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{lowStock}</span>
                <span className={styles.statLabel}>món sắp hết</span>
              </div>
            </div>
          </div>
          <div className={styles.heroArt}>
            <span className={styles.heroArtLabel}>Ảnh chiến dịch — sale</span>
            <span className={styles.sticker}>Giá chốt</span>
            <span className={styles.heroTag}>Không nhập lại</span>
          </div>
        </div>
      </section>

      <section className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          <span>{marquee}{marquee}</span>
          <span>{marquee}{marquee}</span>
        </div>
      </section>

      <div className={`container ${shop.page}`}>
        <section className={shop.pillBar}>
          <CategoryPills basePath={routes.sale} categories={facets.categories} active={cat} keep={{ sort: sort !== "discount" ? sort : undefined }} />
          <div className={shop.barRight}>
            <SortSelect inline defaultSort="discount" basePath={routes.sale} params={{ ...params, sort }} options={[["discount", "Giảm nhiều nhất"], ["new", "Mới nhất"], ["asc", "Giá thấp → cao"], ["desc", "Giá cao → thấp"]]} />
            <Link href={routes.shop()} className={shop.browseAll}>Về cửa hàng →</Link>
          </div>
        </section>
        <section className={shop.gridSection}>
          <ProductGrid
            basePath={routes.sale}
            params={{ ...params, sort }}
            defaultSort="discount"
            listing={listing}
            favouriteIds={favouriteIds}
            emptyTitle="Hiện chưa có sale"
            emptyHint={`Chưa có món nào giảm giá${cat ? ` ở nhóm ${categoryLabel(cat)}` : ""}. Quay lại vào cuối mùa nhé.`}
            noteFor={(p) => (p.onSale && p.salePrice != null ? `tiết kiệm ${formatVnd(p.price - p.salePrice)}` : "")}
          />
        </section>
      </div>
    </>
  );
}
