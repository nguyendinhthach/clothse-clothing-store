"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sizeHistoryAction } from "@/lib/actions/admin-storage";
import { categoryLabel } from "@/lib/catalog-constants";
import { formatDate, formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { BatchRow, BatchStatus, StorageFilters } from "@/lib/services/admin/storage";
import { IntakeForm, type IntakeVocab } from "./IntakeForm";
import styles from "./admin.module.css";

interface Stats {
  unlistedUnits: number;
  unlistedValue: number;
  awaiting: number;
  thisMonth: number;
  total: number;
}
type History = NonNullable<Awaited<ReturnType<typeof sizeHistoryAction>>>;

interface Props {
  rows: BatchRow[];
  stats: Stats;
  filters: StorageFilters;
  vocab: IntakeVocab;
}

// Status keys stay English (compared below); only the chip text is Vietnamese.
const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  "Not listed yet": "Chưa lên kệ",
  "Partially listed": "Lên kệ một phần",
  "Fully listed": "Đã lên kệ hết",
  Linked: "Đã gắn sản phẩm",
};

const fmtDate = (d: Date) => formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric" });
const monthLabel = (d: Date) => `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;

export function StoragePanel({ rows, stats, filters, vocab }: Props) {
  const router = useRouter();
  const [intake, setIntake] = useState(false);
  const [history, setHistory] = useState<History | null>(null);
  const [pending, start] = useTransition();

  const go = (patch: Partial<StorageFilters>) => {
    const f = { ...filters, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) sp.set(k, String(v));
    const q = sp.toString();
    router.replace(routes.adminStorage + (q ? `?${q}` : ""), { scroll: false });
  };
  const openHistory = (variantId: number) => start(async () => setHistory(await sizeHistoryAction(variantId)));

  return (
    <div className={styles.stack}>
      <div className={styles.statGrid}>
        <div className={`${styles.stat} ${styles.statDark}`}>
          <span className={styles.statLabel}>Giá trị hàng chưa lên kệ</span>
          <span className={styles.statValue}>{formatVnd(stats.unlistedValue)}</span>
          <span className={styles.statNote}>{stats.unlistedUnits} món chờ lên kệ</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Lô nhập tháng này</span>
          <span className={styles.statValue}>{stats.thisMonth}</span>
          <span className={styles.statNote}>{monthLabel(new Date())}</span>
        </div>
        <div className={`${styles.stat} ${styles.statAccent}`}>
          <span className={styles.statLabel}>Chờ lên kệ</span>
          <span className={styles.statValue}>{stats.awaiting}</span>
          <span className={styles.statNote}>Lô còn hàng trong kho</span>
        </div>
      </div>

      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.h2}>Nhập kho</h2>
          <p className={styles.note}>{stats.total} lô đã nhập · {stats.unlistedUnits} món trong kho chưa lên kệ</p>
        </div>
        <div className={styles.filterRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Hãng</span>
            <select value={filters.brand ?? ""} onChange={(e) => go({ brand: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">Mọi hãng</option>
              {vocab.brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Trạng thái</span>
            <select value={filters.status ?? ""} onChange={(e) => go({ status: (e.target.value || undefined) as StorageFilters["status"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">Mọi lô</option>
              <option value="unlinked">Chưa gắn sản phẩm</option>
              <option value="linked">Đã gắn sản phẩm</option>
            </select>
          </label>
          <button type="button" onClick={() => setIntake(true)} className={styles.primaryBtn} style={{ height: 44 }}>Nhập kho</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hãng</th>
                <th>Món hàng</th>
                <th>Ngày nhận</th>
                <th className={styles.right}>Nhập</th>
                <th className={styles.right}>Còn lại</th>
                <th className={styles.right}>Giá vốn</th>
                <th>Trạng thái</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>{b.brand}</td>
                  <td>
                    <span className={styles.prodText}>
                      <span className={styles.prodName}>{b.item}</span>
                      <span className={`${styles.prodSku} ${b.linked ? "" : styles.saleOn}`}>{b.linked ? `Đã gắn sản phẩm · ${b.size}` : `Chưa gắn · ${categoryLabel(b.category)} · ${b.size}`}</span>
                    </span>
                  </td>
                  <td className={styles.cellNum} style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{fmtDate(b.receivedAt)}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{b.qtyReceived}</td>
                  <td className={`${styles.right} ${styles.cellNum} ${b.qtyRemaining === 0 ? styles.muted : ""}`}>{b.qtyRemaining}</td>
                  <td className={`${styles.right} ${styles.cellNum}`} style={{ whiteSpace: "nowrap" }}>{formatVnd(b.unitCost)}</td>
                  <td>
                    <span className={`${styles.pill} ${b.status === "Linked" ? styles.pillMuted : b.status === "Fully listed" ? styles.pillAccent : b.status === "Partially listed" ? "" : styles.pillOutline}`}>{BATCH_STATUS_LABEL[b.status]}</span>
                  </td>
                  <td className={styles.right}>
                    {b.variantId && (
                      <button type="button" disabled={pending} onClick={() => openHistory(b.variantId!)} className={styles.smallBtn}>Lịch sử</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className={styles.tableEmpty}>
            <span className={styles.brandName}>Không có lô nào khớp</span>
            <button type="button" onClick={() => router.replace(routes.adminStorage)} className={styles.smallBtn}>Xoá bộ lọc</button>
          </div>
        )}
        <div className={styles.tableFoot}>
          <span>{stats.awaiting} lô chờ lên kệ</span>
          <span>FIFO · lô cũ bán trước</span>
        </div>
      </div>

      {intake && <IntakeForm vocab={vocab} onClose={() => setIntake(false)} />}

      {history && (
        <div className={styles.drawerBackdrop} onClick={() => setHistory(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <div>
                <span className={styles.kickerSm}>Lịch sử nhập · {history.rows.length} lô</span>
                <h2 className={styles.h2} style={{ marginTop: 7 }}>{history.product} — {history.size === "One size" ? "Một size" : `Size ${history.size}`}</h2>
              </div>
              <button type="button" onClick={() => setHistory(null)} aria-label="Đóng" className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.drawerSummary}>
              Trên kệ: {history.stock} · Giá vốn TB {formatVnd(history.avgCost)} · Thấp nhất {formatVnd(history.minCost)} · Cao nhất {formatVnd(history.maxCost)}
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table} style={{ minWidth: 480 }}>
                <thead>
                  <tr><th>Ngày nhận</th><th className={styles.right}>SL</th><th className={styles.right}>Còn</th><th className={styles.right}>Giá vốn</th><th>Nguồn</th></tr>
                </thead>
                <tbody>
                  {history.rows.map((h) => (
                    <tr key={h.id}>
                      <td className={styles.cellNum} style={{ whiteSpace: "nowrap" }}>{fmtDate(h.receivedAt)}</td>
                      <td className={`${styles.right} ${styles.cellNum}`}>{h.qtyReceived}</td>
                      <td className={`${styles.right} ${styles.cellNum} ${h.qtyRemaining === 0 ? styles.muted : ""}`}>{h.qtyRemaining}</td>
                      <td className={styles.right}>
                        <span className={styles.costCell}>
                          <span className={styles.cellNum}>{formatVnd(h.unitCost)}</span>
                          {h.delta !== null && (
                            <span className={`${styles.delta} ${h.delta > 0 ? styles.deltaUp : h.delta < 0 ? styles.deltaDown : ""}`}>
                              {h.delta > 0 ? "▲ +" : h.delta < 0 ? "▼ −" : "= "}{formatVnd(Math.abs(h.delta))}
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{h.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
