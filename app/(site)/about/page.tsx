import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "About ClothSE" };

const STEPS = [
  { title: "Source", body: "We buy directly from established brands — Nike, Carhartt, Stüssy, Champion and others." },
  { title: "Inspect", body: "Every piece is checked for condition and true fit before it's listed." },
  { title: "Measure & Photograph", body: "Real measurements, real photos — never brand stock images." },
  { title: "List", body: "Published with honest specs and no inflated claims." },
];

const VALUES = [
  { title: "Authenticity guaranteed", body: "Every item is checked and verified before listing — no counterfeits, no fakes." },
  { title: "Fast local delivery", body: "1–2 days in Da Lat, 2–4 days nationwide, packed the day after you order." },
  { title: "Easy returns", body: "30 days to send anything back, unworn and with tags, no questions asked." },
  { title: "Pay on delivery", body: "Cash on delivery only — you pay the courier once the parcel is in your hands." },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default async function AboutPage() {
  // Brands come straight from Store Management → Brands; adding one there lists it here.
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { products: true } } } });

  return (
    <>
      <section className={`container ${styles.hero} ${styles.heroSplit}`}>
        <div>
          <span className={styles.tag}><span className={styles.dot} />Multi-brand streetwear · Da Lat</span>
          <h1 className={`${styles.h1} ${styles.h1Big}`}>About<br /><span className={styles.h1Block}>ClothSE</span></h1>
          <p className={styles.lead} style={{ maxWidth: "46ch" }}>Streetwear from the brands you already love, curated in one place — picked by size, fit and wearability, not hype.</p>
          <div className={styles.heroActions}>
            <Link href={routes.shop()} className={styles.primary}>Shop the store</Link>
            <Link href={routes.contact} className={styles.ghost}>Contact us</Link>
          </div>
        </div>
        <div className={styles.art}>
          <span className={styles.artLabel}>lifestyle / editorial shot</span>
          <span className={styles.artCaption}>ClothSE / Da Lat</span>
        </div>
      </section>

      <div className="container">
        <section className={`${styles.section} ${styles.sectionTop}`}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>01</span>
            <h2 className={styles.h2}>What we do</h2>
          </div>
          <div className={styles.body}>
            <p>ClothSE is a multi-brand retail store. We buy, curate and sell streetwear from established labels — Nike, Carhartt, Stüssy, Champion and others — rather than producing our own line.</p>
            <p>Every drop is chosen piece by piece: the fits that work, in sizes people actually wear, at prices that aren&apos;t inflated by resale. If something doesn&apos;t hold up in fabric, cut or value, it doesn&apos;t make the floor.</p>
            <p>New stock lands weekly, listed with real measurements and honest condition notes so you can buy with the same confidence as trying it on.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>02</span>
            <h2 className={styles.h2}>How we curate</h2>
          </div>
          <div className={`${styles.bodyWide} ${styles.cards}`}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.card}>
                <span className={styles.cardNum}>{pad(i + 1)}</span>
                <h3 className={styles.h3}>{s.title}</h3>
                <p className={styles.cardText}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.plain}>
          <div className={styles.rowHead}>
            <div className={styles.sectionHead}>
              <span className={styles.index}>03</span>
              <h2 className={`${styles.h2} ${styles.h2Lg}`}>Our brands</h2>
            </div>
            <span className={styles.index}>{brands.length} {brands.length === 1 ? "brand" : "brands"} currently carried</span>
          </div>
          <div className={styles.brands}>
            {brands.map((b) => (
              <Link key={b.id} href={routes.shop({ q: b.name })} className={styles.brand}>
                <span>
                  <span className={styles.brandName}>{b.name}</span>
                  <span className={styles.brandMeta}>{b._count.products} {b._count.products === 1 ? "piece" : "pieces"} in store</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.dark}>
        <div className={`container ${styles.darkInner}`}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>04</span>
            <h2 className={`${styles.h2} ${styles.h2Lg}`}>Why ClothSE</h2>
          </div>
          <div className={styles.values}>
            {VALUES.map((v, i) => (
              <div key={v.title} className={styles.value}>
                <span className={styles.valueNum}>{pad(i + 1)}</span>
                <h3 className={styles.h3}>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`container ${styles.split}`}>
        <div className={styles.splitText}>
          <span className={styles.index}>05 · Where we are</span>
          <h2 className={`${styles.h2} ${styles.h2Lg}`}>Based in Da Lat,<br />Vietnam</h2>
          <p className={styles.lead}>01 Phu Dong Thien Vuong — orders ship nationwide, and questions get a reply within 1–2 business days.</p>
          <Link href={routes.contact} className={styles.mono} style={{ marginTop: 6 }}>Get in touch →</Link>
        </div>
        <div className={`${styles.art} ${styles.artWide}`}>
          <span className={styles.artLabel}>map — Da Lat, Vietnam</span>
        </div>
      </section>
    </>
  );
}
