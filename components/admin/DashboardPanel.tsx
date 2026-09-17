import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/order-status";
import { routes } from "@/lib/routes";
import type { DashboardData } from "@/lib/services/admin/analytics";
import styles from "./admin.module.css";

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const pct = (cur: number, prev: number) => (prev > 0 ? `${cur >= prev ? "+" : ""}${Math.round(((cur - prev) / prev) * 100)}% vs last month` : "no sales last month");

export function DashboardPanel({ d }: { d: DashboardData }) {
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });
  return (
    <div className={styles.stack}>
      <div className={styles.statGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className={`${styles.stat} ${styles.statDark}`}>
          <span className={styles.statLabel}>Revenue · {month}</span>
          <span className={styles.statValue}>{formatVnd(d.revenueMonth)}</span>
          <span className={styles.statNote}>{pct(d.revenueMonth, d.revenuePrevMonth)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total orders</span>
          <span className={styles.statValue}>{d.totalOrders}</span>
          <span className={styles.statNote}>All statuses</span>
        </div>
        <Link href={`${routes.adminOrders}?status=pending`} className={`${styles.stat} ${styles.statAccent}`}>
          <span className={styles.statLabel}>To confirm</span>
          <span className={styles.statValue}>{d.pendingOrders}</span>
          <span className={styles.statNote}>New orders not yet confirmed</span>
        </Link>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Low stock sizes</span>
          <span className={styles.statValue}>{d.lowSizes + d.outSizes}</span>
          <span className={styles.statNote}>{d.lowSizes} low · {d.outSizes} out</span>
        </div>
      </div>

      <div className={styles.dashCols}>
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <h2 className={styles.h3}>Recent orders</h2>
            <Link href={routes.adminOrders} className={styles.linkBtn}>View all →</Link>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 520 }}>
              <thead><tr><th>Order</th><th>Customer</th><th className={styles.right}>Total</th><th>Status</th><th className={styles.right}>Date</th></tr></thead>
              <tbody>
                {d.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className={styles.mono}>#{o.code}</td>
                    <td style={{ fontWeight: 500 }}>{o.customer}</td>
                    <td className={`${styles.right} ${styles.cellNum}`}>{formatVnd(o.total)}</td>
                    <td><span className={`${styles.pill} ${styles[`pill_${o.status}`] ?? ""}`}>{STATUS_LABEL[o.status]}</span></td>
                    <td className={`${styles.right} ${styles.cellNum} ${styles.muted}`}>{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.box}>
          <div className={styles.boxHead}><h2 className={styles.h3}>Top selling</h2></div>
          <div>
            {d.topSellers.length === 0 && <span className={styles.boxEmpty}>No completed orders yet</span>}
            {d.topSellers.map((t) => (
              <Link key={t.productId} href={`${routes.adminProducts}?edit=${t.productId}`} className={styles.topRow}>
                <span className={styles.prodThumb} style={{ width: 44, height: 52 }}>
                  {t.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt="" className={styles.thumbImg} />
                  )}
                </span>
                <span className={styles.prodText} style={{ minWidth: 0 }}>
                  <span className={styles.prodName} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                  <span className={styles.prodSku}>{t.brand}</span>
                </span>
                <span className={`${styles.cellNum}`} style={{ marginLeft: "auto", flex: "0 0 auto" }}>{t.units} sold</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}>
          <h2 className={styles.h3}>Needs attention · {d.attention.length} {d.attention.length === 1 ? "size" : "sizes"}</h2>
          <span className={styles.kickerSm}>{d.lowSizes} low stock · {d.outSizes} out of stock</span>
        </div>
        {d.attention.length === 0 ? (
          <span className={styles.boxEmpty}>All sizes healthy — nothing under {6} units.</span>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 720 }}>
              <thead><tr><th>Product</th><th>Size</th><th className={styles.right}>Listed</th><th>Warehouse</th><th>Status</th><th /></tr></thead>
              <tbody>
                {d.attention.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <span className={styles.prodText}>
                        <span className={styles.prodName}>{a.name}</span>
                        <span className={styles.prodSku}>{a.brand}</span>
                      </span>
                    </td>
                    <td className={styles.cellNum}>{a.size}</td>
                    <td className={`${styles.right} ${styles.cellNum}`}>{a.stock}</td>
                    <td className={`${styles.cellNum} ${a.warehouse > 0 ? "" : styles.muted}`}>{a.warehouse > 0 ? `${a.warehouse} available in warehouse` : "No warehouse stock"}</td>
                    <td><span className={`${styles.pill} ${a.stock === 0 ? "" : styles.pillMuted}`}>{a.stock === 0 ? "Out of stock" : "Low stock"}</span></td>
                    <td className={styles.right}>
                      <Link href={a.warehouse > 0 ? `${routes.adminProducts}?edit=${a.productId}` : routes.adminStorage} className={styles.smallBtn}>{a.warehouse > 0 ? "Restock" : "Receive stock"}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
