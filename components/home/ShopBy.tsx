import Link from "next/link";
import { routes } from "@/lib/routes";
import { Placeholder } from "@/components/product/Placeholder";
import styles from "./home.module.css";

interface Tile {
  label: string;
  count: number;
  tag: string | null; // null = New Arrivals (badge-based, SPEC §6.12)
}

export function ShopBy({ tiles }: { tiles: Tile[] }) {
  return (
    <section id="categories" className={`container ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>Shop by</h2>
        <span className={styles.eyebrow}>{String(tiles.length).padStart(2, "0")} groups</span>
      </div>
      <div className={styles.tiles}>
        {tiles.map((t, i) => (
          <Link key={t.label} href={t.tag ? routes.shop({ tag: t.tag }) : routes.newArrivals} className={styles.tile}>
            <span className={styles.tileZoom}>
              <Placeholder label={t.label.toLowerCase()} />
            </span>
            <span className={styles.tileTint} />
            <span className={styles.tileText}>
              <span className={styles.tileTag}>
                {String(i + 1).padStart(2, "0")} / {t.count} {t.count === 1 ? "style" : "styles"}
              </span>
              <span className={styles.tileBottom}>
                <span className={styles.tileLabel}>{t.label}</span>
                <span className={styles.tileArrow}>→</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
