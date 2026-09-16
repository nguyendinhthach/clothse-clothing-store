"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrderAction, requestRefundAction } from "@/lib/actions/bag";
import { formatVnd } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/order-status";
import { routes } from "@/lib/routes";
import type { OrderSummary } from "@/lib/services/orders";
import styles from "./bag.module.css";

interface Props {
  orders: OrderSummary[];
  empty: { label: string; title: string; body: string };
  highlight?: string;
}

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function OrderList({ orders, empty, highlight }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong."));
      router.refresh();
    });

  if (orders.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <span className={styles.emptyKicker}>{empty.label}</span>
        <h2 className={styles.emptyTabTitle}>{empty.title}</h2>
        <p className={styles.emptyBody}>{empty.body}</p>
        <Link href={routes.shop()} className={styles.emptyBtnGhost}>Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className={styles.orders}>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {orders.map((o) => (
        <article key={o.id} className={`${styles.order} ${o.code === highlight ? styles.orderNew : ""}`}>
          <header className={styles.orderHead}>
            <div className={styles.orderMeta}>
              <span className={styles.orderCode}>#{o.code}</span>
              <span className={styles.orderDate}>{fmtDate(o.createdAt)}</span>
            </div>
            <div className={styles.orderPills}>
              <span className={`${styles.pill} ${styles[`pill_${o.status}`] ?? ""}`}>{STATUS_LABEL[o.status]}</span>
              <span className={`${styles.pill} ${styles.pillMuted}`}>{o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus === "REFUNDED" ? "Refunded" : "COD · unpaid"}</span>
            </div>
          </header>

          <ul className={styles.orderItems}>
            {o.items.map((i, k) => (
              <li key={k} className={styles.orderItem}>
                <Link href={routes.product(i.productId)} className={styles.orderItemName}>{i.name}</Link>
                <span className={styles.orderItemMeta}>Size {i.size} × {i.qty}</span>
                <span className={styles.orderItemPrice}>{formatVnd(i.unitPrice * i.qty)}</span>
              </li>
            ))}
          </ul>

          <footer className={styles.orderFoot}>
            <div className={styles.orderShip}>
              <span className={styles.orderShipLabel}>Deliver to</span>
              <span>{o.shipName} · {o.shipPhone}</span>
              <span className={styles.muted}>{o.shipAddress}</span>
            </div>
            <div className={styles.orderTotals}>
              <span className={styles.muted}>Shipping {o.shippingFee === 0 ? "free" : formatVnd(o.shippingFee)}</span>
              <span className={styles.orderTotal}>{formatVnd(o.total)}</span>
              {o.canCancel && (
                <button type="button" disabled={pending} onClick={() => { if (confirm(`Cancel order #${o.code}?`)) act(() => cancelOrderAction(o.id)); }} className={`${styles.textBtn} ${styles.textBtnDanger}`}>
                  Cancel order
                </button>
              )}
              {o.canRequestRefund && (
                <button type="button" disabled={pending} onClick={() => { if (confirm(`Open a return for #${o.code}?`)) act(() => requestRefundAction(o.id)); }} className={styles.textBtn}>
                  Request return
                </button>
              )}
              {o.status === "REFUND" && o.paymentStatus !== "REFUNDED" && <span className={styles.muted}>Return under review</span>}
            </div>
          </footer>
        </article>
      ))}
    </div>
  );
}
