import type { Metadata } from "next";
import Link from "next/link";
import { BagLines } from "@/components/bag/BagLines";
import { OrderList } from "@/components/bag/OrderList";
import { ORDER_TABS } from "@/lib/order-status";
import { routes, type BagTab } from "@/lib/routes";
import { countOrdersByStatus, getBagLines, listOrders } from "@/lib/services/orders";
import { requireUser } from "@/lib/session";
import styles from "@/components/bag/bag.module.css";

export const metadata: Metadata = { title: "Giỏ hàng & Đơn hàng" };

const isTab = (t: unknown): t is BagTab => t === "bag" || ORDER_TABS.some((x) => x.tab === t);

export default async function BagPage({ searchParams }: PageProps<"/bag">) {
  const sp = await searchParams;
  const tab: BagTab = isTab(sp.tab) ? sp.tab : "bag";
  const user = await requireUser(routes.bag(tab));

  const [lines, counts] = await Promise.all([getBagLines(user.id), countOrdersByStatus(user.id)]);
  const units = lines.reduce((n, l) => n + l.qty, 0);
  const active = ORDER_TABS.find((t) => t.tab === tab);
  const orders = active ? await listOrders(user.id, active.status) : [];
  const placed = typeof sp.placed === "string" ? sp.placed : undefined;

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Trang chủ</Link>
            <span>/</span>
            <span>Tài khoản</span>
            <span>/</span>
            <span className={styles.crumbCurrent}>{tab === "bag" ? "Giỏ hàng" : "Đơn hàng"}</span>
          </nav>
          <h1 className={styles.h1}>{tab === "bag" ? "Giỏ hàng" : "Đơn hàng"}</h1>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.count}>{units} món trong giỏ</span>
          <span className={styles.countSub}>Hàng chỉ được giữ khi bạn đặt đơn</span>
        </div>
      </section>

      {placed && (
        <div className={styles.placed} role="status">
          Đã đặt đơn <strong>#{placed}</strong> — shop sẽ xác nhận sớm. Bạn thanh toán cho shipper khi nhận hàng.
        </div>
      )}

      <div role="tablist" className={styles.tabs}>
        <Link href={routes.bag()} role="tab" aria-selected={tab === "bag"} className={`${styles.tab} ${tab === "bag" ? styles.tabOn : ""}`}>
          Giỏ hàng
          {units > 0 && <span className={styles.tabBadge}>{units}</span>}
        </Link>
        {ORDER_TABS.map((t) => (
          <Link key={t.tab} href={routes.bag(t.tab)} role="tab" aria-selected={tab === t.tab} className={`${styles.tab} ${tab === t.tab ? styles.tabOn : ""}`}>
            {t.label}
            {counts[t.status] > 0 && <span className={styles.tabBadge}>{counts[t.status]}</span>}
          </Link>
        ))}
      </div>

      {tab === "bag" ? (
        <BagLines lines={lines} />
      ) : (
        <OrderList orders={orders} empty={{ label: active!.label, title: active!.emptyTitle, body: active!.emptyBody }} highlight={placed} />
      )}
    </div>
  );
}
