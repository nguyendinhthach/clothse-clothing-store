import type { Metadata } from "next";
import Link from "next/link";
import { FavouriteCard } from "@/components/favourites/FavouriteCard";
import { routes } from "@/lib/routes";
import { getFavouriteCards } from "@/lib/services/catalog";
import { requireUser } from "@/lib/session";
import styles from "@/components/favourites/favourites.module.css";

export const metadata: Metadata = { title: "Favourites" };

export default async function FavouritesPage() {
  const user = await requireUser(routes.favourites);
  const items = await getFavouriteCards(user.id);
  const alerts = items.filter((i) => i.notify).length;

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Home</Link>
            <span>/</span>
            <span className={styles.crumbOn}>Favourites</span>
          </nav>
          <h1 className={styles.h1}>Favourites</h1>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKicker}>Saved</span>
          <span className={styles.metaCount}>
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </span>
          <span className={styles.metaNote}>{alerts > 0 ? `${alerts} with alerts on` : "No alerts set"}</span>
        </div>
      </section>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyKicker}>0 items saved</span>
          <h3 className={styles.emptyTitle}>No favourites yet</h3>
          <p className={styles.emptyBody}>
            Tap the heart on anything you like — we&apos;ll keep it here and can ping you when it restocks or drops in price.
          </p>
          <Link href={routes.shop()} className={styles.emptyBtn}>Start browsing</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((i) => (
            <FavouriteCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
