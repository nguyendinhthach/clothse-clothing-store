"use client";

import type { ReactNode } from "react";
import styles from "./admin.module.css";

interface Props {
  title: string;
  /** What will happen — one line per consequence. */
  risks: ReactNode[];
  /** Optional closing note (e.g. how to undo). */
  note?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Blocking confirmation for destructive admin actions; replaces window.confirm so the risks can be spelled out. */
export function ConfirmDialog({ title, risks, note, confirmLabel, danger, pending, onConfirm, onCancel }: Props) {
  return (
    <div className={styles.modalBackdrop} onClick={onCancel} role="presentation">
      <div className={`${styles.modal} ${styles.confirm}`} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={styles.modalHead}>
          <h2 id="confirm-title" className={styles.h2}>{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Đóng" className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <span className={styles.fieldLabel}>Điều gì sẽ xảy ra</span>
          <ul className={styles.riskList}>
            {risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          {note && <p className={styles.confirmNote}>{note}</p>}
        </div>
        <div className={styles.modalFoot}>
          <button type="button" onClick={onCancel} className={styles.ghostBtn} autoFocus>Không, giữ nguyên</button>
          <button type="button" onClick={onConfirm} disabled={pending} className={`${styles.primaryBtn} ${danger ? styles.dangerBtn : ""}`}>
            {pending ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
