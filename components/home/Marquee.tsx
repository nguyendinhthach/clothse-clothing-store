import { formatVnd } from "@/lib/format";
import { FREE_SHIPPING_OVER } from "@/lib/shipping";
import styles from "./home.module.css";

const ITEMS = ["Hàng mới mỗi tuần", `Miễn ship từ ${formatVnd(FREE_SHIPPING_OVER)}`, "Đổi trả trong 30 ngày", "Giao toàn quốc"];

export function Marquee() {
  const half = ITEMS.map((t) => `${t} ✱`).join(" ");
  const line = `${half} ${half}`;
  return (
    <section className={styles.marquee} aria-hidden="true">
      <div className={styles.marqueeTrack}>
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </section>
  );
}
