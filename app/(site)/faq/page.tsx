import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/static/FaqList";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <section className={`container ${styles.hero} ${styles.heroRuled}`}>
        <span className={styles.tag}>Support · FAQ</span>
        <h1 className={`${styles.h1} ${styles.h1Small}`}>Frequently<br /><span className={styles.h1Block}>Asked</span><br />Questions</h1>
        <p className={styles.lead}>Can&apos;t find what you&apos;re looking for? <Link href={routes.contact}>Contact us</Link>.</p>
      </section>

      <div className={`container ${styles.faq}`}>
        <FaqList groups={FAQ_GROUPS} />
        <section className={styles.band}>
          <div className={styles.bandText}>
            <h2 className={`${styles.h2} ${styles.h2Sm}`}>Still stuck?</h2>
            <p>Send us the details and we&apos;ll answer within 1–2 business days.</p>
          </div>
          <Link href={routes.contact} className={`${styles.mono} ${styles.monoInverse}`}>Contact us →</Link>
        </section>
      </div>
    </>
  );
}
