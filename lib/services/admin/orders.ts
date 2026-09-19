import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@/lib/generated/prisma/client";
import { restock } from "@/lib/services/orders";

// SPEC §6.1 admin transitions. COMPLETED implies PAID (§6.2): "delivered" and
// "cash collected" are one action.
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { PENDING: "PROCESSING", PROCESSING: "SHIPPING", SHIPPING: "COMPLETED" };

export const PRIMARY_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Xác nhận đơn",
  PROCESSING: "Đã gửi hàng",
  SHIPPING: "Đã giao",
};

export interface AdminOrderRow {
  id: number;
  code: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  createdAt: Date;
  customer: { name: string; email: string };
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  total: number;
  units: number;
  items: { name: string; size: string; qty: number; image: { url: string; alt: string | null } | null }[];
  primaryLabel: string | null;
  canCancel: boolean;
  canApproveRefund: boolean;
}

const include = {
  user: { select: { name: true, email: true } },
  items: {
    include: {
      variant: { include: { sizeOption: { select: { label: true } }, product: { select: { name: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } } } } } },
    },
  },
} satisfies Prisma.OrderInclude;

type Row = Prisma.OrderGetPayload<{ include: typeof include }>;

function toRow(o: Row): AdminOrderRow {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    customer: o.user,
    shipName: o.shipName,
    shipPhone: o.shipPhone,
    shipAddress: o.shipAddress,
    total: o.total,
    units: o.items.reduce((n, i) => n + i.qty, 0),
    items: o.items.map((i) => ({ name: i.variant.product.name, size: i.variant.sizeOption.label, qty: i.qty, image: i.variant.product.images[0] ?? null })),
    primaryLabel: PRIMARY_LABEL[o.status] ?? null,
    canCancel: o.status === "PENDING" || o.status === "PROCESSING",
    canApproveRefund: o.status === "REFUND" && o.paymentStatus === "PAID",
  };
}

export async function listAdminOrders(status: OrderStatus): Promise<AdminOrderRow[]> {
  const rows = await prisma.order.findMany({ where: { status }, include, orderBy: { createdAt: "desc" } });
  return rows.map(toRow);
}

export async function countAdminOrders(): Promise<Record<OrderStatus, number>> {
  const groups = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const out = { PENDING: 0, PROCESSING: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0, REFUND: 0 };
  for (const g of groups) out[g.status] = g._count._all;
  return out;
}

export type AdminOrderResult = { ok: true; status: OrderStatus } | { ok: false; error: string };

/** Move one step down the pipeline. Delivered ⇒ paid, in the same write. */
export async function advanceOrder(orderId: number): Promise<AdminOrderResult> {
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!o) return { ok: false, error: "Không tìm thấy đơn." };
  const next = NEXT[o.status];
  if (!next) return { ok: false, error: "Đơn này không chuyển tiếp được nữa." };
  // Guarded on the status we read, so a double click (or two admins) cannot skip a step.
  const r = await prisma.order.updateMany({
    where: { id: orderId, status: o.status },
    data: { status: next, ...(next === "COMPLETED" ? { paymentStatus: "PAID" } : {}) },
  });
  if (r.count === 0) return { ok: false, error: "Đơn vừa được cập nhật ở nơi khác — tải lại trang." };
  return { ok: true, status: next };
}

/** Admin cancel — same window as the customer (before dispatch); stock returns. */
export async function adminCancelOrder(orderId: number): Promise<AdminOrderResult> {
  return prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!o) return { ok: false, error: "Không tìm thấy đơn." };
    if (o.status !== "PENDING" && o.status !== "PROCESSING") return { ok: false, error: "Chỉ huỷ được đơn Chờ xác nhận / Đang xử lý." };
    const r = await tx.order.updateMany({ where: { id: o.id, status: o.status }, data: { status: "CANCELLED" } });
    if (r.count === 0) return { ok: false, error: "Đơn vừa được cập nhật ở nơi khác — tải lại trang." };
    for (const i of o.items) await restock(tx, i.variantId, i.qty);
    return { ok: true, status: "CANCELLED" };
  });
}

/** Settle a return: money back (REFUNDED) and units back on the shelf (§6.3). */
export async function approveRefund(orderId: number): Promise<AdminOrderResult> {
  return prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!o) return { ok: false, error: "Không tìm thấy đơn." };
    if (o.status !== "REFUND" || o.paymentStatus !== "PAID") return { ok: false, error: "Đơn này không có yêu cầu đổi trả đang mở." };
    const r = await tx.order.updateMany({ where: { id: o.id, status: "REFUND", paymentStatus: "PAID" }, data: { paymentStatus: "REFUNDED" } });
    if (r.count === 0) return { ok: false, error: "Đơn vừa được cập nhật ở nơi khác — tải lại trang." };
    for (const i of o.items) await restock(tx, i.variantId, i.qty);
    return { ok: true, status: "REFUND" };
  });
}
