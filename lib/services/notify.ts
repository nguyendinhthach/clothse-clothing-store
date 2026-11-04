import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl, sendMail, shopInbox } from "@/lib/mail";
import { formatVnd } from "@/lib/format";
import { routes, type BagTab } from "@/lib/routes";

// SPEC §6.10 — emails that follow a stock, product or order change.

/**
 * Send once the response is out: a mail failure must never roll back the write
 * or slow the action. `after` keeps the Vercel function alive until the job
 * ends; a bare `void` promise can be frozen before the mail leaves.
 */
export function mailAfterResponse(job: () => Promise<unknown>): void {
  after(async () => {
    try {
      await job();
    } catch (e) {
      console.error("[notify] send failed", e);
    }
  });
}

// ─── Favourites "Notify me" (§6.10 #3): restock and price drop ────────────────

async function recipients(productId: number) {
  const favs = await prisma.favourite.findMany({ where: { productId, notify: true }, include: { user: { select: { email: true, name: true } } } });
  return favs.map((f) => f.user);
}

export async function notifyRestock(productId: number): Promise<number> {
  const [product, users] = await Promise.all([prisma.product.findUnique({ where: { id: productId }, select: { name: true, active: true } }), recipients(productId)]);
  if (!product || !product.active || users.length === 0) return 0;
  const link = appUrl(routes.product(productId));
  await Promise.allSettled(
    users.map((u) =>
      sendMail({
        to: u.email,
        subject: `${product.name} đã có hàng lại`,
        text: `Chào ${u.name},\n\n${product.name} vừa về lại kho. Size đi nhanh lắm — lấy của bạn ở đây:\n\n${link}\n\nBạn nhận email này vì đã bật báo tin cho món này trong Yêu thích.\n\n— ClothSE`,
      }),
    ),
  );
  return users.length;
}

export async function notifySale(productId: number): Promise<number> {
  const [product, users] = await Promise.all([prisma.product.findUnique({ where: { id: productId }, select: { name: true, price: true, salePrice: true, active: true } }), recipients(productId)]);
  if (!product || !product.active || !product.salePrice || users.length === 0) return 0;
  const link = appUrl(routes.product(productId));
  const pct = Math.round((1 - product.salePrice / product.price) * 100);
  await Promise.allSettled(
    users.map((u) =>
      sendMail({
        to: u.email,
        subject: `Giảm giá: ${product.name} còn ${formatVnd(product.salePrice!)}`,
        text: `Chào ${u.name},\n\n${product.name} vừa giảm từ ${formatVnd(product.price)} xuống ${formatVnd(product.salePrice!)} (-${pct}%). Hàng sale không nhập lại, nên còn size là còn cơ hội:\n\n${link}\n\nBạn nhận email này vì đã bật báo tin cho món này trong Yêu thích.\n\n— ClothSE`,
      }),
    ),
  );
  return users.length;
}

// ─── Orders (§6.10 #6, #7) ────────────────────────────────────────────────────

/** Tell the shop a new order is waiting for confirmation. */
export async function notifyNewOrder(orderId: number): Promise<void> {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { variant: { include: { sizeOption: { select: { label: true } }, product: { select: { name: true } } } } } },
    },
  });
  if (!o) return;
  const lines = o.items.map((i) => `- ${i.variant.product.name} · ${i.variant.sizeOption.label} × ${i.qty} — ${formatVnd(i.qty * i.unitPrice)}`).join("\n");
  await sendMail({
    to: shopInbox(),
    replyTo: `${o.user.name} <${o.user.email}>`,
    subject: `[ClothSE đơn mới] #${o.code} — ${formatVnd(o.total)}`,
    text: `Có đơn mới đang chờ xác nhận.\n\nĐơn: #${o.code}\nKhách: ${o.user.name} <${o.user.email}>\nGiao đến: ${o.shipName} · ${o.shipPhone}\n${o.shipAddress}\n\n${lines}\n\nTạm tính: ${formatVnd(o.subtotal)}\nPhí ship: ${formatVnd(o.shippingFee)}\nTổng thu khi giao (COD): ${formatVnd(o.total)}\n\nXử lý đơn: ${appUrl(routes.adminOrders)}\n\n— ClothSE`,
  });
}

export type OrderMailEvent = "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED" | "REFUND_REQUESTED" | "REFUND_APPROVED";

const ORDER_MAIL: Record<OrderMailEvent, { tab: BagTab; subject: (code: string) => string; body: (code: string, total: string) => string }> = {
  PROCESSING: {
    tab: "processing",
    subject: (c) => `Đơn #${c} đã được xác nhận`,
    body: (c) => `Shop đã xác nhận đơn #${c} và đang đóng gói cho bạn. Bạn vẫn có thể huỷ đơn trên website cho tới khi hàng được gửi đi.`,
  },
  SHIPPING: {
    tab: "shipping",
    subject: (c) => `Đơn #${c} đang được giao`,
    body: (c, t) => `Đơn #${c} đã rời shop và đang trên đường tới bạn. Bạn chuẩn bị ${t} tiền mặt để thanh toán khi nhận hàng nhé.`,
  },
  COMPLETED: {
    tab: "completed",
    subject: (c) => `Đơn #${c} đã giao thành công`,
    body: (c) => `Đơn #${c} đã giao xong, cảm ơn bạn đã mua hàng. Nếu cần đổi trả, bạn gửi yêu cầu trên website trong vòng 30 ngày.`,
  },
  CANCELLED: {
    tab: "cancelled",
    subject: (c) => `Đơn #${c} đã huỷ`,
    body: (c) => `Đơn #${c} đã được huỷ và bạn không phải thanh toán khoản nào.`,
  },
  REFUND_REQUESTED: {
    tab: "refund",
    subject: (c) => `Đã nhận yêu cầu đổi trả đơn #${c}`,
    body: (c) => `Shop đã nhận yêu cầu đổi trả đơn #${c} và sẽ xem xét sớm.`,
  },
  REFUND_APPROVED: {
    tab: "refund",
    subject: (c) => `Yêu cầu đổi trả đơn #${c} đã được duyệt`,
    body: (c) => `Shop đã duyệt yêu cầu đổi trả đơn #${c} và ghi nhận hoàn tiền.`,
  },
};

/** Tell the customer their order moved. The event comes from the caller, so quick clicks each get their own mail. */
export async function notifyOrderStatus(orderId: number, event: OrderMailEvent): Promise<void> {
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { code: true, total: true, user: { select: { name: true, email: true } } } });
  if (!o) return;
  const mail = ORDER_MAIL[event];
  await sendMail({
    to: o.user.email,
    subject: mail.subject(o.code),
    text: `Chào ${o.user.name},\n\n${mail.body(o.code, formatVnd(o.total))}\n\nXem đơn: ${appUrl(routes.bag(mail.tab))}\n\n— ClothSE`,
  });
}
