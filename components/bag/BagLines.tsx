"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeBagLinesAction, saveForLaterAction, setBagQtyAction } from "@/lib/actions/bag";
import { CART_MAX_PER_LINE } from "@/lib/cart-constants";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { BagLine } from "@/lib/services/orders";
import { FREE_SHIPPING_OVER, shippingFeeFor } from "@/lib/shipping";
import { Placeholder } from "@/components/product/Placeholder";
import styles from "./bag.module.css";

const LOW = 5;

export function BagLines({ lines }: { lines: BagLine[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(() => lines.map((l) => l.variantId));
  const [pending, start] = useTransition();

  // Lines can disappear server-side (removed, ordered); keep the selection honest.
  const ids = lines.map((l) => l.variantId);
  const sel = selected.filter((id) => ids.includes(id));
  const allOn = lines.length > 0 && sel.length === lines.length;

  const selLines = lines.filter((l) => sel.includes(l.variantId));
  const units = selLines.reduce((n, l) => n + l.qty, 0);
  const subtotal = selLines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const shipping = subtotal === 0 ? 0 : shippingFeeFor(subtotal);
  const total = subtotal + shipping;

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh(); });

  if (lines.length === 0) {
    return (
      <div className={styles.empty}>
        <h3 className={styles.emptyTitle}>Giỏ hàng đang trống</h3>
        <p className={styles.emptyBody}>Chưa có gì được giữ. Hàng mới đã lên rồi đó.</p>
        <Link href={routes.shop()} className={styles.emptyBtn}>Mua ngay</Link>
      </div>
    );
  }

  return (
    <div className={styles.bagGrid}>
      <section className={styles.lines}>
        <div className={styles.linesHead}>
          <label className={styles.selectAll}>
            <button type="button" onClick={() => setSelected(allOn ? [] : ids)} aria-label="Chọn tất cả" className={`${styles.check} ${allOn ? styles.checkOn : ""}`}>
              {allOn ? "✓" : ""}
            </button>
            <span>Chọn tất cả ({lines.length})</span>
          </label>
          {sel.length > 0 && (
            <button type="button" disabled={pending} onClick={() => run(() => removeBagLinesAction(sel))} className={styles.removeSel}>
              Bỏ món đã chọn ({sel.length})
            </button>
          )}
        </div>

        {lines.map((l) => {
          const on = sel.includes(l.variantId);
          const low = l.stock <= LOW;
          const max = Math.min(l.stock, CART_MAX_PER_LINE);
          return (
            <article key={l.variantId} className={styles.line}>
              <button type="button" onClick={() => toggle(l.variantId)} aria-label={`Chọn ${l.name}`} aria-pressed={on} className={`${styles.check} ${on ? styles.checkOn : ""}`}>
                {on ? "✓" : ""}
              </button>
              <Link href={routes.product(l.productId)} className={styles.thumb}>
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image.url} alt={l.image.alt ?? l.name} className={styles.img} />
                ) : (
                  <Placeholder label={l.name} />
                )}
              </Link>
              <div className={styles.lineBody}>
                <div className={styles.lineTop}>
                  <Link href={routes.product(l.productId)} className={styles.lineName}>{l.name}</Link>
                  <span className={styles.lineTotal}>{formatVnd(l.unitPrice * l.qty)}</span>
                </div>
                <div className={styles.chips}>
                  <span className={styles.chip}>Size {l.size}</span>
                  <span className={`${styles.chip} ${styles.chipMuted}`}>{l.sku}</span>
                </div>
                <span className={`${styles.stockNote} ${low ? styles.warn : ""}`}>
                  {l.stock === 0 ? "Hết hàng — bỏ món này để tiếp tục" : low ? `Chỉ còn ${l.stock} — gửi từ Đà Lạt` : "Còn hàng — gửi trong 1–2 ngày"}
                </span>
                <div className={styles.lineActions}>
                  <div className={styles.stepper}>
                    <button type="button" aria-label="Giảm số lượng" disabled={pending || l.qty <= 1} onClick={() => run(() => setBagQtyAction(l.variantId, l.qty - 1))} className={styles.stepBtn}>−</button>
                    <span className={styles.qty}>{l.qty}</span>
                    <button type="button" aria-label="Tăng số lượng" disabled={pending || l.qty >= max} onClick={() => run(() => setBagQtyAction(l.variantId, l.qty + 1))} className={styles.stepBtn}>+</button>
                  </div>
                  <span className={styles.unit}>{formatVnd(l.unitPrice)} / món</span>
                  <div className={styles.lineLinks}>
                    <button type="button" disabled={pending} onClick={() => run(() => saveForLaterAction(l.variantId))} className={styles.textBtn}>Để dành</button>
                    <button type="button" disabled={pending} onClick={() => run(() => removeBagLinesAction([l.variantId]))} className={`${styles.textBtn} ${styles.textBtnDanger}`}>Bỏ</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <Link href={routes.shop()} className={styles.continue}>← Tiếp tục mua sắm</Link>
      </section>

      <aside className={styles.summary}>
        <span className={styles.summaryTitle}>Tóm tắt</span>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}><span>Tạm tính ({units} món)</span><span>{formatVnd(subtotal)}</span></div>
          <div className={styles.summaryRow}><span>Phí ship</span><span>{subtotal === 0 ? "—" : shipping === 0 ? "Miễn phí" : formatVnd(shipping)}</span></div>
          <div className={styles.summaryRow}><span>Thanh toán</span><span className={styles.muted}>Khi nhận hàng (COD)</span></div>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Tổng</span>
          <span className={styles.totalValue}>{formatVnd(total)}</span>
        </div>
        {sel.length > 0 && selLines.every((l) => l.stock > 0) ? (
          <Link href={`${routes.checkout}?lines=${sel.join(",")}`} className={styles.checkoutBtn}>
            Thanh toán — {formatVnd(total)}
          </Link>
        ) : (
          <span className={`${styles.checkoutBtn} ${styles.checkoutOff}`}>{sel.length === 0 ? "Chọn ít nhất một món" : "Bỏ các món đã hết hàng"}</span>
        )}
        <div className={styles.summaryFoot}>
          <span className={styles.shipNote}>
            {subtotal > 0 && subtotal < FREE_SHIPPING_OVER ? `Thêm ${formatVnd(FREE_SHIPPING_OVER - subtotal)} nữa để được miễn ship` : "Đã được miễn ship · Đổi trả 30 ngày"}
          </span>
          <span className={styles.codChip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" /><circle cx="12" cy="12" r="2.4" /></svg>
            Thanh toán khi nhận hàng
          </span>
        </div>
      </aside>
    </div>
  );
}
