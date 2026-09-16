import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./home.module.css";

export function SaleBanner({ maxPercent }: { maxPercent: number }) {
  return (
    <section id="sale" className={styles.sale}>
      <div className={`container ${styles.saleInner}`}>
        <div>
          <span className={styles.saleKicker}>End of season / final cuts</span>
          <h2 className={styles.saleH2}>{maxPercent > 0 ? `Up to ${maxPercent}% off` : "Final cuts"}</h2>
        </div>
        <div className={styles.saleRight}>
          <p className={styles.saleLead}>Last-chance sizes from past seasons. Marked down once, then off the shelf for good.</p>
          <Link href={routes.sale} className={styles.btnDark}>Shop the sale</Link>
        </div>
      </div>
    </section>
  );
}
