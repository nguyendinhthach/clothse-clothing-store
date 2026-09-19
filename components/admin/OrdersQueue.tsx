"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCancelOrderAction, advanceOrderAction, approveRefundAction } from "@/lib/actions/admin-orders";
import { formatDate, formatVnd } from "@/lib/format";
import { ORDER_TABS, STATUS_LABEL } from "@/lib/order-status";
import { routes } from "@/lib/routes";
import type { AdminOrderRow } from "@/lib/services/admin/orders";
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import { Placeholder } from "@/components/product/Placeholder";
import styles from "./admin.module.css";

const NOTE: Record<OrderStatus, string> = {
  PENDING: "Đơn mới, chờ xác nhận trước khi xử lý.",
  PROCESSING: "Đơn đã xác nhận, đang soạn và đóng gói.",
  SHIPPING: "Gói hàng đang trên đường tới khách. Đã giao = đã thu tiền.",
  COMPLETED: "Đơn đã giao, đã đóng.",
  CANCELLED: "Đơn huỷ trước khi gửi — hàng đã trả về kệ.",
  REFUND: "Yêu cầu đổi trả đang mở. Duyệt = hoàn tiền cho khách và trả hàng về kệ.",
};

const fmtDate = (d: Date) => formatDate(d);

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
      setError(r.ok ? null : (r.error ?? "Có lỗi xảy ra."));
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
          <span className={styles.emptyTag}>{STATUS_LABEL[status]} · 0 đơn</span>
          <h3 className={styles.emptyTitle}>Chưa có gì ở đây</h3>
          <p className={styles.emptyBody}>Đơn sẽ hiện ở hàng chờ này khi tới giai đoạn đó.</p>
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
                  <span className={styles.itemsLabel}>{o.units} món {open ? "▴" : "▾"}</span>
                </button>
                <div className={styles.orderMoney}>
                  <span className={styles.orderTotal}>{formatVnd(o.total)}</span>
                  <span className={styles.paidLine}>
                    <span className={`${styles.paidPill} ${paid || refunded ? styles.paidOn : styles.paidOff}`}>{refunded ? "Đã hoàn" : paid ? "Đã thu" : "Chưa thu"}</span>
                    {refunded ? "đã trả lại tiền" : paid ? "đã nhận tiền mặt" : "thu khi giao"}
                  </span>
                </div>
                <div className={styles.orderActions}>
                  {o.primaryLabel && (
                    <button type="button" disabled={pending} onClick={() => run(() => advanceOrderAction(o.id))} className={styles.primaryBtn}>
                      {o.primaryLabel}
                    </button>
                  )}
                  {o.canApproveRefund && (
                    <button type="button" disabled={pending} onClick={() => { if (confirm(`Duyệt hoàn tiền cho đơn #${o.code}? Hàng sẽ trả về kệ.`)) run(() => approveRefundAction(o.id)); }} className={styles.primaryBtn}>
                      Duyệt hoàn tiền
                    </button>
                  )}
                  {o.canCancel && (
                    <button type="button" disabled={pending} onClick={() => { if (confirm(`Huỷ đơn #${o.code}?`)) run(() => adminCancelOrderAction(o.id)); }} className={styles.ghostBtn}>
                      Huỷ
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
                    <span className={styles.kickerSm}>Giao đến</span>
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
