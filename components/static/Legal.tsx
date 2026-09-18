import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";
import styles from "./static.module.css";

// Building blocks shared by Privacy Policy and Terms of Service.

export function LegalHero({ kicker, title, block, lead }: { kicker: string; title: string; block: string; lead: string }) {
  return (
    <section className={`container ${styles.hero} ${styles.heroRuled}`}>
      <span className={styles.tag}>{kicker}</span>
      <h1 className={styles.h1}>{title}<br /><span className={styles.h1Block}>{block}</span></h1>
      <p className={styles.lead} style={{ maxWidth: "54ch" }}>{lead}</p>
    </section>
  );
}

export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className={`${styles.section} ${styles.legalSection}`}>
      <div className={styles.sectionHead}>
        <span className={styles.index}>{String(n).padStart(2, "0")}</span>
        <h2 className={`${styles.h2} ${styles.h2Sm}`}>{title}</h2>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export function LegalBand() {
  return (
    <section className={styles.band}>
      <div className={styles.bandText}>
        <h2 className={`${styles.h2} ${styles.h2Sm}`}>Còn băn khoăn?</h2>
        <p>Hỏi thẳng shop — mọi tin nhắn được trả lời trong 1–2 ngày làm việc.</p>
      </div>
      <Link href={routes.contact} className={`${styles.mono} ${styles.monoInverse}`}>Liên hệ →</Link>
    </section>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className={styles.callout}>{children}</div>;
}
