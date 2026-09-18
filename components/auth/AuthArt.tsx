import type { ReactNode } from "react";
import styles from "./auth.module.css";

/** Left-hand campaign panel of the auth pages. */
export function AuthArt({ pill, title, children }: { pill: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.art} aria-hidden="true">
      <span className={styles.artLines} />
      <span className={styles.artFade} />
      <span className={styles.artTag}>
        <span className={`${styles.dot} ${styles.dotAccent}`} />
        Ảnh chiến dịch thành viên
      </span>
      <div className={styles.artCopy}>
        <span className={styles.artPill}>
          <span className={styles.dot} />
          {pill}
        </span>
        <h2 className={styles.artH2}>{title}</h2>
        <p className={styles.artP}>{children}</p>
      </div>
    </section>
  );
}
