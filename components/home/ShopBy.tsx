import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./home.module.css";

/** Tile photo per audience tag (null = the whole shop). The label sits on top, so the image is decorative. */
const TILE_IMAGE: Record<string, string> = {
  Men: "/images/shop-men.jpg",
  Women: "/images/shop-women.jpg",
  Unisex: "/images/shop-unisex.jpg",
  all: "/images/shop-all.jpg",
};

interface Tile {
  label: string;
  count: number;
  tag: string | null; // null = the whole shop
}

export function ShopBy({ tiles }: { tiles: Tile[] }) {
  return (
    <section id="categories" className={`container ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>Bắt đầu từ đây</h2>
        <span className={styles.eyebrow}>{String(tiles.length).padStart(2, "0")} nhóm</span>
      </div>
      <div className={styles.tiles}>
        {tiles.map((t) => (
          <Link key={t.label} href={t.tag ? routes.shop({ tag: t.tag }) : routes.shop()} className={styles.tile}>
            <span className={styles.tileZoom}>
              <Image src={TILE_IMAGE[t.tag ?? "all"]} alt="" fill sizes="(max-width: 599px) 100vw, (max-width: 1099px) 50vw, 25vw" className={styles.tileImg} />
            </span>
            <span className={styles.tileTint} />
            <span className={styles.tileText}>
              <span className={styles.tileTag}>{t.count} mẫu</span>
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
