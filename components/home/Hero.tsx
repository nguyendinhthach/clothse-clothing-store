import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatVnd } from "@/lib/format";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";
import styles from "./home.module.css";

// Four looks per the design; swap `src` in once the photography exists (public/images/hero-N.jpg).
const SLIDES: HeroSlide[] = [
  { label: "hero lifestyle shot", tint: ["#e1deea", "#d3cfe0"] },
  { label: "street editorial shot", tint: ["#dcd8e8", "#cbc6dc"] },
  { label: "denim detail shot", tint: ["#e4e1ec", "#d0ccdf"] },
  { label: "outerwear studio shot", tint: ["#d8d4e5", "#c6c1d8"] },
];

export function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <div>
        <div className={styles.pill}>
          <span className={styles.dot} />
          New arrivals weekly
        </div>
        <h1 className={styles.h1}>
          The brands
          <br />
          <span className={styles.h1Mark}>You want</span>
          <br />
          One place.
        </h1>
        <p className={styles.lead}>
          Carhartt, Stüssy, Nike, Champion and more — the streetwear labels worth wearing, stocked in one place. Fresh
          arrivals every week, real sizes, no hype tax.
        </p>
        <div className={styles.ctas}>
          <Link href={routes.shop()} className={styles.btnPrimary}>Shop Now</Link>
          <Link href={routes.newArrivals} className={styles.btnGhost}>New arrivals</Link>
        </div>
        <div className={styles.usps}>
          <span>Free shipping over {formatVnd(FREE_SHIPPING_OVER)}</span>
          <span>30-day returns</span>
          <span>Ships nationwide</span>
        </div>
      </div>
      <HeroCarousel slides={SLIDES} />
    </section>
  );
}
