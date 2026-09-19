import Link from "next/link";
import { formatDate, formatVnd } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/order-status";
import { routes } from "@/lib/routes";
import type { DashboardData } from "@/lib/services/admin/analytics";
import styles from "./admin.module.css";

const fmtDate = (d: Date) => formatDate(d, { day: "numeric", month: "numeric" });
const pct = (cur: number, prev: number) => (prev > 0 ? `${cur >= prev ? "+" : ""}${Math.round(((cur - prev) / prev) * 100)}% so với tháng trước` : "tháng trước chưa có doanh thu");

export function DashboardPanel({ d }: { d: DashboardData }) {
  const month = `tháng ${new Date().getMonth() + 1}`;
  return (
    <div className={styles.stack}>
      <div className={styles.statGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className={`${styles.stat} ${styles.statDark}`}>
          <span className={styles.statLabel}>Doanh thu · {month}</span>
          <span className={styles.statValue}>{formatVnd(d.revenueMonth)}</span>
          <span className={styles.statNote}>{pct(d.revenueMonth, d.revenuePrevMonth)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Tổng đơn</span>
          <span className={styles.statValue}>{d.totalOrders}</span>
          <span className={styles.statNote}>Mọi trạng thái</span>
        </div>
        <Link href={`${routes.adminOrders}?status=pending`} className={`${styles.stat} ${styles.statAccent}`}>
          <span className={styles.statLabel}>Chờ xác nhận</span>
          <span className={styles.statValue}>{d.pendingOrders}</span>
          <span className={styles.statNote}>Đơn mới chưa xác nhận</span>
        </Link>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Size sắp hết</span>
          <span className={styles.statValue}>{d.lowSizes + d.outSizes}</span>
          <span className={styles.statNote}>{d.lowSizes} sắp hết · {d.outSizes} hết</span>
        </div>
      </div>

      <div className={styles.dashCols}>
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <h2 className={styles.h3}>Đơn gần đây</h2>
            <Link href={routes.adminOrders} className={styles.linkBtn}>Xem tất cả →</Link>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 520 }}>
              <thead><tr><th>Đơn</th><th>Khách</th><th className={styles.right}>Tổng</th><th>Trạng thái</th><th className={styles.right}>Ngày</th></tr></thead>
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
          <div className={styles.boxHead}><h2 className={styles.h3}>Bán chạy</h2></div>
          <div>
            {d.topSellers.length === 0 && <span className={styles.boxEmpty}>Chưa có đơn hoàn thành</span>}
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
                <span className={`${styles.cellNum}`} style={{ marginLeft: "auto", flex: "0 0 auto" }}>{t.units} đã bán</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.box}>
        <div className={styles.boxHead}>
          <h2 className={styles.h3}>Cần chú ý · {d.attention.length} size</h2>
          <span className={styles.kickerSm}>{d.lowSizes} sắp hết · {d.outSizes} hết hàng</span>
        </div>
        {d.attention.length === 0 ? (
          <span className={styles.boxEmpty}>Mọi size đều ổn — không size nào dưới {6} món.</span>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table} style={{ minWidth: 720 }}>
              <thead><tr><th>Sản phẩm</th><th>Size</th><th className={styles.right}>Trên kệ</th><th>Trong kho</th><th>Trạng thái</th><th /></tr></thead>
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
                    <td className={`${styles.cellNum} ${a.warehouse > 0 ? "" : styles.muted}`}>{a.warehouse > 0 ? `${a.warehouse} sẵn trong kho` : "Kho không còn"}</td>
                    <td><span className={`${styles.pill} ${a.stock === 0 ? "" : styles.pillMuted}`}>{a.stock === 0 ? "Hết hàng" : "Sắp hết"}</span></td>
                    <td className={styles.right}>
                      <Link href={a.warehouse > 0 ? `${routes.adminProducts}?edit=${a.productId}` : routes.adminStorage} className={styles.smallBtn}>{a.warehouse > 0 ? "Lên kệ" : "Nhập kho"}</Link>
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
