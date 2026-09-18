"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrderAction, type CheckoutState } from "@/lib/actions/bag";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { BagLine } from "@/lib/services/orders";
import { shippingFeeFor } from "@/lib/shipping";
import styles from "./bag.module.css";

interface Props {
  lines: BagLine[];
  address: { name: string; phone: string; line: string; city: string } | null;
}

export function CheckoutForm({ lines, address }: Props) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrderAction, {});
  const subtotal = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const shipping = shippingFeeFor(subtotal);
  const total = subtotal + shipping;

  return (
    <form action={action} className={styles.bagGrid}>
      <input type="hidden" name="lines" value={lines.map((l) => l.variantId).join(",")} />

      <section className={styles.lines}>
        <h2 className={styles.sectionTitle}>Giao hàng</h2>
        <p className={styles.sectionHint}>Thanh toán khi nhận hàng — shipper thu {formatVnd(total)} lúc giao. Chỉ giao trong nước.</p>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Họ tên</span>
            <input name="name" required defaultValue={address?.name ?? ""} autoComplete="name" className={styles.input} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Số điện thoại</span>
            <input name="phone" required defaultValue={address?.phone ?? ""} autoComplete="tel" inputMode="tel" className={styles.input} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Địa chỉ</span>
            <input name="address" required defaultValue={address ? `${address.line}, ${address.city}` : ""} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" className={styles.input} />
          </label>
        </div>

        <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>Sản phẩm ({lines.length})</h2>
        <ul className={styles.orderItems}>
          {lines.map((l) => (
            <li key={l.variantId} className={styles.orderItem}>
              <Link href={routes.product(l.productId)} className={styles.orderItemName}>{l.name}</Link>
              <span className={styles.orderItemMeta}>Size {l.size} × {l.qty}</span>
              <span className={styles.orderItemPrice}>{formatVnd(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <Link href={routes.bag()} className={styles.continue}>← Về giỏ hàng</Link>
      </section>

      <aside className={styles.summary}>
        <span className={styles.summaryTitle}>Tóm tắt</span>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}><span>Tạm tính</span><span>{formatVnd(subtotal)}</span></div>
          <div className={styles.summaryRow}><span>Phí ship</span><span>{shipping === 0 ? "Miễn phí" : formatVnd(shipping)}</span></div>
          <div className={styles.summaryRow}><span>Thanh toán</span><span className={styles.muted}>Khi nhận hàng (COD)</span></div>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Tổng</span>
          <span className={styles.totalValue}>{formatVnd(total)}</span>
        </div>
        <button type="submit" disabled={pending} className={styles.checkoutBtn}>
          {pending ? "Đang đặt đơn…" : `Đặt đơn — ${formatVnd(total)}`}
        </button>
        {state.error && <div className={styles.error} role="alert">{state.error}</div>}
        <span className={styles.shipNote}>Bạn có thể huỷ khi đơn còn ở Chờ xác nhận hoặc Đang xử lý.</span>
      </aside>
    </form>
  );
}
