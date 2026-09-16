import type { Metadata } from "next";
import Link from "next/link";
import { Filters } from "@/components/shop/Filters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SortSelect } from "@/components/shop/SortSelect";
import { routes } from "@/lib/routes";
import { getFilterFacets, listProducts } from "@/lib/services/catalog";
import { getFavouriteIds } from "@/lib/services/favourites";
import { getCurrentUser } from "@/lib/session";
import { parseShopParams } from "@/lib/shop-params";
import styles from "@/components/shop/shop.module.css";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = parseShopParams(await searchParams);
  const user = await getCurrentUser();
  const [listing, facets, favouriteIds] = await Promise.all([
    listProducts({ ...params, scope: "all", context: "default" }),
    getFilterFacets(),
    user ? getFavouriteIds(user.id) : null,
  ]);

  const title = params.q ? `“${params.q}”` : params.cats.length === 1 ? params.cats[0] : "All products";

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Home</Link>
            <span>/</span>
            <span>Shop</span>
          </nav>
          <h1 className={styles.h1}>{title}</h1>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.count}>{listing.total} items</span>
          <span className={styles.countSub}>New arrivals weekly</span>
        </div>
      </section>

      <div className={styles.layout}>
        <Filters basePath={routes.shop()} params={params} facets={facets} total={listing.total} />
        <section className={styles.results}>
          <div className={styles.toolbar}>
            <span className={styles.shown}>Showing {listing.shown} of {listing.total}</span>
            <SortSelect basePath={routes.shop()} params={params} />
          </div>
          <ProductGrid basePath={routes.shop()} params={params} listing={listing} favouriteIds={favouriteIds} />
        </section>
      </div>
    </div>
  );
}
