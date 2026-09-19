"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setNotifyAction, toggleFavouriteAction } from "@/lib/actions/favourites";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { FavouriteCard as Data } from "@/lib/services/catalog";
import { Badge } from "@/components/product/Badge";
import { Placeholder } from "@/components/product/Placeholder";
import styles from "./favourites.module.css";

export function FavouriteCard({ item: p }: { item: Data }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notify, setNotify] = useOptimistic(p.notify);
  const href = routes.product(p.id);
  const off = !p.active;
  const oos = off || p.sizesInStock.length === 0;
  const sale = p.onSale && p.salePrice != null;
  const price = sale ? p.salePrice! : p.price;

  const note = off
    ? "Món này đã ngừng bán — shop sẽ báo nếu bán lại."
    : oos
    ? "Shop sẽ email bạn ngay khi món này có hàng lại."
    : sale
      ? "Lần giảm giá tiếp theo của món này bạn sẽ được báo."
      : "Đang bật báo tin khi có hàng lại hoặc giảm giá.";

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Link href={href} className={`${styles.zoom} ${oos ? styles.dim : ""}`} aria-label={p.name}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image.url} alt={p.image.alt ?? p.name} className={styles.img} />
          ) : (
            <Placeholder label={p.name} />
          )}
        </Link>
        <Badge badge={p.badge} className={styles.badge} />
        <button
          type="button"
          aria-label="Bỏ khỏi yêu thích"
          disabled={pending}
          className={styles.unfav}
          onClick={() => start(async () => { await toggleFavouriteAction(p.id, routes.favourites); router.refresh(); })}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 20.5 4.6 13.3a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7L12 20.5Z" /></svg>
        </button>
        {!oos && <Link href={href} className={styles.cta}>Thêm vào giỏ</Link>}
      </div>

      <div className={styles.body}>
        <span className={styles.brand}>{p.brand}</span>
        <div className={styles.row}>
          <h3 className={styles.name}><Link href={href}>{p.name}</Link></h3>
          <span className={styles.prices}>
            {sale && <s className={styles.was}>{formatVnd(p.price)}</s>}
            <span className={`${styles.price} ${sale ? styles.priceSale : ""}`}>{formatVnd(price)}</span>
          </span>
        </div>
        <div className={styles.foot}>
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            disabled={pending}
            className={`${styles.notify} ${notify ? styles.notifyOn : ""}`}
            onClick={() => start(async () => { setNotify(!notify); await setNotifyAction(p.id, !notify); })}
          >
            <span className={styles.track}><span className={styles.knob} /></span>
            Báo tôi
          </button>
          {(oos || sale) && <span className={`${styles.status} ${oos ? styles.statusOos : styles.statusSale}`}>{off ? "Ngừng bán" : oos ? "Hết hàng" : "Đang sale"}</span>}
        </div>
        {notify && <span className={styles.note}>{note}</span>}
      </div>
    </article>
  );
}
