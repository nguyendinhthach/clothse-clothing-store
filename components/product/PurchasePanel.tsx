"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCartAction } from "@/lib/actions/cart";
import { formatVnd } from "@/lib/format";
import { CART_MAX_PER_LINE } from "@/lib/cart-constants";
import { FavouriteButton } from "./FavouriteButton";
import styles from "./PurchasePanel.module.css";

interface Size {
  variantId: number;
  label: string;
  stock: number;
}

interface Props {
  productId: number;
  price: number; // what the customer pays
  sizes: Size[];
  favourite: boolean | null;
}

const LOW = 5;

/** Size pills, quantity stepper, Add to bag and the heart — the interactive half of the detail page. */
export function PurchasePanel({ productId, price, sizes, favourite }: Props) {
  const pathname = usePathname();
  const firstInStock = sizes.find((s) => s.stock > 0) ?? null;
  const [size, setSize] = useState<Size | null>(firstInStock);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const soldOut = !firstInStock;
  const maxQty = size ? Math.min(size.stock, CART_MAX_PER_LINE) : 1;

  let note = "Choose a size";
  let noteTone = styles.noteMuted;
  if (soldOut) note = "Sold out in every size";
  else if (size && size.stock <= LOW) {
    note = `Only ${size.stock} left in ${size.label}`;
    noteTone = styles.noteWarn;
  } else if (size) note = `Selected: ${size.label} — in stock`;

  function pick(s: Size) {
    setSize(s);
    setQty((q) => Math.min(q, Math.min(s.stock, CART_MAX_PER_LINE)));
    setMsg(null);
  }

  function add() {
    if (!size) return;
    start(async () => {
      const r = await addToCartAction(size.variantId, qty, pathname);
      setMsg({ ok: r.ok, text: r.message });
    });
  }

  return (
    <>
      <div className={styles.sizes}>
        <div className={styles.sizesHead}>
          <span className={styles.label}>Size</span>
          <a href="#size-guide" className={styles.guideLink}>Size guide</a>
        </div>
        <div className={styles.pills}>
          {sizes.map((s) => {
            const out = s.stock === 0;
            const on = size?.variantId === s.variantId;
            return (
              <button key={s.variantId} type="button" disabled={out} onClick={() => pick(s)} aria-pressed={on} className={`${styles.pill} ${on ? styles.pillOn : ""} ${out ? styles.pillOut : ""}`}>
                {s.label}
              </button>
            );
          })}
        </div>
        <span className={`${styles.note} ${noteTone}`}>{note}</span>
      </div>

      <div className={styles.buyRow}>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" disabled={qty <= 1} className={styles.stepBtn}>−</button>
          <span className={styles.qty}>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity" disabled={qty >= maxQty} className={styles.stepBtn}>+</button>
        </div>
        <button type="button" onClick={add} disabled={soldOut || !size || pending} className={styles.addBtn}>
          {soldOut ? "Sold out" : pending ? "Adding…" : msg?.ok ? msg.text : `Add to bag — ${formatVnd(price * qty)}`}
        </button>
        <FavouriteButton productId={productId} favourite={favourite} size={58} className={styles.heart} />
      </div>
      {msg && !msg.ok && <span className={`${styles.note} ${styles.noteWarn}`} role="alert">{msg.text}</span>}
    </>
  );
}
