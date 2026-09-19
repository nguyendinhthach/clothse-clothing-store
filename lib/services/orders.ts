import { prisma } from "@/lib/prisma";
import { Prisma, type OrderStatus } from "@/lib/generated/prisma/client";
import { shippingFeeFor } from "@/lib/shipping";

export const REFUND_WINDOW_DAYS = 30;

// ─── Bag lines ────────────────────────────────────────────────────────────────

export interface BagLine {
  variantId: number;
  productId: number;
  name: string;
  sku: string;
  size: string;
  qty: number;
  stock: number;
  /** false once the admin takes the product off the shelf — the line cannot be ordered. */
  active: boolean;
  /** Price the customer pays now (sale price if on sale). */
  unitPrice: number;
  image: { url: string; alt: string | null } | null;
}

const lineInclude = {
  variant: {
    include: {
      sizeOption: { select: { label: true } },
      product: {
        select: { id: true, name: true, sku: true, price: true, salePrice: true, onSale: true, active: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } } },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

type CartRow = Prisma.CartItemGetPayload<{ include: typeof lineInclude }>;

const payingPrice = (p: { price: number; salePrice: number | null; onSale: boolean }) => (p.onSale && p.salePrice != null ? p.salePrice : p.price);

function toLine(r: CartRow): BagLine {
  const p = r.variant.product;
  return {
    variantId: r.variantId,
    productId: p.id,
    name: p.name,
    sku: p.sku,
    size: r.variant.sizeOption.label,
    qty: r.qty,
    stock: r.variant.stock,
    active: p.active,
    unitPrice: payingPrice(p),
    image: p.images[0] ?? null,
  };
}

export async function getBagLines(userId: number): Promise<BagLine[]> {
  const rows = await prisma.cartItem.findMany({ where: { userId }, include: lineInclude, orderBy: { id: "asc" } });
  return rows.map(toLine);
}

export async function setCartQty(userId: number, variantId: number, qty: number): Promise<void> {
  if (qty <= 0) {
    await prisma.cartItem.deleteMany({ where: { userId, variantId } });
    return;
  }
  const v = await prisma.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
  const capped = Math.max(1, Math.min(qty, v?.stock ?? 0));
  await prisma.cartItem.updateMany({ where: { userId, variantId }, data: { qty: capped } });
}

export async function removeCartLines(userId: number, variantIds: number[]): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId, variantId: { in: variantIds } } });
}

// ─── Checkout (SPEC §6.3 deduct at order time, §6.4 FIFO COGS, §6.8 fee snapshot) ──

export interface ShipTo {
  name: string;
  phone: string;
  address: string;
}

export type PlaceOrderResult = { ok: true; orderId: number; code: string } | { ok: false; error: string };

/** Next sequential code "CSE-4418" (SPEC §7). Newest row by id, not by code: "CSE-10000" sorts before "CSE-9999" as text. */
async function nextOrderCode(tx: Prisma.TransactionClient): Promise<string> {
  const last = await tx.order.findFirst({ orderBy: { id: "desc" }, select: { code: true } });
  const n = last ? Number(last.code.replace(/\D/g, "")) : 4400;
  return `CSE-${Number.isFinite(n) ? n + 1 : 4401}`;
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/**
 * Turn the chosen bag lines into an order. Everything happens in one
 * transaction: stock is deducted with a guarded update (never below zero,
 * so two buyers cannot both take the last unit), batches are consumed
 * oldest-first and the resulting average cost is frozen into unitCogs.
 */
export async function placeOrder(userId: number, variantIds: number[], ship: ShipTo): Promise<PlaceOrderResult> {
  if (variantIds.length === 0) return { ok: false, error: "Chọn ít nhất một món." };
  if (!ship.name.trim() || !ship.phone.trim() || !ship.address.trim()) return { ok: false, error: "Điền đủ họ tên, số điện thoại và địa chỉ giao hàng." };

  // Two checkouts in the same instant can pick the same code; the unique index
  // rejects the second, and we simply run it again with the next number.
  for (let attempt = 0; ; attempt++) {
    try {
      return await placeOrderOnce(userId, variantIds, ship);
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 2) continue;
      throw e;
    }
  }
}

async function placeOrderOnce(userId: number, variantIds: number[], ship: ShipTo): Promise<PlaceOrderResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.cartItem.findMany({ where: { userId, variantId: { in: variantIds } }, include: lineInclude });
      if (rows.length === 0) return { ok: false as const, error: "Các món này không còn trong giỏ của bạn." };

      const items: { variantId: number; qty: number; unitPrice: number; unitCogs: number }[] = [];
      for (const r of rows) {
        const line = toLine(r);
        if (!line.active) throw new Error(`INACTIVE:${line.name}`);
        // Guarded deduction: fails if stock changed underneath us.
        const dec = await tx.variant.updateMany({ where: { id: line.variantId, stock: { gte: line.qty } }, data: { stock: { decrement: line.qty } } });
        if (dec.count === 0) throw new Error(`OUT_OF_STOCK:${line.name} (${line.size})`);

        // FIFO: oldest batch first.
        const batches = await tx.batch.findMany({ where: { variantId: line.variantId, qtyRemaining: { gt: 0 } }, orderBy: [{ receivedAt: "asc" }, { id: "asc" }] });
        let left = line.qty;
        let cogs = 0;
        for (const b of batches) {
          if (left === 0) break;
          const take = Math.min(left, b.qtyRemaining);
          await tx.batch.update({ where: { id: b.id }, data: { qtyRemaining: { decrement: take } } });
          cogs += take * b.unitCost;
          left -= take;
        }
        if (left > 0) throw new Error(`OUT_OF_STOCK:${line.name} (${line.size})`);
        items.push({ variantId: line.variantId, qty: line.qty, unitPrice: line.unitPrice, unitCogs: Math.round(cogs / line.qty) });
      }

      const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      const shippingFee = shippingFeeFor(subtotal);
      const order = await tx.order.create({
        data: {
          code: await nextOrderCode(tx),
          userId,
          status: "PENDING",
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          shipName: ship.name.trim(),
          shipPhone: ship.phone.trim(),
          shipAddress: ship.address.trim(),
          items: { create: items },
        },
        select: { id: true, code: true },
      });
      await tx.cartItem.deleteMany({ where: { userId, variantId: { in: variantIds } } });
      return { ok: true as const, orderId: order.id, code: order.code };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("OUT_OF_STOCK:")) return { ok: false, error: `Không đủ hàng cho ${msg.slice(13)}. Chỉnh lại số lượng rồi thử lại.` };
    if (msg.startsWith("INACTIVE:")) return { ok: false, error: `${msg.slice(9)} đã ngừng bán — bỏ món này khỏi giỏ rồi đặt lại.` };
    throw e;
  }
}

// ─── Orders (customer side) ───────────────────────────────────────────────────

export interface OrderSummary {
  id: number;
  code: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  createdAt: Date;
  subtotal: number;
  shippingFee: number;
  total: number;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  items: { productId: number; name: string; size: string; qty: number; unitPrice: number; image: { url: string; alt: string | null } | null }[];
  canCancel: boolean;
  canRequestRefund: boolean;
}

const orderInclude = {
  items: {
    include: {
      variant: {
        include: {
          sizeOption: { select: { label: true } },
          product: { select: { id: true, name: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } } } },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/** Days since the order was marked delivered (updatedAt: no write touches a COMPLETED order after that one). */
const daysSinceDelivered = (o: { updatedAt: Date }, now: Date) => (now.getTime() - o.updatedAt.getTime()) / 86_400_000;

function toSummary(o: OrderRow, now: Date): OrderSummary {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    shipName: o.shipName,
    shipPhone: o.shipPhone,
    shipAddress: o.shipAddress,
    items: o.items.map((i) => ({
      productId: i.variant.product.id,
      name: i.variant.product.name,
      size: i.variant.sizeOption.label,
      qty: i.qty,
      unitPrice: i.unitPrice,
      image: i.variant.product.images[0] ?? null,
    })),
    canCancel: o.status === "PENDING" || o.status === "PROCESSING",
    canRequestRefund: o.status === "COMPLETED" && daysSinceDelivered(o, now) <= REFUND_WINDOW_DAYS,
  };
}

export async function listOrders(userId: number, status: OrderStatus, now = new Date()): Promise<OrderSummary[]> {
  const rows = await prisma.order.findMany({ where: { userId, status }, include: orderInclude, orderBy: { createdAt: "desc" } });
  return rows.map((o) => toSummary(o, now));
}

export async function countOrdersByStatus(userId: number): Promise<Record<OrderStatus, number>> {
  const groups = await prisma.order.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } });
  const out = { PENDING: 0, PROCESSING: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0, REFUND: 0 };
  for (const g of groups) out[g.status] = g._count._all;
  return out;
}

/**
 * Put units back on the shelf after a cancel/refund. Per-batch consumption
 * isn't recorded, so units return to the newest batch of that size (or a
 * synthetic one when none exists) — enough to keep stock = Σ remaining true.
 */
export async function restock(tx: Prisma.TransactionClient, variantId: number, qty: number): Promise<void> {
  await tx.variant.update({ where: { id: variantId }, data: { stock: { increment: qty } } });
  const newest = await tx.batch.findFirst({ where: { variantId }, orderBy: [{ receivedAt: "desc" }, { id: "desc" }] });
  if (newest) {
    await tx.batch.update({ where: { id: newest.id }, data: { qtyRemaining: { increment: qty } } });
    return;
  }
  const v = await tx.variant.findUniqueOrThrow({ where: { id: variantId }, include: { product: { select: { brandId: true, categoryId: true, name: true } }, sizeOption: true } });
  await tx.batch.create({
    data: { variantId, brandId: v.product.brandId, categoryId: v.product.categoryId, sizeOptionId: v.sizeOptionId, itemDescription: `${v.product.name} · ${v.sizeOption.label} (returned)`, qtyReceived: qty, qtyRemaining: qty, unitCost: 0 },
  });
}

export type OrderActionResult = { ok: true } | { ok: false; error: string };

/** SPEC §6.1 — customers may cancel while To Confirm / Processing; stock goes back (§6.3). */
export async function cancelOrder(userId: number, orderId: number): Promise<OrderActionResult> {
  return prisma.$transaction(async (tx) => {
    const o = await tx.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
    if (!o) return { ok: false, error: "Không tìm thấy đơn hàng." };
    if (o.status === "CANCELLED") return { ok: false, error: "Đơn này đã huỷ rồi." };
    if (o.status !== "PENDING" && o.status !== "PROCESSING") return { ok: false, error: "Đơn đã rời kho nên không huỷ được nữa." };
    const r = await tx.order.updateMany({ where: { id: o.id, status: o.status }, data: { status: "CANCELLED" } });
    if (r.count === 0) return { ok: false, error: "Đơn vừa đổi trạng thái, tải lại trang nhé." };
    for (const i of o.items) await restock(tx, i.variantId, i.qty);
    return { ok: true };
  });
}

/**
 * SPEC §6.1 — within 30 days of completion the customer can open a return.
 * Status moves to REFUND immediately; money and stock are settled when the
 * admin approves (paymentStatus → REFUNDED, restock).
 */
export async function requestRefund(userId: number, orderId: number, now = new Date()): Promise<OrderActionResult> {
  const o = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!o) return { ok: false, error: "Không tìm thấy đơn hàng." };
  if (o.status !== "COMPLETED") return { ok: false, error: "Chỉ đơn đã hoàn thành mới đổi trả được." };
  if (daysSinceDelivered(o, now) > REFUND_WINDOW_DAYS) return { ok: false, error: `Chỉ nhận đổi trả trong ${REFUND_WINDOW_DAYS} ngày kể từ khi nhận hàng.` };
  // Guarded on COMPLETED so a double click cannot re-open a request the admin already settled.
  const r = await prisma.order.updateMany({ where: { id: o.id, status: "COMPLETED" }, data: { status: "REFUND" } });
  if (r.count === 0) return { ok: false, error: "Đơn vừa đổi trạng thái, tải lại trang nhé." };
  return { ok: true };
}
