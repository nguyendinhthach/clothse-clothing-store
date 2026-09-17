"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sizeHistoryAction } from "@/lib/actions/admin-storage";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { BatchRow, StorageFilters } from "@/lib/services/admin/storage";
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

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const monthLabel = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

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
          <span className={styles.statLabel}>Unlisted stock value</span>
          <span className={styles.statValue}>{formatVnd(stats.unlistedValue)}</span>
          <span className={styles.statNote}>{stats.unlistedUnits} units awaiting listing</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Batches this month</span>
          <span className={styles.statValue}>{stats.thisMonth}</span>
          <span className={styles.statNote}>{monthLabel(new Date())}</span>
        </div>
        <div className={`${styles.stat} ${styles.statAccent}`}>
          <span className={styles.statLabel}>Awaiting listing</span>
          <span className={styles.statValue}>{stats.awaiting}</span>
          <span className={styles.statNote}>Batches with stock left</span>
        </div>
      </div>

      <div className={styles.panelHead}>
        <div>
          <h2 className={styles.h2}>Stock intake</h2>
          <p className={styles.note}>{stats.total} intake batches · {stats.unlistedUnits} units in warehouse not yet listed</p>
        </div>
        <div className={styles.filterRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Brand</span>
            <select value={filters.brand ?? ""} onChange={(e) => go({ brand: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">All brands</option>
              {vocab.brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <select value={filters.status ?? ""} onChange={(e) => go({ status: (e.target.value || undefined) as StorageFilters["status"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">All batches</option>
              <option value="unlinked">Unlinked</option>
              <option value="linked">Linked</option>
            </select>
          </label>
          <button type="button" onClick={() => setIntake(true)} className={styles.primaryBtn} style={{ height: 44 }}>Receive stock</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Item</th>
                <th>Received</th>
                <th className={styles.right}>Qty in</th>
                <th className={styles.right}>Remaining</th>
                <th className={styles.right}>Unit cost</th>
                <th>Status</th>
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
                      <span className={`${styles.prodSku} ${b.linked ? "" : styles.saleOn}`}>{b.linked ? `Linked product · ${b.size}` : `Unlinked · ${b.category} · ${b.size}`}</span>
                    </span>
                  </td>
                  <td className={styles.cellNum} style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{fmtDate(b.receivedAt)}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{b.qtyReceived}</td>
                  <td className={`${styles.right} ${styles.cellNum} ${b.qtyRemaining === 0 ? styles.muted : ""}`}>{b.qtyRemaining}</td>
                  <td className={`${styles.right} ${styles.cellNum}`} style={{ whiteSpace: "nowrap" }}>{formatVnd(b.unitCost)}</td>
                  <td>
                    <span className={`${styles.pill} ${b.status === "Linked" ? styles.pillMuted : b.status === "Fully listed" ? styles.pillAccent : b.status === "Partially listed" ? "" : styles.pillOutline}`}>{b.status}</span>
                  </td>
                  <td className={styles.right}>
                    {b.variantId && (
                      <button type="button" disabled={pending} onClick={() => openHistory(b.variantId!)} className={styles.smallBtn}>View history</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className={styles.tableEmpty}>
            <span className={styles.brandName}>No batches match</span>
            <button type="button" onClick={() => router.replace(routes.adminStorage)} className={styles.smallBtn}>Clear filters</button>
          </div>
        )}
        <div className={styles.tableFoot}>
          <span>{stats.awaiting} batches awaiting listing</span>
          <span>FIFO · oldest batch sells first</span>
        </div>
      </div>

      {intake && <IntakeForm vocab={vocab} onClose={() => setIntake(false)} />}

      {history && (
        <div className={styles.drawerBackdrop} onClick={() => setHistory(null)}>
          <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <div>
                <span className={styles.kickerSm}>Intake history · {history.rows.length} {history.rows.length === 1 ? "batch" : "batches"}</span>
                <h2 className={styles.h2} style={{ marginTop: 7 }}>{history.product} — {history.size === "One size" ? "One size" : `Size ${history.size}`}</h2>
              </div>
              <button type="button" onClick={() => setHistory(null)} aria-label="Close" className={styles.closeBtn}>✕</button>
            </div>
            <div className={styles.drawerSummary}>
              In stock: {history.stock} · Average cost {formatVnd(history.avgCost)} · Lowest {formatVnd(history.minCost)} · Highest {formatVnd(history.maxCost)}
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table} style={{ minWidth: 480 }}>
                <thead>
                  <tr><th>Received</th><th className={styles.right}>Qty</th><th className={styles.right}>Left</th><th className={styles.right}>Unit cost</th><th>Source</th></tr>
                </thead>
                <tbody>
                  {history.rows.map((h) => (
                    <tr key={h.id}>
                      <td className={styles.cellNum} style={{ whiteSpace: "nowrap" }}>{fmtDate(h.receivedAt)}</td>
                      <td className={`${styles.right} ${styles.cellNum}`}>{h.qtyReceived} pcs</td>
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
