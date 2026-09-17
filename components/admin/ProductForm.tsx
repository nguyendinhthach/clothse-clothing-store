"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { discardImageAction, saveProductAction, uploadImageAction } from "@/lib/actions/admin-products";
import type { ProductFormData, ProductInput } from "@/lib/services/admin/products";
import { skuTypesFor } from "@/lib/sku-codes";
import styles from "./admin.module.css";

export interface FormVocab {
  brands: { id: number; name: string }[];
  categories: { id: number; name: string; sizes: string[] }[];
  tags: string[];
}

interface Props {
  initial: ProductFormData;
  vocab: FormVocab;
  cloudinaryReady: boolean;
  onClose: () => void;
}

const DETAIL_HINTS = [
  { label: "Fabric", value: "480gsm brushed loopback, 100% organic cotton" },
  { label: "Fit", value: "Boxy, true to size" },
  { label: "Made in", value: "Portugal" },
  { label: "Care", value: "Cold wash, dry flat" },
];

export function ProductForm({ initial, vocab, cloudinaryReady, onClose }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<ProductFormData>(() => ({ ...initial, details: initial.details.length ? initial.details : [{ label: "", value: "" }] }));
  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setF((s) => ({ ...s, [k]: v }));

  const editing = !!f.id;
  const category = vocab.categories.find((c) => c.id === f.categoryId) ?? vocab.categories[0];
  const categoryLocked = editing && f.lockedSizes.length > 0;

  // ── tags ──
  const [tagDraft, setTagDraft] = useState("");
  const [tagFocus, setTagFocus] = useState(false);
  const suggestions = tagDraft.trim()
    ? vocab.tags.filter((t) => t.toLowerCase().includes(tagDraft.trim().toLowerCase()) && !f.tags.some((x) => x.toLowerCase() === t.toLowerCase())).slice(0, 6)
    : [];
  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (!f.tags.some((x) => x.toLowerCase() === t.toLowerCase())) set("tags", [...f.tags, vocab.tags.find((x) => x.toLowerCase() === t.toLowerCase()) ?? t]);
    setTagDraft("");
  };

  // ── sizes ──
  const toggleSize = (label: string) => {
    if (f.lockedSizes.includes(label) && f.sizes.includes(label)) return;
    set("sizes", f.sizes.includes(label) ? f.sizes.filter((s) => s !== label) : [...f.sizes, label]);
  };
  const changeCategory = (id: number) => {
    setF((s) => ({ ...s, categoryId: id, sizes: [], sizeGuide: [], typeCode: undefined }));
  };

  // ── images ──
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading((n) => n + files.length);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      const r = await uploadImageAction(fd);
      if (r.ok) setF((s) => ({ ...s, images: [...s.images, { url: r.url, alt: "" }] }));
      else setError(r.error);
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = "";
  }
  const removeImage = (i: number) => {
    const im = f.images[i];
    set("images", f.images.filter((_, k) => k !== i));
    if (!initial.images.some((x) => x.url === im.url)) void discardImageAction(im.url); // only just-uploaded files are deleted on the spot
  };
  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    const next = [...f.images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    set("images", next);
  };

  // ── size guide rows follow the chosen sizes ──
  const guideRows = f.sizes.map((size) => f.sizeGuide.find((g) => g.size === size) ?? { size, chest: "", length: "", sleeve: "" });
  const setGuide = (size: string, key: "chest" | "length" | "sleeve", v: string) => set("sizeGuide", guideRows.map((g) => (g.size === size ? { ...g, [key]: v } : g)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: ProductInput = { ...f, price: f.price === "" ? "" : Number(f.price), salePrice: f.salePrice === "" ? "" : Number(f.salePrice) };
    start(async () => {
      const r = await saveProductAction(input);
      if (!r.ok) { setError(r.error); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <form className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHead}>
          <h2 className={styles.h2}>{editing ? `Edit · ${f.sku}` : "Add product"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Product name</span>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Panel Work Jacket" required className={styles.input} />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Brand</span>
            <select value={f.brandId ?? ""} onChange={(e) => set("brandId", Number(e.target.value) || null)} required className={styles.input}>
              <option value="">Select a brand…</option>
              {vocab.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Category</span>
            <select value={f.categoryId} disabled={categoryLocked} onChange={(e) => changeCategory(Number(e.target.value))} className={styles.input}>
              {vocab.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {categoryLocked && <span className={styles.hint}>Locked — sizes already have stock, batches or orders.</span>}
          </label>

          {!editing && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Item type (sets the SKU)</span>
              <select value={f.typeCode ?? ""} onChange={(e) => set("typeCode", e.target.value || undefined)} required className={styles.input}>
                <option value="">Select…</option>
                {skuTypesFor(category.name).map((t) => <option key={t.code} value={t.code}>{t.label} · CSE-{t.code}-…</option>)}
              </select>
              <span className={styles.hint}>SKU is generated on save (SPEC §7), e.g. CSE-HDY-007.</span>
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Price (VNĐ)</span>
            <input value={f.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, "") === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="1860000" required className={`${styles.input} ${styles.mono}`} />
          </label>

          <div className={`${styles.fieldWide} ${styles.sizeBox}`}>
            <span className={styles.fieldLabel}>Sizes offered · {category.name}</span>
            <div className={styles.sizeChips}>
              {category.sizes.map((label) => {
                const on = f.sizes.includes(label);
                const locked = on && f.lockedSizes.includes(label);
                return (
                  <button key={label} type="button" onClick={() => toggleSize(label)} aria-pressed={on} title={locked ? "Has stock, batches or orders" : undefined} className={`${styles.sizeChip} ${on ? styles.sizeChipOn : ""} ${locked ? styles.sizeChipLocked : ""}`}>
                    {label}
                  </button>
                );
              })}
            </div>
            <span className={styles.hint}>Each size becomes a variant at 0 stock; stock arrives through Storage batches (SPEC §6.5).</span>
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Tags</span>
            <div className={styles.tagWrap}>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onFocus={() => setTagFocus(true)}
                onBlur={() => setTimeout(() => setTagFocus(false), 120)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); } if (e.key === "Backspace" && !tagDraft && f.tags.length) set("tags", f.tags.slice(0, -1)); }}
                placeholder="Type a tag, press Enter…"
                className={styles.input}
              />
              {tagFocus && suggestions.length > 0 && (
                <div role="listbox" className={styles.tagList}>
                  {suggestions.map((s) => (
                    <button key={s} type="button" role="option" aria-selected={false} onMouseDown={() => addTag(s)} className={styles.tagOption}>
                      <span>{s}</span><span className={styles.muted}>existing</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {f.tags.length > 0 && (
              <div className={styles.tagChips}>
                {f.tags.map((t) => (
                  <span key={t} className={styles.tagChip}>
                    {t}
                    <button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className={styles.tagX}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <span className={styles.hint}>Men / Women / Unisex and descriptive labels. New, Sale, Best seller and Restocked are computed — don&apos;t add them (SPEC §6.12).</span>
          </div>

          <div className={`${styles.fieldWide} ${styles.saleBox}`}>
            <button type="button" role="switch" aria-checked={f.onSale} onClick={() => set("onSale", !f.onSale)} className={`${styles.switch} ${f.onSale ? styles.switchOn : ""}`}>
              <span className={styles.switchTrack}><span className={styles.switchKnob} /></span>
              On sale
            </button>
            {f.onSale && (
              <label className={styles.inlineField}>
                <span className={styles.fieldLabel}>Sale price</span>
                <input value={f.salePrice} onChange={(e) => set("salePrice", e.target.value.replace(/\D/g, "") === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="1490000" className={`${styles.input} ${styles.mono}`} style={{ width: 160, height: 44 }} />
              </label>
            )}
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Images</span>
            <div className={styles.imageGrid}>
              {f.images.map((im, i) => (
                <div
                  key={im.url}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { moveImage(dragIdx, i); setDragIdx(i); } }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`${styles.imageSlot} ${i === 0 ? styles.imageCover : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" className={styles.thumbImg} />
                  <span className={styles.imageGrip} title="Drag to reorder">⋮⋮</span>
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove image" className={styles.imageX}>✕</button>
                  {i === 0 && <span className={styles.coverTag}>Cover</span>}
                  <span className={styles.imageNum}>{String(i + 1).padStart(2, "0")}</span>
                </div>
              ))}
              <button type="button" disabled={!cloudinaryReady || uploading > 0} onClick={() => fileInput.current?.click()} className={styles.imageAdd}>
                <span>{uploading > 0 ? "…" : "+"}</span>
                <span>{uploading > 0 ? `Uploading ${uploading}` : "Add"}</span>
              </button>
              <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
            <span className={styles.hint}>{cloudinaryReady ? "Drag to reorder — first image is the cover · JPG, PNG or WebP · max 4 MB" : "Image upload needs CLOUDINARY_* in .env — products still save without images."}</span>
          </div>

          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Description</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Fabric, fit, care notes…" className={`${styles.input} ${styles.textarea}`} />
          </label>

          <div className={`${styles.fieldWide} ${styles.subBox}`}>
            <span className={styles.fieldLabel}>Product details</span>
            {f.details.map((d, i) => (
              <div key={i} className={styles.detailRow}>
                <input value={d.label} onChange={(e) => set("details", f.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder={DETAIL_HINTS[i % DETAIL_HINTS.length].label} className={`${styles.input} ${styles.inputSm}`} />
                <input value={d.value} onChange={(e) => set("details", f.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder={DETAIL_HINTS[i % DETAIL_HINTS.length].value} className={`${styles.input} ${styles.inputSm}`} />
                <button type="button" disabled={f.details.length === 1} onClick={() => set("details", f.details.filter((_, k) => k !== i))} aria-label="Remove detail row" className={styles.closeBtn}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => set("details", [...f.details, { label: "", value: "" }])} className={styles.linkBtn}>+ Add row</button>
            <span className={styles.hint}>Shows as the Product Details accordion on the product page.</span>
          </div>

          <div className={`${styles.fieldWide} ${styles.subBox}`}>
            <span className={styles.fieldLabel}>Size guide · measurements in cm</span>
            {guideRows.length === 0 ? (
              <span className={styles.hintBox}>Pick the sizes offered first — one row per size appears here.</span>
            ) : (
              guideRows.map((g) => (
                <div key={g.size} className={styles.guideRow}>
                  <span className={styles.guideSize}>{g.size}</span>
                  {(["chest", "length", "sleeve"] as const).map((k) => (
                    <label key={k} className={styles.field}>
                      <span className={styles.fieldLabel}>{k}</span>
                      <input value={g[k]} onChange={(e) => setGuide(g.size, k, e.target.value)} inputMode="decimal" placeholder={k === "chest" ? "56" : k === "length" ? "70" : "62"} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                    </label>
                  ))}
                </div>
              ))
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Model fit note</span>
              <input value={f.modelFitNote} onChange={(e) => set("modelFitNote", e.target.value)} placeholder="183cm / 74kg wearing size M" className={`${styles.input} ${styles.inputSm}`} />
            </label>
          </div>

          {error && <div className={`${styles.error} ${styles.fieldWide}`} role="alert">{error}</div>}
        </div>

        <div className={styles.modalFoot}>
          <button type="button" onClick={onClose} className={styles.ghostBtn}>Cancel</button>
          <button type="submit" disabled={pending || uploading > 0} className={styles.primaryBtn}>{pending ? "Saving…" : editing ? "Save changes" : "Create product"}</button>
        </div>
      </form>
    </div>
  );
}
