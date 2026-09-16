import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { NEW_WINDOW_DAYS } from "@/lib/badges";
import { routes } from "@/lib/routes";
import { getFilterFacets, listProducts } from "@/lib/services/catalog";
import { getFavouriteIds } from "@/lib/services/favourites";
import { getCurrentUser } from "@/lib/session";
import { parseShopParams } from "@/lib/shop-params";
import shop from "@/components/shop/shop.module.css";
import styles from "./new-arrivals.module.css";

export const metadata: Metadata = { title: "New Arrivals" };

const days = (d: Date, now: Date) => (now.getTime() - d.getTime()) / 86_400_000;

function updatedLabel(d: number) {
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 7) return `${Math.round(d)} days ago`;
  const w = Math.floor(d / 7);
  return w === 1 ? "1 week ago" : `${w} weeks ago`;
}
function agoLabel(d: number) {
  if (d < 1) return "today";
  const n = Math.floor(d);
  if (n <= 1) return "1 day ago";
  if (n < 7) return `${n} days ago`;
  const w = Math.floor(n / 7);
  return w === 1 ? "1 week ago" : `${w} weeks ago`;
}

export default async function NewArrivalsPage({ searchParams }: PageProps<"/new-arrivals">) {
  const now = new Date();
  const params = parseShopParams(await searchParams);
  const cat = params.cats[0] ?? null;
  const user = await getCurrentUser();
  const [listing, all, facets, favouriteIds] = await Promise.all([
    listProducts({ cats: cat ? [cat] : [], show: params.show, scope: "new", context: "new-arrivals" }, now),
    listProducts({ scope: "new", show: 1000 }, now),
    getFilterFacets(),
    user ? getFavouriteIds(user.id) : null,
  ]);
  const newest = all.items.reduce<Date | null>((m, p) => (!m || p.createdAt > m ? p.createdAt : m), null);
  const weekCount = all.items.filter((p) => days(p.createdAt, now) <= 7).length;

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href={routes.home}>Home</Link>
              <span>/</span>
              <span>New Arrivals</span>
            </nav>
            {newest && (
              <div className={styles.updated}>
                <span className={styles.dot} />
                Updated {updatedLabel(days(newest, now))}
              </div>
            )}
            <h1 className={styles.h1}>
              Just <em>landed</em>
            </h1>
            <p className={styles.lead}>Fresh drops from the last {NEW_WINDOW_DAYS} days. Curated weekly by the studio, ordered newest first.</p>
            <div className={styles.stats}>
              <span><strong>{all.total}</strong> pieces in window</span>
              <span><strong>{weekCount}</strong> landed this week</span>
              <span><strong>{NEW_WINDOW_DAYS}</strong> day window</span>
            </div>
          </div>
          <div className={styles.heroArt}>
            <span className={styles.heroArtLabel}>Editorial image — new drop</span>
            <span className={styles.heroTag}>Drop 04 / Autumn</span>
          </div>
        </div>
      </section>

      <div className={`container ${shop.page}`}>
        <section className={shop.pillBar}>
          <CategoryPills basePath={routes.newArrivals} categories={facets.categories} active={cat} />
          <div className={shop.barRight}>
            <Link href={routes.shop()} className={shop.browseAll}>Browse all products →</Link>
          </div>
        </section>
        <section className={shop.gridSection}>
          <ProductGrid
            basePath={routes.newArrivals}
            params={params}
            listing={{ ...listing, items: listing.items }}
            favouriteIds={favouriteIds}
            emptyTitle="No new arrivals right now"
            emptyHint={`Nothing has landed in the last ${NEW_WINDOW_DAYS} days${cat ? ` in ${cat}` : ""}. New drops go live every week — check back soon.`}
            noteFor={(p) => agoLabel(days(p.createdAt, now))}
          />
        </section>
      </div>
    </>
  );
}
