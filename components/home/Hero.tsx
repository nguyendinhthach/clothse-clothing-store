import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatVnd } from "@/lib/format";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";
import styles from "./home.module.css";

// Four looks per the design; swap `src` in once the photography exists (public/images/hero-N.jpg).
const SLIDES: HeroSlide[] = [
  { label: "ảnh lifestyle", tint: ["#e1deea", "#d3cfe0"] },
  { label: "ảnh street editorial", tint: ["#dcd8e8", "#cbc6dc"] },
  { label: "ảnh chi tiết denim", tint: ["#e4e1ec", "#d0ccdf"] },
  { label: "ảnh studio áo khoác", tint: ["#d8d4e5", "#c6c1d8"] },
];

export function Hero() {
  return (
    <section className={`container ${styles.hero}`}>
      <div>
        <div className={styles.pill}>
          <span className={styles.dot} />
          Hàng mới mỗi tuần
        </div>
        <h1 className={styles.h1}>
          Đủ chất
          <br />
          <span className={styles.h1Mark}>Đủ tự tin</span>
          <br />
          Khỏi cần
          <br />
          Chứng minh.
        </h1>
        <p className={styles.lead}>
          Những label streetwear đáng mặc, gom về một chỗ. Hàng mới mỗi tuần, size thật, giá niêm yết.
        </p>
        <div className={styles.ctas}>
          <Link href={routes.shop()} className={styles.btnPrimary}>Mua ngay</Link>
          <Link href={routes.newArrivals} className={styles.btnGhost}>Xem hàng mới</Link>
        </div>
        <div className={styles.usps}>
          <span>Miễn ship từ {formatVnd(FREE_SHIPPING_OVER)}</span>
          <span>Đổi trả trong 30 ngày</span>
          <span>Giao toàn quốc</span>
        </div>
      </div>
      <HeroCarousel slides={SLIDES} />
    </section>
  );
}
