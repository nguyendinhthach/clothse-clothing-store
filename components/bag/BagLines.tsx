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
        <h3 className={styles.emptyTitle}>Your bag is empty</h3>
        <p className={styles.emptyBody}>Nothing reserved yet. New arrivals are live.</p>
        <Link href={routes.shop()} className={styles.emptyBtn}>Shop now</Link>
      </div>
    );
  }

  return (
    <div className={styles.bagGrid}>
      <section className={styles.lines}>
        <div className={styles.linesHead}>
          <label className={styles.selectAll}>
            <button type="button" onClick={() => setSelected(allOn ? [] : ids)} aria-label="Select all items" className={`${styles.check} ${allOn ? styles.checkOn : ""}`}>
              {allOn ? "✓" : ""}
            </button>
            <span>Select all ({lines.length})</span>
          </label>
          {sel.length > 0 && (
            <button type="button" disabled={pending} onClick={() => run(() => removeBagLinesAction(sel))} className={styles.removeSel}>
              Remove selected ({sel.length})
            </button>
          )}
        </div>

        {lines.map((l) => {
          const on = sel.includes(l.variantId);
          const low = l.stock <= LOW;
          const max = Math.min(l.stock, CART_MAX_PER_LINE);
          return (
            <article key={l.variantId} className={styles.line}>
              <button type="button" onClick={() => toggle(l.variantId)} aria-label={`Select ${l.name}`} aria-pressed={on} className={`${styles.check} ${on ? styles.checkOn : ""}`}>
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
                  {l.stock === 0 ? "Sold out — remove to continue" : low ? `Only ${l.stock} left — ships from Đà Lạt` : "In stock — ships in 1–2 days"}
                </span>
                <div className={styles.lineActions}>
                  <div className={styles.stepper}>
                    <button type="button" aria-label="Decrease quantity" disabled={pending || l.qty <= 1} onClick={() => run(() => setBagQtyAction(l.variantId, l.qty - 1))} className={styles.stepBtn}>−</button>
                    <span className={styles.qty}>{l.qty}</span>
                    <button type="button" aria-label="Increase quantity" disabled={pending || l.qty >= max} onClick={() => run(() => setBagQtyAction(l.variantId, l.qty + 1))} className={styles.stepBtn}>+</button>
                  </div>
                  <span className={styles.unit}>{formatVnd(l.unitPrice)} each</span>
                  <div className={styles.lineLinks}>
                    <button type="button" disabled={pending} onClick={() => run(() => saveForLaterAction(l.variantId))} className={styles.textBtn}>Save for later</button>
                    <button type="button" disabled={pending} onClick={() => run(() => removeBagLinesAction([l.variantId]))} className={`${styles.textBtn} ${styles.textBtnDanger}`}>Remove</button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <Link href={routes.shop()} className={styles.continue}>← Continue shopping</Link>
      </section>

      <aside className={styles.summary}>
        <span className={styles.summaryTitle}>Summary</span>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}><span>Subtotal ({units} {units === 1 ? "item" : "items"})</span><span>{formatVnd(subtotal)}</span></div>
          <div className={styles.summaryRow}><span>Shipping</span><span>{subtotal === 0 ? "—" : shipping === 0 ? "Free" : formatVnd(shipping)}</span></div>
          <div className={styles.summaryRow}><span>Payment</span><span className={styles.muted}>Cash on delivery</span></div>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatVnd(total)}</span>
        </div>
        {sel.length > 0 && selLines.every((l) => l.stock > 0) ? (
          <Link href={`${routes.checkout}?lines=${sel.join(",")}`} className={styles.checkoutBtn}>
            Checkout — {formatVnd(total)}
          </Link>
        ) : (
          <span className={`${styles.checkoutBtn} ${styles.checkoutOff}`}>{sel.length === 0 ? "Select an item" : "Remove sold-out items"}</span>
        )}
        <div className={styles.summaryFoot}>
          <span className={styles.shipNote}>
            {subtotal > 0 && subtotal < FREE_SHIPPING_OVER ? `${formatVnd(FREE_SHIPPING_OVER - subtotal)} away from free shipping` : "Free shipping unlocked · 30-day returns"}
          </span>
          <span className={styles.codChip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" /><circle cx="12" cy="12" r="2.4" /></svg>
            Cash on delivery
          </span>
        </div>
      </aside>
    </div>
  );
}
