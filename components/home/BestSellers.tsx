import type { ProductCardData } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import styles from "./home.module.css";

export function BestSellers({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>Bán chạy</h2>
        <span className={styles.eyebrow}>Nhập lại theo nhu cầu</span>
      </div>
      <div className={styles.bestGrid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="square" />
        ))}
      </div>
    </section>
  );
}
