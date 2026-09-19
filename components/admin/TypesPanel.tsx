"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteItemTypeAction, saveItemTypeAction } from "@/lib/actions/admin-vocab";
import { categoryLabel } from "@/lib/catalog-constants";
import styles from "./admin.module.css";

interface ItemType {
  id: number;
  code: string;
  label: string;
  products: number;
}
interface Group {
  id: number;
  name: string;
  types: ItemType[];
}

/** Client-side twin of suggestTypeCode() — the server re-validates. */
const suggestCode = (label: string) =>
  label.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);

export function TypesPanel({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const total = groups.reduce((n, g) => n + g.types.length, 0);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Có lỗi xảy ra."));
      if (r.ok) onOk?.();
      router.refresh();
    });

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.h2}>Loại món</h2>
          <p className={styles.note}>{total} loại trong {groups.length} danh mục</p>
        </div>
        <p className={styles.panelHint}>Mã 3 chữ của loại nằm trong SKU của sản phẩm (CSE-HDY-007). Thêm loại mới là chọn được ngay khi tạo sản phẩm; loại đã có sản phẩm chỉ đổi được tên.</p>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.sizeGrid}>
        {groups.map((g) => (
          <TypeGroup key={g.id} group={g} pending={pending} run={run} />
        ))}
      </div>
    </div>
  );
}

function TypeGroup({ group: g, pending, run }: { group: Group; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);

  function reset() {
    setAdding(false);
    setLabel("");
    setCode("");
    setCodeTouched(false);
  }
  function submitAdd() {
    if (!label.trim() || !code.trim()) return;
    run(() => saveItemTypeAction({ categoryId: g.id, code, label }), reset);
  }

  return (
    <div className={styles.sizeCard}>
      <div className={styles.sizeCardHead}>
        <span className={styles.brandName}>{categoryLabel(g.name)}</span>
        <span className={styles.brandMeta}>{g.types.length} loại</span>
      </div>
      <div>
        {g.types.map((t) => {
          const frozen = t.products > 0;
          return (
            <div key={t.id} className={styles.sizeRow}>
              <span className={styles.ord} style={{ width: 34, fontSize: 11, color: "var(--ink)" }} title={frozen ? "Mã đã nằm trong SKU — không đổi được" : undefined}>{t.code}</span>
              <input
                defaultValue={t.label}
                aria-label="Tên loại"
                className={styles.sizeInput}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.label) run(() => saveItemTypeAction({ id: t.id, categoryId: g.id, code: t.code, label: v })); else e.target.value = t.label; }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
              <span className={styles.sizeUse} title="Sản phẩm đang dùng loại này">{t.products > 0 ? `${t.products} sp` : ""}</span>
              <button
                type="button"
                disabled={pending || frozen}
                title={frozen ? "Còn sản phẩm dùng mã này" : undefined}
                onClick={() => { if (confirm(`Xoá loại ${t.label} (${t.code})?`)) run(() => deleteItemTypeAction(t.id)); }}
                className={`${styles.togglePill} ${frozen ? "" : styles.smallBtnDanger}`}
              >
                Xoá
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.sizeCardFoot}>
        {adding ? (
          <div className={styles.addRow}>
            <input
              autoFocus
              value={label}
              onChange={(e) => { setLabel(e.target.value); if (!codeTouched) setCode(suggestCode(e.target.value)); }}
              onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); if (e.key === "Escape") reset(); }}
              placeholder="Tên loại, vd. Váy"
              aria-label="Tên loại mới"
              className={styles.input}
            />
            <input
              value={code}
              onChange={(e) => { setCodeTouched(true); setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3)); }}
              onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); if (e.key === "Escape") reset(); }}
              placeholder="Mã"
              aria-label="Mã 3 chữ"
              className={`${styles.input} ${styles.mono}`}
              style={{ flex: "0 0 72px", textAlign: "center" }}
            />
            <button type="button" onClick={submitAdd} disabled={pending || !label.trim() || code.length !== 3} className={styles.primaryBtn}>Thêm</button>
            <button type="button" onClick={reset} aria-label="Huỷ" className={styles.closeBtn}>✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={styles.smallBtn}>+ Thêm loại</button>
        )}
      </div>
    </div>
  );
}
