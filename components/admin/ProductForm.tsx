"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteProductAction, discardImageAction, saveProductAction, setProductActiveAction, uploadImageAction, type WarehouseRow } from "@/lib/actions/admin-products";
import { ConfirmDialog } from "./ConfirmDialog";
import { linkableBatchesAction } from "@/lib/actions/admin-storage";
import { categoryLabel } from "@/lib/catalog-constants";
import { formatDate, formatVnd } from "@/lib/format";
import type { ProductFormData, ProductInput } from "@/lib/services/admin/products";
import styles from "./admin.module.css";

export interface FormVocab {
  brands: { id: number; name: string }[];
  categories: { id: number; name: string; sizes: string[]; types: { id: number; code: string; label: string }[] }[];
  tags: string[];
}

interface Props {
  initial: ProductFormData;
  vocab: FormVocab;
  cloudinaryReady: boolean;
  onClose: () => void;
}

const GUIDE_LABEL = { chest: "ngực", length: "dài", sleeve: "tay" } as const;

const DETAIL_HINTS = [
  { label: "Chất liệu", value: "Nỉ bông 480gsm, 100% cotton organic" },
  { label: "Form", value: "Boxy, đúng size" },
  { label: "Sản xuất tại", value: "Portugal" },
  { label: "Bảo quản", value: "Giặt lạnh, phơi phẳng" },
];

export function ProductForm({ initial, vocab, cloudinaryReady, onClose }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"off" | "delete" | null>(null);
  const [f, setF] = useState<ProductFormData>(() => ({ ...initial, details: initial.details.length ? initial.details : [{ label: "", value: "" }] }));
  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setF((s) => ({ ...s, [k]: v }));

  const editing = !!f.id;
  const category = vocab.categories.find((c) => c.id === f.categoryId) ?? vocab.categories[0];
  const categoryLocked = editing && f.lockedSizes.length > 0;

  // ── warehouse (SPEC §6.5 step 3) ──
  type SrcRow = { size: string; batchId: string; qty: string };
  type Option = { id: number; label: string; qtyRemaining: number };
  const [srcRows, setSrcRows] = useState<SrcRow[]>([]);
  const [options, setOptions] = useState<Record<string, Option[]>>({}); // size → linkable batches
  const [restock, setRestock] = useState<Record<string, string>>({}); // size → qty to pull (edit mode)
  // Options depend on brand + category; when they change, drop the cache and the picked batches.
  const optKey = `${f.brandId}|${f.categoryId}`;
  const [seenKey, setSeenKey] = useState(optKey);
  if (seenKey !== optKey) {
    setSeenKey(optKey);
    setOptions({});
    setSrcRows((rows) => rows.map((r) => ({ ...r, batchId: "" })));
  }
  async function loadOptions(size: string) {
    if (!f.brandId || options[size]) return;
    const rows = await linkableBatchesAction({ brandId: f.brandId, categoryId: f.categoryId, sizeLabel: size });
    setOptions((o) => ({
      ...o,
      [size]: rows.map((b) => ({
        id: b.id,
        qtyRemaining: b.qtyRemaining,
        label: `${b.itemDescription ?? "Lô"} · ${formatDate(new Date(b.receivedAt), { day: "2-digit", month: "2-digit" })} · còn ${b.qtyRemaining} @ ${formatVnd(b.unitCost)}`,
      })),
    }));
  }
  const srcSummary = srcRows.filter((r) => r.batchId && Number(r.qty) > 0);

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
    setF((s) => ({ ...s, categoryId: id, sizes: [], sizeGuide: [], typeId: undefined }));
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
  // Rows follow the category's size order (sortOrder), not the order the chips were clicked.
  const orderedSizes = category.sizes.filter((size) => f.sizes.includes(size));
  const guideRows = orderedSizes.map((size) => f.sizeGuide.find((g) => g.size === size) ?? { size, chest: "", length: "", sleeve: "" });
  const setGuide = (size: string, key: "chest" | "length" | "sleeve", v: string) => set("sizeGuide", guideRows.map((g) => (g.size === size ? { ...g, [key]: v } : g)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: ProductInput = { ...f, price: f.price === "" ? "" : Number(f.price), salePrice: f.salePrice === "" ? "" : Number(f.salePrice) };
    const warehouse: WarehouseRow[] = editing
      ? Object.entries(restock).filter(([, q]) => Number(q) > 0).map(([size, q]) => ({ size, qty: Number(q) }))
      : srcRows.filter((r) => r.size && r.batchId && Number(r.qty) > 0).map((r) => ({ size: r.size, batchId: Number(r.batchId), qty: Number(r.qty) }));
    start(async () => {
      const r = await saveProductAction(input, warehouse);
      if (!r.ok) { setError(r.error); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <form className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHead}>
          <h2 className={styles.h2}>{editing ? `Sửa · ${f.sku}` : "Thêm sản phẩm"}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Tên sản phẩm</span>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Panel Work Jacket" required className={styles.input} />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Hãng</span>
            <select value={f.brandId ?? ""} onChange={(e) => set("brandId", Number(e.target.value) || null)} required className={styles.input}>
              <option value="">Chọn hãng…</option>
              {vocab.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Danh mục</span>
            <select value={f.categoryId} disabled={categoryLocked} onChange={(e) => changeCategory(Number(e.target.value))} className={styles.input}>
              {vocab.categories.map((c) => <option key={c.id} value={c.id}>{categoryLabel(c.name)}</option>)}
            </select>
            {categoryLocked && <span className={styles.hint}>Đã khoá — size đã có tồn, lô nhập hoặc đơn hàng.</span>}
          </label>

          {!editing && (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Loại món (tạo SKU)</span>
              <select value={f.typeId ?? ""} onChange={(e) => set("typeId", e.target.value ? Number(e.target.value) : undefined)} required className={styles.input}>
                <option value="">Chọn…</option>
                {category.types.map((t) => <option key={t.id} value={t.id}>{t.label} · CSE-{t.code}-…</option>)}
              </select>
              <span className={styles.hint}>SKU sinh tự động khi lưu, ví dụ CSE-HDY-007. Thiếu loại thì thêm ở tab Loại món.</span>
            </label>
          )}

          {!editing && (
            <div className={`${styles.fieldWide} ${styles.subBox}`}>
              <span className={styles.fieldLabel}>Lấy từ kho · mỗi dòng một size</span>
              <span className={styles.hint}>
                {f.brandId
                  ? `Lô chưa gắn của ${vocab.brands.find((b) => b.id === f.brandId)?.name} trong ${categoryLabel(category.name)}. Mỗi lô chỉ một size, nên một dòng gắn một lô với một size sản phẩm.`
                  : "Chọn hãng trước để xem hàng đang chờ trong kho."}
              </span>
              {srcRows.map((r, i) => {
                const opts = options[r.size] ?? [];
                const chosen = opts.find((o) => String(o.id) === r.batchId);
                return (
                  <div key={i} className={styles.srcRow}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Size</span>
                      <select value={r.size} onChange={(e) => { const size = e.target.value; setSrcRows((rows) => rows.map((x, k) => (k === i ? { size, batchId: "", qty: "" } : x))); if (size) void loadOptions(size); }} className={`${styles.input} ${styles.inputSm}`}>
                        <option value="">Size…</option>
                        {category.sizes.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Lô nguồn</span>
                      <select value={r.batchId} disabled={!r.size} onChange={(e) => setSrcRows((rows) => rows.map((x, k) => (k === i ? { ...x, batchId: e.target.value, qty: opts.find((o) => String(o.id) === e.target.value)?.qtyRemaining.toString() ?? "" } : x)))} className={`${styles.input} ${styles.inputSm}`}>
                        <option value="">{!r.size ? "Chọn size trước" : opts.length ? "Chọn lô…" : "Size này không có hàng chưa gắn"}</option>
                        {opts.filter((o) => !srcRows.some((x, k) => k !== i && x.batchId === String(o.id))).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>SL lên kệ</span>
                      <input value={r.qty} disabled={!r.batchId} onChange={(e) => setSrcRows((rows) => rows.map((x, k) => (k === i ? { ...x, qty: e.target.value.replace(/\D/g, "") } : x)))} inputMode="numeric" placeholder="0" className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                    </label>
                    <button type="button" onClick={() => setSrcRows((rows) => rows.filter((_, k) => k !== i))} aria-label="Bỏ dòng" className={styles.closeBtn}>✕</button>
                    {chosen && Number(r.qty) > chosen.qtyRemaining && <span className={`${styles.hint} ${styles.saleOn}`} style={{ gridColumn: "1 / -1" }}>Lô đó chỉ còn {chosen.qtyRemaining}.</span>}
                  </div>
                );
              })}
              <button type="button" disabled={!f.brandId} onClick={() => setSrcRows((rows) => [...rows, { size: "", batchId: "", qty: "" }])} className={styles.linkBtn}>+ Thêm một size từ kho</button>
              {srcSummary.length > 0 && <span className={styles.hintBox}>{srcSummary.reduce((n, r) => n + Number(r.qty), 0)} món ở {srcSummary.length} size sẽ lên kệ khi lưu</span>}
            </div>
          )}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Giá (VNĐ)</span>
            <input value={f.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, "") === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="1860000" required className={`${styles.input} ${styles.mono}`} />
          </label>

          <div className={`${styles.fieldWide} ${styles.sizeBox}`}>
            <span className={styles.fieldLabel}>Size bán · {categoryLabel(category.name)}</span>
            <div className={styles.sizeChips}>
              {category.sizes.map((label) => {
                const on = f.sizes.includes(label);
                const locked = on && f.lockedSizes.includes(label);
                return (
                  <button key={label} type="button" onClick={() => toggleSize(label)} aria-pressed={on} title={locked ? "Đã có tồn, lô nhập hoặc đơn" : undefined} className={`${styles.sizeChip} ${on ? styles.sizeChipOn : ""} ${locked ? styles.sizeChipLocked : ""}`}>
                    {label}
                  </button>
                );
              })}
            </div>
            <span className={styles.hint}>Mỗi size bắt đầu với tồn 0; hàng về qua lô nhập ở mục Kho.</span>
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Tag</span>
            <div className={styles.tagWrap}>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onFocus={() => setTagFocus(true)}
                onBlur={() => setTimeout(() => setTagFocus(false), 120)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); } if (e.key === "Backspace" && !tagDraft && f.tags.length) set("tags", f.tags.slice(0, -1)); }}
                placeholder="Gõ tag, nhấn Enter…"
                className={styles.input}
              />
              {tagFocus && suggestions.length > 0 && (
                <div role="listbox" className={styles.tagList}>
                  {suggestions.map((s) => (
                    <button key={s} type="button" role="option" aria-selected={false} onMouseDown={() => addTag(s)} className={styles.tagOption}>
                      <span>{s}</span><span className={styles.muted}>đã có</span>
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
                    <button type="button" onClick={() => set("tags", f.tags.filter((x) => x !== t))} aria-label={`Bỏ tag ${t}`} className={styles.tagX}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <span className={styles.hint}>Men / Women / Unisex và nhãn mô tả. New, Sale, Best seller, Restocked được tính tự động — đừng thêm tay.</span>
          </div>

          {editing && (
            <div className={`${styles.fieldWide} ${styles.subBox}`}>
              <span className={styles.fieldLabel}>Lên kệ từ kho · theo size</span>
              {f.sizes.length === 0 ? (
                <span className={styles.hintBox}>Sản phẩm chưa có size nào</span>
              ) : (
                orderedSizes.map((size) => {
                  const avail = f.warehouse?.[size] ?? 0;
                  const shelf = f.shelf?.[size] ?? 0;
                  const q = Number(restock[size] ?? 0);
                  return (
                    <div key={size} className={styles.restockRow}>
                      <span className={styles.restockSize}>
                        <span className={styles.guideSize}>{size}</span>
                        <span className={styles.hint}>
                          Trên kệ: <strong>{shelf}</strong> · Kho chưa gắn: <strong>{avail}</strong>{avail === 0 && " — muốn lên thêm thì nhập kho trước"}
                        </span>
                      </span>
                      <label className={styles.field}>
                        <span className={styles.fieldLabel}>Lên kệ</span>
                        <input value={restock[size] ?? ""} disabled={avail === 0} onChange={(e) => setRestock((r) => ({ ...r, [size]: e.target.value.replace(/\D/g, "") }))} inputMode="numeric" placeholder={avail > 0 ? `tối đa ${avail}` : "0"} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                      </label>
                      {q > avail && <span className={`${styles.hint} ${styles.saleOn}`} style={{ gridColumn: "1 / -1" }}>Chỉ còn {avail}.</span>}
                    </div>
                  );
                })
              )}
              <span className={styles.hint}>Lấy lô cũ trước (FIFO). Hàng chuyển từ kho lên sản phẩm này khi lưu.</span>
            </div>
          )}

          <div className={`${styles.fieldWide} ${styles.saleBox}`}>
            <button type="button" role="switch" aria-checked={f.onSale} onClick={() => set("onSale", !f.onSale)} className={`${styles.switch} ${f.onSale ? styles.switchOn : ""}`}>
              <span className={styles.switchTrack}><span className={styles.switchKnob} /></span>
              Đang sale
            </button>
            {f.onSale && (
              <label className={styles.inlineField}>
                <span className={styles.fieldLabel}>Giá sale</span>
                <input value={f.salePrice} onChange={(e) => set("salePrice", e.target.value.replace(/\D/g, "") === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} inputMode="numeric" placeholder="1490000" className={`${styles.input} ${styles.mono}`} style={{ width: 160, height: 44 }} />
              </label>
            )}
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Ảnh</span>
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
                  <span className={styles.imageGrip} title="Kéo để xếp lại">⋮⋮</span>
                  <button type="button" onClick={() => removeImage(i)} aria-label="Bỏ ảnh" className={styles.imageX}>✕</button>
                  {i === 0 && <span className={styles.coverTag}>Bìa</span>}
                  <span className={styles.imageNum}>{String(i + 1).padStart(2, "0")}</span>
                </div>
              ))}
              <button type="button" disabled={!cloudinaryReady || uploading > 0} onClick={() => fileInput.current?.click()} className={styles.imageAdd}>
                <span>{uploading > 0 ? "…" : "+"}</span>
                <span>{uploading > 0 ? `Đang tải ${uploading}` : "Thêm"}</span>
              </button>
              <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </div>
            <span className={styles.hint}>{cloudinaryReady ? "Kéo để xếp lại — ảnh đầu là ảnh bìa · JPG, PNG hoặc WebP · tối đa 4 MB" : "Tải ảnh cần CLOUDINARY_* trong .env — không có ảnh vẫn lưu được sản phẩm."}</span>
          </div>

          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Mô tả</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Chất liệu, form, cách bảo quản…" className={`${styles.input} ${styles.textarea}`} />
          </label>

          <div className={`${styles.fieldWide} ${styles.subBox}`}>
            <span className={styles.fieldLabel}>Chi tiết sản phẩm</span>
            {f.details.map((d, i) => (
              <div key={i} className={styles.detailRow}>
                <input value={d.label} onChange={(e) => set("details", f.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder={DETAIL_HINTS[i % DETAIL_HINTS.length].label} className={`${styles.input} ${styles.inputSm}`} />
                <input value={d.value} onChange={(e) => set("details", f.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder={DETAIL_HINTS[i % DETAIL_HINTS.length].value} className={`${styles.input} ${styles.inputSm}`} />
                <button type="button" disabled={f.details.length === 1} onClick={() => set("details", f.details.filter((_, k) => k !== i))} aria-label="Bỏ dòng" className={styles.closeBtn}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => set("details", [...f.details, { label: "", value: "" }])} className={styles.linkBtn}>+ Thêm dòng</button>
            <span className={styles.hint}>Hiện trong mục “Chi tiết sản phẩm” ở trang sản phẩm.</span>
          </div>

          <div className={`${styles.fieldWide} ${styles.subBox}`}>
            <span className={styles.fieldLabel}>Hướng dẫn size · số đo cm</span>
            {guideRows.length === 0 ? (
              <span className={styles.hintBox}>Chọn size bán trước — mỗi size sẽ có một dòng ở đây.</span>
            ) : (
              guideRows.map((g) => (
                <div key={g.size} className={styles.guideRow}>
                  <span className={styles.guideSize}>{g.size}</span>
                  {(["chest", "length", "sleeve"] as const).map((k) => (
                    <label key={k} className={styles.field}>
                      <span className={styles.fieldLabel}>{GUIDE_LABEL[k]}</span>
                      <input value={g[k]} onChange={(e) => setGuide(g.size, k, e.target.value)} inputMode="decimal" placeholder={k === "chest" ? "56" : k === "length" ? "70" : "62"} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} />
                    </label>
                  ))}
                </div>
              ))
            )}
          </div>

          {editing && (
            <div className={`${styles.fieldWide} ${styles.dangerZone}`}>
              <span className={styles.fieldLabel}>Vùng nguy hiểm</span>
              <div className={styles.dangerRow}>
                <p>
                  {initial.active === false
                    ? "Đang ngừng bán — khách không thấy món này. Lên kệ lại để bán tiếp."
                    : "Gỡ khỏi kệ để ngừng bán mà vẫn giữ tồn, lô nhập và lịch sử đơn. Đảo ngược được."}
                </p>
                {initial.active === false ? (
                  <button type="button" disabled={pending} onClick={() => start(async () => { const r = await setProductActiveAction(initial.id!, true); if (!r.ok) { setError(r.error); return; } onClose(); router.refresh(); })} className={styles.smallBtn}>Lên kệ lại</button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => setConfirm("off")} className={`${styles.smallBtn} ${styles.smallBtnDanger}`}>Gỡ khỏi kệ</button>
                )}
              </div>
              <div className={styles.dangerRow}>
                <p>
                  {initial.deleteBlock
                    ? `Không xoá được — sản phẩm ${initial.deleteBlock}. Chỉ món chưa từng bán và chưa gắn lô mới xoá được.`
                    : "Xoá hẳn khỏi hệ thống: mất ảnh, mô tả, bảng size và lượt yêu thích. Không hoàn tác được."}
                </p>
                <button type="button" disabled={pending || !!initial.deleteBlock} onClick={() => setConfirm("delete")} className={`${styles.smallBtn} ${styles.smallBtnDanger}`}>Xoá sản phẩm</button>
              </div>
            </div>
          )}

          {error && <div className={`${styles.error} ${styles.fieldWide}`} role="alert">{error}</div>}
        </div>

        <div className={styles.modalFoot}>
          <button type="button" onClick={onClose} className={styles.ghostBtn}>Huỷ</button>
          <button type="submit" disabled={pending || uploading > 0} className={styles.primaryBtn}>{pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>
        </div>
      </form>

      {confirm === "off" && (
        <ConfirmDialog
          title={`Gỡ “${f.name}” khỏi kệ?`}
          risks={[
            "Khách không còn thấy món này ở Cửa hàng, Hàng mới, Sale, tìm kiếm và trang chủ.",
            "Link sản phẩm cũ trả về “không tìm thấy”; ai đang có nó trong giỏ sẽ phải bỏ ra mới thanh toán được.",
            "Người đã lưu Yêu thích vẫn thấy, nhưng hiện “Ngừng bán” và không nhận email báo hàng.",
            "Tồn, lô nhập và lịch sử đơn giữ nguyên — không mất số liệu. Thay đổi chưa lưu trong form này sẽ bị bỏ.",
          ]}
          note="Đảo ngược được bất cứ lúc nào bằng “Lên kệ lại”."
          confirmLabel="Gỡ khỏi kệ"
          danger
          pending={pending}
          onConfirm={() => start(async () => { const r = await setProductActiveAction(initial.id!, false); setConfirm(null); if (!r.ok) { setError(r.error); return; } onClose(); router.refresh(); })}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title={`Xoá hẳn “${f.name}”?`}
          risks={[
            "Mất toàn bộ: ảnh, mô tả, chi tiết, bảng size, tag và mọi biến thể size.",
            "Khách đã lưu Yêu thích hoặc đang có món này trong giỏ sẽ thấy nó biến mất không báo trước.",
            <>SKU <strong>{f.sku}</strong> không được cấp lại — số thứ tự chỉ tăng.</>,
            "Không có hoàn tác. Nếu chỉ muốn ngừng bán, dùng “Gỡ khỏi kệ” thay vì xoá.",
          ]}
          confirmLabel="Xoá vĩnh viễn"
          danger
          pending={pending}
          onConfirm={() => start(async () => { const r = await deleteProductAction(initial.id!); setConfirm(null); if (!r.ok) { setError(r.error); return; } onClose(); router.refresh(); })}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
