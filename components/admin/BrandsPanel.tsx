"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBrandAction, saveBrandAction } from "@/lib/actions/admin-vocab";
import styles from "./admin.module.css";

interface Brand {
  id: number;
  name: string;
  products: number;
}

export function BrandsPanel({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: number; name: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Có lỗi xảy ra."));
      if (r.ok) onOk?.();
      router.refresh();
    });

  const total = brands.reduce((n, b) => n + b.products, 0);

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.h2}>Hãng</h2>
          <p className={styles.note}>{brands.length} hãng · {total} sản phẩm đang bán</p>
        </div>
        <button type="button" onClick={() => { setForm({ name: "" }); setError(null); }} className={styles.primaryBtn}>Thêm hãng</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.cardGrid}>
        {brands.map((b) => (
          <div key={b.id} className={styles.brandCard}>
            <div className={styles.brandTop}>
              <span className={styles.brandTile}>{b.name.slice(0, 2).toUpperCase()}</span>
              <span className={styles.brandText}>
                <span className={styles.brandName}>{b.name}</span>
                <span className={styles.brandMeta}>{b.products} sản phẩm</span>
              </span>
            </div>
            <div className={styles.btnRow}>
              <button type="button" onClick={() => { setForm({ id: b.id, name: b.name }); setError(null); }} className={styles.smallBtn}>Sửa</button>
              <button
                type="button"
                disabled={pending}
                onClick={() => { if (confirm(`Xoá hãng ${b.name}?`)) run(() => deleteBrandAction(b.id)); }}
                className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
              >
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className={styles.modalBackdrop} onClick={() => setForm(null)}>
          <form
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveBrandAction(form), () => setForm(null));
            }}
          >
            <div className={styles.modalHead}>
              <h2 className={styles.h2}>{form.id ? "Sửa hãng" : "Hãng mới"}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Đóng" className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Tên hãng</span>
                <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Stüssy" className={styles.input} />
              </label>
              {error && <div className={styles.error} role="alert">{error}</div>}
            </div>
            <div className={styles.modalFoot}>
              <button type="button" onClick={() => setForm(null)} className={styles.ghostBtn}>Huỷ</button>
              <button type="submit" disabled={pending} className={styles.primaryBtn}>{pending ? "Đang lưu…" : "Lưu hãng"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
