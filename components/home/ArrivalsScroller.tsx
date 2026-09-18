"use client";

import Link from "next/link";
import { useRef } from "react";
import { routes } from "@/lib/routes";
import type { ProductCardData } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import styles from "./home.module.css";

export function ArrivalsScroller({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 620), behavior: "smooth" });
  };

  return (
    <section id="new-arrivals" className={`${styles.section} ${styles.arrivals}`}>
      <div className={`container ${styles.sectionHead}`}>
        <h2 className={styles.h2}>Hàng mới về</h2>
        <div className={styles.arrowBtns}>
          <Link href={routes.newArrivals} className={styles.viewAll}>Xem tất cả</Link>
          <button type="button" onClick={() => scroll(-1)} aria-label="Lùi" className={styles.arrowBtn}>←</button>
          <button type="button" onClick={() => scroll(1)} aria-label="Tiến" className={styles.arrowBtn}>→</button>
        </div>
      </div>
      <div ref={ref} className={styles.scroller}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="tall" className={styles.scrollerItem} />
        ))}
      </div>
    </section>
  );
}
