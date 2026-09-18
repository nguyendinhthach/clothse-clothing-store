import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./home.module.css";

export function SaleBanner({ maxPercent }: { maxPercent: number }) {
  return (
    <section id="sale" className={styles.sale}>
      <div className={`container ${styles.saleInner}`}>
        <div>
          <span className={styles.saleKicker}>Cuối mùa / giá chốt</span>
          <h2 className={styles.saleH2}>{maxPercent > 0 ? `Giảm đến ${maxPercent}%` : "Giá chốt"}</h2>
        </div>
        <div className={styles.saleRight}>
          <p className={styles.saleLead}>Size cuối của các mùa trước. Giảm một lần, hết là thôi — không nhập lại.</p>
          <Link href={routes.sale} className={styles.btnDark}>Săn sale</Link>
        </div>
      </div>
    </section>
  );
}
