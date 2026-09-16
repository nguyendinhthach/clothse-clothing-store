import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SortSelect } from "@/components/shop/SortSelect";
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
  const marquee = `Final cuts ✱ Up to ${maxLabel} off ✱ While stock lasts ✱ No restocks ✱ Free shipping over ${formatVnd(FREE_SHIPPING_OVER)} ✱ `;

  return (
    <>
      <section className={styles.hero}>
        <span className={styles.heroLines} aria-hidden="true" />
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href={routes.home}>Home</Link>
              <span>/</span>
              <span className={styles.crumbOn}>Sale</span>
            </nav>
            {all.total > 0 && (
              <div className={styles.live}>
                <span className={styles.dot} />
                Live now — up to {maxLabel} off
              </div>
            )}
            <h1 className={styles.h1}>
              <span>Sale</span>
              <span className={styles.bang}>!</span>
            </h1>
            <p className={styles.lead}>
              Marked-down pieces, <strong>marked down once</strong>. When a size goes, it&apos;s gone — no restocks on sale lines.
            </p>
            <div className={styles.statRow}>
              <div className={`${styles.stat} ${styles.statDark}`}>
                <span className={styles.statNum}>{maxLabel}</span>
                <span className={styles.statLabel}>biggest cut</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{all.total}</span>
                <span className={styles.statLabel}>pieces reduced</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{lowStock}</span>
                <span className={styles.statLabel}>in low stock</span>
              </div>
            </div>
          </div>
          <div className={styles.heroArt}>
            <span className={styles.heroArtLabel}>Campaign image — sale</span>
            <span className={styles.sticker}>Final cuts</span>
            <span className={styles.heroTag}>No restocks</span>
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
            <SortSelect inline defaultSort="discount" basePath={routes.sale} params={{ ...params, sort }} options={[["discount", "Biggest discount first"], ["new", "Newest"], ["asc", "Price: Low to High"], ["desc", "Price: High to Low"]]} />
            <Link href={routes.shop()} className={shop.browseAll}>Full-price shop →</Link>
          </div>
        </section>
        <section className={shop.gridSection}>
          <ProductGrid
            basePath={routes.sale}
            params={{ ...params, sort }}
            defaultSort="discount"
            listing={listing}
            favouriteIds={favouriteIds}
            emptyTitle="No sales right now"
            emptyHint={`Nothing is marked down${cat ? ` in ${cat}` : ""} at the moment. Check back at the end of the season.`}
            noteFor={(p) => (p.onSale && p.salePrice != null ? `save ${formatVnd(p.price - p.salePrice)}` : "")}
          />
        </section>
      </div>
    </>
  );
}
