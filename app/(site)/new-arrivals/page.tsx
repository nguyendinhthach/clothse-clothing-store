import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPills } from "@/components/shop/CategoryPills";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { NEW_WINDOW_DAYS } from "@/lib/badges";
import { categoryLabel } from "@/lib/catalog-constants";
import { routes } from "@/lib/routes";
import { getFilterFacets, listProducts } from "@/lib/services/catalog";
import { getFavouriteIds } from "@/lib/services/favourites";
import { getCurrentUser } from "@/lib/session";
import { parseShopParams } from "@/lib/shop-params";
import shop from "@/components/shop/shop.module.css";
import styles from "./new-arrivals.module.css";

export const metadata: Metadata = { title: "Hàng mới" };

const days = (d: Date, now: Date) => (now.getTime() - d.getTime()) / 86_400_000;

function updatedLabel(d: number) {
  if (d < 1) return "hôm nay";
  if (d < 2) return "hôm qua";
  if (d < 7) return `${Math.round(d)} ngày trước`;
  return `${Math.floor(d / 7)} tuần trước`;
}
function agoLabel(d: number) {
  if (d < 1) return "hôm nay";
  const n = Math.floor(d);
  if (n < 7) return `${Math.max(n, 1)} ngày trước`;
  return `${Math.floor(n / 7)} tuần trước`;
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
              <Link href={routes.home}>Trang chủ</Link>
              <span>/</span>
              <span>Hàng mới</span>
            </nav>
            {newest && (
              <div className={styles.updated}>
                <span className={styles.dot} />
                Cập nhật {updatedLabel(days(newest, now))}
              </div>
            )}
            <h1 className={styles.h1}>
              Vừa <em>cập bến</em>
            </h1>
            <p className={styles.lead}>Hàng về trong {NEW_WINDOW_DAYS} ngày gần nhất, tuyển mỗi tuần, mới nhất xếp trước.</p>
            <div className={styles.stats}>
              <span><strong>{all.total}</strong> món trong đợt</span>
              <span><strong>{weekCount}</strong> về tuần này</span>
            </div>
          </div>
          <div className={styles.heroArt}>
            <span className={styles.heroArtLabel}>Ảnh editorial — đợt hàng mới</span>
            <span className={styles.heroTag}>Drop 04 / Thu</span>
          </div>
        </div>
      </section>

      <div className={`container ${shop.page}`}>
        <section className={shop.pillBar}>
          <CategoryPills basePath={routes.newArrivals} categories={facets.categories} active={cat} />
          <div className={shop.barRight}>
            <Link href={routes.shop()} className={shop.browseAll}>Xem toàn bộ cửa hàng →</Link>
          </div>
        </section>
        <section className={shop.gridSection}>
          <ProductGrid
            basePath={routes.newArrivals}
            params={params}
            listing={{ ...listing, items: listing.items }}
            favouriteIds={favouriteIds}
            emptyTitle="Chưa có hàng mới"
            emptyHint={`${NEW_WINDOW_DAYS} ngày gần đây chưa có gì về${cat ? ` ở nhóm ${categoryLabel(cat)}` : ""}. Hàng mới lên mỗi tuần — quay lại sớm nhé.`}
            noteFor={(p) => agoLabel(days(p.createdAt, now))}
          />
        </section>
      </div>
    </>
  );
}
