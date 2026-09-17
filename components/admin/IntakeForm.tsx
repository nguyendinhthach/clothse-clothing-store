"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { receiveStockAction } from "@/lib/actions/admin-storage";
import { formatVnd } from "@/lib/format";
import type { IntakeLine } from "@/lib/services/admin/storage";
import styles from "./admin.module.css";

export interface IntakeVocab {
  brands: { id: number; name: string }[];
  categories: { id: number; name: string; sizes: { id: number; label: string }[] }[];
  products: { id: number; name: string; sku: string; brandId: number; sizes: { variantId: number; label: string; stock: number }[] }[];
}

interface Line {
  mode: "existing" | "new";
  productId: string;
  variantId: string;
  itemDescription: string;
  categoryId: string;
  sizeOptionId: string;
  qty: string;
  cost: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const empty = (): Line => ({ mode: "existing", productId: "", variantId: "", itemDescription: "", categoryId: "", sizeOptionId: "", qty: "", cost: "" });
const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/\D/g, "")));

/** "New stock intake" modal (design): one brand + date, any number of single-size lines. */
export function IntakeForm({ vocab, onClose }: { vocab: IntakeVocab; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState(String(vocab.brands[0]?.id ?? ""));
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState<Line[]>([empty()]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const brandProducts = vocab.products.filter((p) => String(p.brandId) === brandId);
  const lineTotal = (l: Line) => (Number.isNaN(num(l.qty)) || Number.isNaN(num(l.cost)) ? 0 : num(l.qty) * num(l.cost));
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: IntakeLine[] = lines.map((l) => ({
      mode: l.mode,
      variantId: l.mode === "existing" ? Number(l.variantId) || undefined : undefined,
      itemDescription: l.mode === "new" ? l.itemDescription : undefined,
      categoryId: l.mode === "new" ? Number(l.categoryId) || undefined : undefined,
      sizeOptionId: l.mode === "new" ? Number(l.sizeOptionId) || undefined : undefined,
      qty: num(l.qty),
      unitCost: num(l.cost),
    }));
    start(async () => {
      const r = await receiveStockAction({ brandId: Number(brandId), receivedAt: date, lines: input });
      if (!r.ok) { setError(r.error); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHead}>
          <h2 className={styles.h2}>New stock intake</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.modalBody} style={{ display: "flex", flexDirection: "column" }}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Brand</span>
              <select value={brandId} onChange={(e) => { setBrandId(e.target.value); setLines((ls) => ls.map((l) => ({ ...l, productId: "", variantId: "" }))); }} className={styles.input}>
                {vocab.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Date received</span>
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className={`${styles.input} ${styles.mono}`} />
            </label>
          </div>

          <span className={styles.fieldLabel}>Line items</span>
          {lines.map((l, i) => {
            const product = brandProducts.find((p) => String(p.id) === l.productId);
            const category = vocab.categories.find((c) => String(c.id) === l.categoryId);
            return (
              <div key={i} className={styles.lineBox}>
                <div className={styles.lineTop}>
                  <span className={styles.modeToggle}>
                    <button type="button" aria-pressed={l.mode === "existing"} onClick={() => setLine(i, { mode: "existing" })} className={`${styles.modeBtn} ${l.mode === "existing" ? styles.modeOn : ""}`}>Existing product</button>
                    <button type="button" aria-pressed={l.mode === "new"} onClick={() => setLine(i, { mode: "new" })} className={`${styles.modeBtn} ${l.mode === "new" ? styles.modeOn : ""}`}>Not listed yet</button>
                  </span>
                  <span className={styles.lineMeta}>
                    <span>{String(i + 1).padStart(2, "0")} · {formatVnd(lineTotal(l))}</span>
                    {lines.length > 1 && <button type="button" onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} className={styles.smallBtn}>Remove</button>}
                  </span>
                </div>

                <div className={styles.lineGrid}>
                  {l.mode === "existing" ? (
                    <>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Product</span>
                        <select value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value, variantId: "" })} className={`${styles.input} ${styles.inputSm}`}>
                          <option value="">Select a product…</option>
                          {brandProducts.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Size *</span>
                        <select value={l.variantId} disabled={!product} onChange={(e) => setLine(i, { variantId: e.target.value })} className={`${styles.input} ${styles.inputSm}`}>
                          <option value="">{product ? "Choose size…" : "Pick a product first"}</option>
                          {product?.sizes.map((s) => <option key={s.variantId} value={s.variantId}>{s.label} · {s.stock} in stock</option>)}
                        </select>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={`${styles.field} ${styles.lineWide}`}>
                        <span className={styles.fieldLabel}>Item description</span>
                        <input value={l.itemDescription} onChange={(e) => setLine(i, { itemDescription: e.target.value })} placeholder="Reverse weave hood — grey marl" className={`${styles.input} ${styles.inputSm}`} />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Category *</span>
                        <select value={l.categoryId} onChange={(e) => setLine(i, { categoryId: e.target.value, sizeOptionId: "" })} className={`${styles.input} ${styles.inputSm}`}>
                          <option value="">Choose…</option>
                          {vocab.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Size *</span>
                        <select value={l.sizeOptionId} disabled={!category} onChange={(e) => setLine(i, { sizeOptionId: e.target.value })} className={`${styles.input} ${styles.inputSm}`}>
                          <option value="">{category ? "Choose size…" : "Pick a category first"}</option>
                          {category?.sizes.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </label>
                    </>
                  )}
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Quantity</span>
                    <input value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="40" className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Unit cost (VNĐ)</span>
                    <input value={l.cost} onChange={(e) => setLine(i, { cost: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="960000" className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                  </label>
                </div>
                {l.mode === "new" && <span className={styles.hint}>Stays unlinked until you list it as a product — the size is recorded now so Add Product can match it.</span>}
              </div>
            );
          })}
          <button type="button" onClick={() => setLines((ls) => [...ls, empty()])} className={styles.linkBtn}>+ Add line</button>
          <span className={styles.hintBox}>Intake total {formatVnd(total)} · {lines.length} {lines.length === 1 ? "line" : "lines"} · each line is one size at one cost</span>
          {error && <div className={styles.error} role="alert">{error}</div>}
        </div>
        <div className={styles.modalFoot}>
          <button type="button" onClick={onClose} className={styles.ghostBtn}>Cancel</button>
          <button type="submit" disabled={pending} className={styles.primaryBtn}>{pending ? "Saving…" : "Confirm intake"}</button>
        </div>
      </form>
    </div>
  );
}
