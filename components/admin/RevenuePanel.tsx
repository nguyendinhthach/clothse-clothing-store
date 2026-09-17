"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { RangeKey, RevenueData } from "@/lib/services/admin/analytics";
import styles from "./admin.module.css";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom range" },
];

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function RevenuePanel({ data, custom }: { data: RevenueData; custom: { from: string; to: string } }) {
  const router = useRouter();
  const [picker, setPicker] = useState(false);
  const [from, setFrom] = useState(custom.from);
  const [to, setTo] = useState(custom.to);
  const r = data.range;
  const t = data.totals;
  const vsPrior = data.prior.revenue > 0 ? `${t.revenue >= data.prior.revenue ? "+" : ""}${Math.round(((t.revenue - data.prior.revenue) / data.prior.revenue) * 100)}% vs prior period` : "no sales in the prior period";

  const peak = Math.max(0, ...data.series.buckets.map((b) => b.revenue));
  const n = data.series.buckets.length;
  const profitPoints = data.series.buckets.map((b, i) => `${(((i + 0.5) / n) * 100).toFixed(2)},${(100 - (peak ? (b.profit / peak) * 100 : 0)).toFixed(2)}`).join(" ");
  const maxBrand = data.byBrand[0]?.revenue ?? 0;
  const maxCat = data.byCategory[0]?.revenue ?? 0;

  return (
    <div className={styles.stack} style={{ gap: 16 }}>
      <div className={styles.rangeBar}>
        <div className={styles.rangePills}>
          {RANGES.map((x) => (
            <Link
              key={x.key}
              href={x.key === "custom" ? "#" : `${routes.adminRevenue}?range=${x.key}`}
              onClick={x.key === "custom" ? (e) => { e.preventDefault(); setPicker((v) => !v); } : undefined}
              className={`${styles.roundPill} ${r.key === x.key ? styles.roundPillOn : ""}`}
            >
              {x.key === "custom" && r.key === "custom" ? `Custom · ${r.label}` : x.label}{x.key === "custom" ? (picker ? " ▲" : " ▼") : ""}
            </Link>
          ))}
          {picker && (
            <div className={styles.picker}>
              <div className={styles.lineTop}>
                <span className={styles.fieldLabel}>Custom range</span>
                <button type="button" onClick={() => setPicker(false)} aria-label="Close" className={styles.closeBtn} style={{ width: 28, height: 28 }}>✕</button>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}><span className={styles.fieldLabel}>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} /></label>
              </div>
              <div className={styles.modalFoot} style={{ padding: "12px 0 0", background: "transparent" }}>
                <button type="button" onClick={() => setPicker(false)} className={styles.ghostBtn}>Cancel</button>
                <button type="button" disabled={!from || !to} onClick={() => { setPicker(false); router.push(`${routes.adminRevenue}?range=custom&from=${from}&to=${to}`); }} className={styles.primaryBtn}>Apply</button>
              </div>
            </div>
          )}
        </div>
        <span className={styles.kickerSm}>{r.label}</span>
      </div>

      <div className={styles.statGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className={`${styles.stat} ${styles.statDark}`}><span className={styles.statLabel}>Total revenue</span><span className={styles.statValue}>{formatVnd(t.revenue)}</span><span className={styles.statNote}>{vsPrior}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Completed orders</span><span className={styles.statValue}>{t.orders}</span><span className={styles.statNote}>{t.units} units · paid & delivered</span></div>
        <div className={`${styles.stat} ${styles.statAccent}`}><span className={styles.statLabel}>Average order value</span><span className={styles.statValue}>{formatVnd(t.aov)}</span><span className={styles.statNote}>per completed order</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Total profit</span><span className={styles.statValue}>{formatVnd(t.profit)}</span><span className={styles.statNote}>revenue − cost of goods (FIFO)</span></div>
        <div className={`${styles.stat} ${styles.statOrange}`}><span className={styles.statLabel}>Profit margin</span><span className={styles.statValue}>{pct(t.margin)}</span><span className={styles.statNote}>cogs {formatVnd(t.cogs)}</span></div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}>
          <h2 className={styles.h3}>Revenue over time</h2>
          <div className={styles.legend}>
            <span><i className={styles.swatch} />Revenue</span>
            <span><i className={styles.swatchLine} />Profit</span>
            <span className={styles.kickerSm}>{data.series.unit === "month" ? "per month" : "per day"} · peak {formatVnd(peak)}</span>
          </div>
        </div>
        <div className={styles.chart}>
          <div className={styles.bars}>
            {data.series.buckets.map((b, i) => (
              <span key={i} title={`${b.title} · revenue ${formatVnd(b.revenue)} · profit ${formatVnd(b.profit)}`} className={styles.barCol}>
                <span className={`${styles.chartBar} ${b.revenue === peak && peak > 0 ? styles.barPeak : ""}`} style={{ height: `${peak ? Math.max((b.revenue / peak) * 100, b.revenue > 0 ? 2 : 0) : 0}%` }} />
                <span className={styles.barLabel}>{n <= 13 || i % 4 === 0 ? b.label : " "}</span>
              </span>
            ))}
          </div>
          {peak > 0 && (
            <svg className={styles.profitLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={profitPoints} fill="none" stroke="#0e9e7e" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
          )}
          {peak === 0 && <span className={styles.chartEmpty}>No completed orders in this range</span>}
        </div>
      </div>

      <div className={styles.dashCols}>
        <div className={styles.box}>
          <div className={styles.boxHead}><h2 className={styles.h3}>By brand</h2></div>
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 660 }}>
              <thead><tr><th>Brand</th><th>Share</th><th className={styles.right}>Units</th><th className={styles.right}>Revenue</th><th className={styles.right}>Cost</th><th className={styles.right}>Margin</th></tr></thead>
              <tbody>
                {data.byBrand.length === 0 && <tr><td colSpan={6} className={styles.boxEmpty}>Nothing sold in this range</td></tr>}
                {data.byBrand.map((b) => (
                  <tr key={b.name}>
                    <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{b.name}</td>
                    <td style={{ width: "40%" }}>
                      <span className={styles.shareCell}>
                        <span className={styles.shareTrack}><span className={styles.shareFill} style={{ width: `${maxBrand ? (b.revenue / maxBrand) * 100 : 0}%` }} /></span>
                        <span className={styles.cellNum}>{Math.round(b.share * 100)}%</span>
                      </span>
                    </td>
                    <td className={`${styles.right} ${styles.cellNum}`}>{b.units}</td>
                    <td className={`${styles.right} ${styles.cellNum}`}>{formatVnd(b.revenue)}</td>
                    <td className={`${styles.right} ${styles.cellNum} ${styles.muted}`}>{formatVnd(b.cogs)}</td>
                    <td className={`${styles.right} ${styles.cellNum}`} style={{ color: "#0e9e7e" }}>{Math.round(b.margin * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.boxHead}><h2 className={styles.h3}>By category</h2></div>
          <div className={styles.catList}>
            {data.byCategory.length === 0 && <span className={styles.boxEmpty}>Nothing sold in this range</span>}
            {data.byCategory.map((c) => (
              <div key={c.name} className={styles.catRow}>
                <div className={styles.catTop}>
                  <span className={styles.kickerSm} style={{ color: "var(--ink)" }}>{c.name}</span>
                  <span className={styles.cellNum} style={{ color: "var(--muted)" }}>{formatVnd(c.revenue)} · {Math.round(c.share * 100)}%</span>
                </div>
                <span className={styles.shareTrack}><span className={styles.shareFill} style={{ width: `${maxCat ? (c.revenue / maxCat) * 100 : 0}%` }} /></span>
                <div className={styles.catFoot}>
                  <span>Cost {formatVnd(c.cogs)}</span>
                  <span style={{ color: "#0e9e7e" }}>Margin {Math.round(c.margin * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}><h2 className={styles.h3}>Margin leaders</h2><span className={styles.kickerSm}>by product · this range</span></div>
        <div className={styles.marginCols}>
          <div className={styles.marginCol}>
            <span className={styles.kickerSm}>Highest margin</span>
            {data.marginTop.length === 0 && <span className={styles.boxEmpty} style={{ padding: 0 }}>—</span>}
            {data.marginTop.map((p) => (
              <div key={p.name} className={styles.marginRow}>
                <span className={styles.prodText}><span className={styles.prodName}>{p.name}</span><span className={styles.prodSku}>{p.brand} · {p.units} sold</span></span>
                <span className={styles.marginNum}>{Math.round(p.margin * 100)}%</span>
              </div>
            ))}
          </div>
          <div className={styles.marginCol}>
            <span className={styles.kickerSm}>Lowest margin</span>
            {data.marginBottom.length === 0 && <span className={styles.boxEmpty} style={{ padding: 0 }}>—</span>}
            {data.marginBottom.map((p) => (
              <div key={p.name} className={styles.marginRow}>
                <span className={styles.prodText}><span className={styles.prodName}>{p.name}</span><span className={styles.prodSku}>{p.brand} · {p.units} sold</span></span>
                <span className={`${styles.marginNum} ${styles.marginLow}`}>{Math.round(p.margin * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
