import type { Metadata } from "next";
import Link from "next/link";
import { BagLines } from "@/components/bag/BagLines";
import { OrderList } from "@/components/bag/OrderList";
import { ORDER_TABS } from "@/lib/order-status";
import { routes, type BagTab } from "@/lib/routes";
import { countOrdersByStatus, getBagLines, listOrders } from "@/lib/services/orders";
import { requireUser } from "@/lib/session";
import styles from "@/components/bag/bag.module.css";

export const metadata: Metadata = { title: "My Bag & Orders" };

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
            <Link href={routes.home}>Home</Link>
            <span>/</span>
            <span>Account</span>
            <span>/</span>
            <span className={styles.crumbCurrent}>{tab === "bag" ? "My Bag" : "My Orders"}</span>
          </nav>
          <h1 className={styles.h1}>{tab === "bag" ? "My Bag" : "My Orders"}</h1>
        </div>
        <div className={styles.headMeta}>
          <span className={styles.count}>{units} {units === 1 ? "item" : "items"} in bag</span>
          <span className={styles.countSub}>Stock is reserved when you place the order</span>
        </div>
      </section>

      {placed && (
        <div className={styles.placed} role="status">
          Order <strong>#{placed}</strong> placed — we&apos;ll confirm it shortly. Pay the courier on delivery.
        </div>
      )}

      <div role="tablist" className={styles.tabs}>
        <Link href={routes.bag()} role="tab" aria-selected={tab === "bag"} className={`${styles.tab} ${tab === "bag" ? styles.tabOn : ""}`}>
          Bag
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
