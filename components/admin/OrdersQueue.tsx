"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCancelOrderAction, advanceOrderAction, approveRefundAction } from "@/lib/actions/admin-orders";
import { formatVnd } from "@/lib/format";
import { ORDER_TABS, STATUS_LABEL } from "@/lib/order-status";
import { routes } from "@/lib/routes";
import type { AdminOrderRow } from "@/lib/services/admin/orders";
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import { Placeholder } from "@/components/product/Placeholder";
import styles from "./admin.module.css";

const NOTE: Record<OrderStatus, string> = {
  PENDING: "New orders awaiting confirmation before processing begins.",
  PROCESSING: "Confirmed orders being picked and packed.",
  SHIPPING: "Dispatched parcels in transit to customers. Delivered = cash collected.",
  COMPLETED: "Delivered orders, closed out.",
  CANCELLED: "Orders cancelled before dispatch — stock already returned.",
  REFUND: "Open return cases. Approving refunds the customer and returns stock.",
};

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  status: OrderStatus;
  counts: Record<OrderStatus, number>;
  orders: AdminOrderRow[];
}

export function OrdersQueue({ status, counts, orders }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong."));
      router.refresh();
    });

  return (
    <div className={styles.stack}>
      <div className={styles.queueTabs}>
        {ORDER_TABS.map((t) => (
          <Link key={t.status} href={`${routes.adminOrders}?status=${t.tab}`} aria-current={t.status === status ? "true" : undefined} className={`${styles.queueTab} ${t.status === status ? styles.queueTabOn : ""}`}>
            <span>{t.label}</span>
            <span className={styles.queueCount}>{counts[t.status]}</span>
          </Link>
        ))}
      </div>
      <p className={styles.note}>{NOTE[status]}</p>
      {error && <div className={styles.error} role="alert">{error}</div>}

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyTag}>{STATUS_LABEL[status]} · 0 orders</span>
          <h3 className={styles.emptyTitle}>Nothing here right now</h3>
          <p className={styles.emptyBody}>Orders will appear in this queue as they reach that stage.</p>
        </div>
      ) : (
        orders.map((o) => {
          const paid = o.paymentStatus === "PAID";
          const refunded = o.paymentStatus === "REFUNDED";
          const open = expanded === o.id;
          return (
            <article key={o.id} className={styles.orderRow}>
              <div className={styles.orderMain}>
                <div className={styles.orderWho}>
                  <span className={styles.mono}>#{o.code}</span>
                  <span className={styles.orderCustomer}>{o.customer.name}</span>
                  <span className={styles.orderDate}>{fmtDate(o.createdAt)} · {o.customer.email}</span>
                </div>
                <button type="button" onClick={() => setExpanded(open ? null : o.id)} className={styles.orderItems} aria-expanded={open}>
                  <span className={styles.thumbs}>
                    {o.items.slice(0, 2).map((i, k) => (
                      <span key={k} className={styles.thumb}>
                        {i.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.image.url} alt="" className={styles.thumbImg} />
                        ) : (
                          <Placeholder label="" />
                        )}
                      </span>
                    ))}
                  </span>
                  <span className={styles.itemsLabel}>{o.units} {o.units === 1 ? "item" : "items"} {open ? "▴" : "▾"}</span>
                </button>
                <div className={styles.orderMoney}>
                  <span className={styles.orderTotal}>{formatVnd(o.total)}</span>
                  <span className={styles.paidLine}>
                    <span className={`${styles.paidPill} ${paid || refunded ? styles.paidOn : styles.paidOff}`}>{refunded ? "Refunded" : paid ? "Paid" : "Unpaid"}</span>
                    {refunded ? "money returned" : paid ? "cash received" : "collect on delivery"}
                  </span>
                </div>
                <div className={styles.orderActions}>
                  {o.primaryLabel && (
                    <button type="button" disabled={pending} onClick={() => run(() => advanceOrderAction(o.id))} className={styles.primaryBtn}>
                      {o.primaryLabel}
                    </button>
                  )}
                  {o.canApproveRefund && (
                    <button type="button" disabled={pending} onClick={() => { if (confirm(`Approve the refund for #${o.code}? Stock returns to the shelf.`)) run(() => approveRefundAction(o.id)); }} className={styles.primaryBtn}>
                      Approve refund
                    </button>
                  )}
                  {o.canCancel && (
                    <button type="button" disabled={pending} onClick={() => { if (confirm(`Cancel order #${o.code}?`)) run(() => adminCancelOrderAction(o.id)); }} className={styles.ghostBtn}>
                      Cancel
                    </button>
                  )}
                  {!o.primaryLabel && !o.canApproveRefund && !o.canCancel && <span className={styles.viewOnly}>{STATUS_LABEL[o.status]}</span>}
                </div>
              </div>
              {open && (
                <div className={styles.orderDetail}>
                  <ul className={styles.detailList}>
                    {o.items.map((i, k) => (
                      <li key={k}>
                        <span>{i.name}</span>
                        <span className={styles.mono}>Size {i.size} × {i.qty}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.detailShip}>
                    <span className={styles.kickerSm}>Deliver to</span>
                    <span>{o.shipName} · {o.shipPhone}</span>
                    <span className={styles.muted}>{o.shipAddress}</span>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
