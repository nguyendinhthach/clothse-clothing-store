import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatVnd } from "@/lib/format";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";
import styles from "./home.module.css";

// Four looks per the design (lifestyle, street editorial, denim, jacket). The frame is 4:5;
// hero-3 and hero-4 are taller (9:16), so `position` picks which band of the photo stays in view.
const SLIDES: HeroSlide[] = [
  { label: "Look lifestyle: áo thun oversize, quần ống rộng đen, mũ lưỡi trai", src: "/images/hero-3.jpg" },
  { label: "Look street editorial: cây đen, kính râm, dây xích bạc", src: "/images/hero-1.jpg" },
  { label: "Look denim: áo khoác da, jeans ống rộng, sneaker trắng", src: "/images/hero-2.jpg" },
  { label: "Look áo khoác: jacket nâu, quần be xắn gấu, sneaker trắng", src: "/images/hero-4.jpg", position: "50% 90%" },
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
