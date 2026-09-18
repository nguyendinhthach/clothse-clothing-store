"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryLabel } from "@/lib/catalog-constants";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { RangeKey, RevenueData } from "@/lib/services/admin/analytics";
import styles from "./admin.module.css";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "year", label: "Năm nay" },
  { key: "custom", label: "Tuỳ chọn" },
];

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function RevenuePanel({ data, custom }: { data: RevenueData; custom: { from: string; to: string } }) {
  const router = useRouter();
  const [picker, setPicker] = useState(false);
  const [from, setFrom] = useState(custom.from);
  const [to, setTo] = useState(custom.to);
  const r = data.range;
  const t = data.totals;
  const vsPrior = data.prior.revenue > 0 ? `${t.revenue >= data.prior.revenue ? "+" : ""}${Math.round(((t.revenue - data.prior.revenue) / data.prior.revenue) * 100)}% so với kỳ trước` : "kỳ trước chưa có doanh thu";

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
              {x.key === "custom" && r.key === "custom" ? `Tuỳ chọn · ${r.label}` : x.label}{x.key === "custom" ? (picker ? " ▲" : " ▼") : ""}
            </Link>
          ))}
          {picker && (
            <div className={styles.picker}>
              <div className={styles.lineTop}>
                <span className={styles.fieldLabel}>Khoảng tuỳ chọn</span>
                <button type="button" onClick={() => setPicker(false)} aria-label="Đóng" className={styles.closeBtn} style={{ width: 28, height: 28 }}>✕</button>
              </div>
              <div className={styles.fields}>
                <label className={styles.field}><span className={styles.fieldLabel}>Từ</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} /></label>
                <label className={styles.field}><span className={styles.fieldLabel}>Đến</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${styles.input} ${styles.inputSm} ${styles.mono}`} /></label>
              </div>
              <div className={styles.modalFoot} style={{ padding: "12px 0 0", background: "transparent" }}>
                <button type="button" onClick={() => setPicker(false)} className={styles.ghostBtn}>Huỷ</button>
                <button type="button" disabled={!from || !to} onClick={() => { setPicker(false); router.push(`${routes.adminRevenue}?range=custom&from=${from}&to=${to}`); }} className={styles.primaryBtn}>Áp dụng</button>
              </div>
            </div>
          )}
        </div>
        <span className={styles.kickerSm}>{r.label}</span>
      </div>

      <div className={styles.statGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className={`${styles.stat} ${styles.statDark}`}><span className={styles.statLabel}>Tổng doanh thu</span><span className={styles.statValue}>{formatVnd(t.revenue)}</span><span className={styles.statNote}>{vsPrior}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Đơn hoàn thành</span><span className={styles.statValue}>{t.orders}</span><span className={styles.statNote}>{t.units} món · đã giao & thu tiền</span></div>
        <div className={`${styles.stat} ${styles.statAccent}`}><span className={styles.statLabel}>Giá trị đơn trung bình</span><span className={styles.statValue}>{formatVnd(t.aov)}</span><span className={styles.statNote}>mỗi đơn hoàn thành</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Tổng lợi nhuận</span><span className={styles.statValue}>{formatVnd(t.profit)}</span><span className={styles.statNote}>doanh thu − giá vốn (FIFO)</span></div>
        <div className={`${styles.stat} ${styles.statOrange}`}><span className={styles.statLabel}>Biên lợi nhuận</span><span className={styles.statValue}>{pct(t.margin)}</span><span className={styles.statNote}>giá vốn {formatVnd(t.cogs)}</span></div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}>
          <h2 className={styles.h3}>Doanh thu theo thời gian</h2>
          <div className={styles.legend}>
            <span><i className={styles.swatch} />Doanh thu</span>
            <span><i className={styles.swatchLine} />Lợi nhuận</span>
            <span className={styles.kickerSm}>{data.series.unit === "month" ? "theo tháng" : "theo ngày"} · cao nhất {formatVnd(peak)}</span>
          </div>
        </div>
        <div className={styles.chart}>
          <div className={styles.bars}>
            {data.series.buckets.map((b, i) => (
              <span key={i} title={`${b.title} · doanh thu ${formatVnd(b.revenue)} · lợi nhuận ${formatVnd(b.profit)}`} className={styles.barCol}>
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
          {peak === 0 && <span className={styles.chartEmpty}>Chưa có đơn hoàn thành trong khoảng này</span>}
        </div>
      </div>

      <div className={styles.dashCols}>
        <div className={styles.box}>
          <div className={styles.boxHead}><h2 className={styles.h3}>Theo hãng</h2></div>
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 660 }}>
              <thead><tr><th>Hãng</th><th>Tỷ trọng</th><th className={styles.right}>Món</th><th className={styles.right}>Doanh thu</th><th className={styles.right}>Giá vốn</th><th className={styles.right}>Biên</th></tr></thead>
              <tbody>
                {data.byBrand.length === 0 && <tr><td colSpan={6} className={styles.boxEmpty}>Chưa bán gì trong khoảng này</td></tr>}
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
          <div className={styles.boxHead}><h2 className={styles.h3}>Theo danh mục</h2></div>
          <div className={styles.catList}>
            {data.byCategory.length === 0 && <span className={styles.boxEmpty}>Chưa bán gì trong khoảng này</span>}
            {data.byCategory.map((c) => (
              <div key={c.name} className={styles.catRow}>
                <div className={styles.catTop}>
                  <span className={styles.kickerSm} style={{ color: "var(--ink)" }}>{categoryLabel(c.name)}</span>
                  <span className={styles.cellNum} style={{ color: "var(--muted)" }}>{formatVnd(c.revenue)} · {Math.round(c.share * 100)}%</span>
                </div>
                <span className={styles.shareTrack}><span className={styles.shareFill} style={{ width: `${maxCat ? (c.revenue / maxCat) * 100 : 0}%` }} /></span>
                <div className={styles.catFoot}>
                  <span>Giá vốn {formatVnd(c.cogs)}</span>
                  <span style={{ color: "#0e9e7e" }}>Biên {Math.round(c.margin * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}><h2 className={styles.h3}>Biên lợi nhuận</h2><span className={styles.kickerSm}>theo sản phẩm · khoảng này</span></div>
        <div className={styles.marginCols}>
          <div className={styles.marginCol}>
            <span className={styles.kickerSm}>Biên cao nhất</span>
            {data.marginTop.length === 0 && <span className={styles.boxEmpty} style={{ padding: 0 }}>—</span>}
            {data.marginTop.map((p) => (
              <div key={p.name} className={styles.marginRow}>
                <span className={styles.prodText}><span className={styles.prodName}>{p.name}</span><span className={styles.prodSku}>{p.brand} · {p.units} đã bán</span></span>
                <span className={styles.marginNum}>{Math.round(p.margin * 100)}%</span>
              </div>
            ))}
          </div>
          <div className={styles.marginCol}>
            <span className={styles.kickerSm}>Biên thấp nhất</span>
            {data.marginBottom.length === 0 && <span className={styles.boxEmpty} style={{ padding: 0 }}>—</span>}
            {data.marginBottom.map((p) => (
              <div key={p.name} className={styles.marginRow}>
                <span className={styles.prodText}><span className={styles.prodName}>{p.name}</span><span className={styles.prodSku}>{p.brand} · {p.units} đã bán</span></span>
                <span className={`${styles.marginNum} ${styles.marginLow}`}>{Math.round(p.margin * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
