import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { notifyRestock } from "@/lib/services/notify";

export type StorageResult = { ok: true } | { ok: false; error: string };

// ─── Table ────────────────────────────────────────────────────────────────────

export type BatchStatus = "Not listed yet" | "Partially listed" | "Fully listed" | "Linked";

export interface BatchRow {
  id: number;
  brand: string;
  category: string;
  size: string;
  item: string;
  linked: boolean;
  productId: number | null;
  variantId: number | null;
  receivedAt: Date;
  qtyReceived: number;
  qtyRemaining: number;
  unitCost: number;
  status: BatchStatus;
}

const rowInclude = {
  brand: { select: { name: true } },
  category: { select: { name: true } },
  sizeOption: { select: { label: true } },
  variant: { select: { id: true, productId: true, product: { select: { name: true } } } },
} satisfies Prisma.BatchInclude;

type Row = Prisma.BatchGetPayload<{ include: typeof rowInclude }>;

/** Unlinked batches use qtyRemaining as "units not yet listed"; linked ones as sellable stock (SPEC §6.4). */
function statusOf(b: Row): BatchStatus {
  if (b.variantId) return "Linked";
  if (b.qtyRemaining === 0) return "Fully listed";
  if (b.qtyRemaining < b.qtyReceived) return "Partially listed";
  return "Not listed yet";
}

function toRow(b: Row): BatchRow {
  return {
    id: b.id,
    brand: b.brand.name,
    category: b.category.name,
    size: b.sizeOption.label,
    item: b.variant?.product.name ?? b.itemDescription ?? "—",
    linked: !!b.variantId,
    productId: b.variant?.productId ?? null,
    variantId: b.variantId,
    receivedAt: b.receivedAt,
    qtyReceived: b.qtyReceived,
    qtyRemaining: b.qtyRemaining,
    unitCost: b.unitCost,
    status: statusOf(b),
  };
}

export interface StorageFilters {
  brand?: string;
  status?: "unlinked" | "linked";
}

export async function listBatches(f: StorageFilters = {}): Promise<BatchRow[]> {
  const where: Prisma.BatchWhereInput = {};
  if (f.brand) where.brand = { name: f.brand };
  if (f.status === "unlinked") where.variantId = null;
  if (f.status === "linked") where.variantId = { not: null };
  const rows = await prisma.batch.findMany({ where, include: rowInclude, orderBy: [{ receivedAt: "desc" }, { id: "desc" }] });
  return rows.map(toRow);
}

export async function getStorageStats(now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [unlinked, thisMonth, total] = await Promise.all([
    prisma.batch.findMany({ where: { variantId: null, qtyRemaining: { gt: 0 } }, select: { qtyRemaining: true, unitCost: true } }),
    prisma.batch.count({ where: { receivedAt: { gte: monthStart } } }),
    prisma.batch.count(),
  ]);
  return {
    unlistedUnits: unlinked.reduce((s, b) => s + b.qtyRemaining, 0),
    unlistedValue: unlinked.reduce((s, b) => s + b.qtyRemaining * b.unitCost, 0),
    awaiting: unlinked.length,
    thisMonth,
    total,
  };
}

/** Every batch ever received for one size of one product, newest first (the "View history" drawer). */
export async function getSizeHistory(variantId: number) {
  const v = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: { select: { name: true } }, sizeOption: { select: { label: true } } } });
  if (!v) return null;
  const batches = await prisma.batch.findMany({ where: { variantId }, include: { brand: { select: { name: true } } }, orderBy: [{ receivedAt: "desc" }, { id: "desc" }] });
  const costs = batches.map((b) => b.unitCost);
  return {
    product: v.product.name,
    size: v.sizeOption.label,
    stock: v.stock,
    avgCost: costs.length ? Math.round(costs.reduce((a, c) => a + c, 0) / costs.length) : 0,
    minCost: costs.length ? Math.min(...costs) : 0,
    maxCost: costs.length ? Math.max(...costs) : 0,
    rows: batches.map((b, i) => ({
      id: b.id,
      receivedAt: b.receivedAt,
      qtyReceived: b.qtyReceived,
      qtyRemaining: b.qtyRemaining,
      unitCost: b.unitCost,
      delta: i + 1 < batches.length ? b.unitCost - batches[i + 1].unitCost : null,
      source: b.brand.name,
    })),
  };
}

// ─── Intake (SPEC §6.5 step 2) ────────────────────────────────────────────────

export interface IntakeLine {
  /** "existing" links to a product size on the spot; "new" stays unlinked until Add Product. */
  mode: "existing" | "new";
  variantId?: number;
  itemDescription?: string;
  categoryId?: number;
  sizeOptionId?: number;
  qty: number;
  unitCost: number;
}

export interface IntakeInput {
  brandId: number;
  receivedAt: string; // YYYY-MM-DD
  lines: IntakeLine[];
}

/**
 * Mark a product restocked when this write took it from fully sold out to
 * in stock (SPEC §6.11 "Restocked" window) and email the people who asked.
 * Returns the product ids to notify; the caller sends after the transaction commits.
 */
async function noteRestock(tx: Prisma.TransactionClient, productId: number, totalBefore: number): Promise<boolean> {
  if (totalBefore > 0) return false;
  const after = await tx.variant.aggregate({ where: { productId }, _sum: { stock: true } });
  if ((after._sum.stock ?? 0) === 0) return false;
  await tx.product.update({ where: { id: productId }, data: { restockedAt: new Date() } });
  return true;
}

export async function receiveStock(input: IntakeInput): Promise<StorageResult> {
  if (!input.lines.length) return { ok: false, error: "Thêm ít nhất một dòng." };
  const receivedAt = new Date(input.receivedAt);
  if (Number.isNaN(receivedAt.getTime())) return { ok: false, error: "Chọn ngày nhận hàng." };
  const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
  if (!brand) return { ok: false, error: "Chọn hãng." };

  for (const [i, l] of input.lines.entries()) {
    if (!Number.isInteger(l.qty) || l.qty <= 0) return { ok: false, error: `Dòng ${i + 1}: số lượng phải là số nguyên lớn hơn 0.` };
    if (!Number.isInteger(l.unitCost) || l.unitCost <= 0) return { ok: false, error: `Dòng ${i + 1}: giá vốn phải là số nguyên (VNĐ).` };
    if (l.mode === "existing" && !l.variantId) return { ok: false, error: `Dòng ${i + 1}: chọn sản phẩm và size.` };
    if (l.mode === "new" && (!l.itemDescription?.trim() || !l.categoryId || !l.sizeOptionId)) return { ok: false, error: `Dòng ${i + 1}: mô tả món hàng và chọn danh mục, size.` };
  }

  const restocked: number[] = [];
  try {
    await prisma.$transaction(async (tx) => {
      for (const [i, l] of input.lines.entries()) {
        if (l.mode === "existing") {
          const v = await tx.variant.findUnique({ where: { id: l.variantId }, include: { product: { select: { id: true, categoryId: true } } } });
          if (!v) throw new Error(`Dòng ${i + 1}: không tìm thấy size sản phẩm — tải lại trang rồi thử lại.`);
          const before = await tx.variant.aggregate({ where: { productId: v.productId }, _sum: { stock: true } });
          await tx.batch.create({
            data: { variantId: v.id, brandId: brand.id, categoryId: v.product.categoryId, sizeOptionId: v.sizeOptionId, receivedAt, qtyReceived: l.qty, qtyRemaining: l.qty, unitCost: l.unitCost },
          });
          await tx.variant.update({ where: { id: v.id }, data: { stock: { increment: l.qty } } });
          if (await noteRestock(tx, v.productId, before._sum.stock ?? 0)) restocked.push(v.productId);
        } else {
          const size = await tx.sizeOption.findUnique({ where: { id: l.sizeOptionId } });
          if (!size || size.categoryId !== l.categoryId) throw new Error(`Dòng ${i + 1}: size không thuộc danh mục đã chọn.`);
          await tx.batch.create({
            data: { brandId: brand.id, categoryId: l.categoryId!, sizeOptionId: size.id, itemDescription: l.itemDescription!.trim(), receivedAt, qtyReceived: l.qty, qtyRemaining: l.qty, unitCost: l.unitCost },
          });
        }
      }
    });
  } catch (e) {
    // Validation failures thrown inside the transaction come back to the form as a message, not a 500.
    if (e instanceof Error && e.message.startsWith("Dòng ")) return { ok: false, error: e.message };
    throw e;
  }

  for (const pid of new Set(restocked)) void notifyRestock(pid);
  return { ok: true };
}

// ─── Linking unlinked batches to a product size (SPEC §6.5 step 3) ────────────

/** Unlinked batches that can feed a given product size: same category and size; same brand unless `anyBrand`. */
export async function getLinkableBatches(opts: { brandId?: number; categoryId: number; sizeLabel: string }) {
  return prisma.batch.findMany({
    where: { variantId: null, qtyRemaining: { gt: 0 }, categoryId: opts.categoryId, sizeOption: { label: opts.sizeLabel }, ...(opts.brandId ? { brandId: opts.brandId } : {}) },
    orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
    select: { id: true, itemDescription: true, receivedAt: true, qtyRemaining: true, unitCost: true, brand: { select: { name: true } } },
  });
}

/**
 * Move `qty` units of an unlinked batch onto a variant. Taking the whole
 * batch relinks the row; taking part of it splits the row so each linked
 * batch keeps one cost and one date for FIFO.
 */
export async function linkBatch(batchId: number, variantId: number, qty: number): Promise<StorageResult> {
  if (!Number.isInteger(qty) || qty <= 0) return { ok: false, error: "Số lượng phải là số nguyên lớn hơn 0." };
  let restockedProduct: number | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      const b = await tx.batch.findUniqueOrThrow({ where: { id: batchId } });
      if (b.variantId) throw new Error("Lô này đã gắn sản phẩm rồi.");
      if (qty > b.qtyRemaining) throw new Error(`Lô này chỉ còn ${b.qtyRemaining} món.`);
      const v = await tx.variant.findUniqueOrThrow({ where: { id: variantId }, include: { product: { select: { categoryId: true } } } });
      if (v.sizeOptionId !== b.sizeOptionId) throw new Error("Size của lô không khớp size sản phẩm.");
      if (v.product.categoryId !== b.categoryId) throw new Error("Danh mục của lô không khớp sản phẩm.");

      const before = await tx.variant.aggregate({ where: { productId: v.productId }, _sum: { stock: true } });
      if (qty === b.qtyRemaining && b.qtyRemaining === b.qtyReceived) {
        await tx.batch.update({ where: { id: b.id }, data: { variantId } });
      } else {
        await tx.batch.update({ where: { id: b.id }, data: { qtyRemaining: { decrement: qty } } });
        await tx.batch.create({
          data: { variantId, brandId: b.brandId, categoryId: b.categoryId, sizeOptionId: b.sizeOptionId, itemDescription: b.itemDescription, receivedAt: b.receivedAt, qtyReceived: qty, qtyRemaining: qty, unitCost: b.unitCost },
        });
      }
      await tx.variant.update({ where: { id: variantId }, data: { stock: { increment: qty } } });
      if (await noteRestock(tx, v.productId, before._sum.stock ?? 0)) restockedProduct = v.productId;
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không gắn được lô hàng." };
  }
  if (restockedProduct) void notifyRestock(restockedProduct);
  return { ok: true };
}

/** Vocab for the intake form: brands, categories with sizes, products with their sizes. */
export async function getIntakeVocab() {
  const [brands, categories, products] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, sizes: { where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, label: true } } } }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, brandId: true, variants: { select: { id: true, stock: true, sizeOption: { select: { label: true, sortOrder: true } } } } },
    }),
  ]);
  return {
    brands,
    categories,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      brandId: p.brandId,
      sizes: p.variants.sort((a, b) => a.sizeOption.sortOrder - b.sizeOption.sortOrder).map((v) => ({ variantId: v.id, label: v.sizeOption.label, stock: v.stock })),
    })),
  };
}

/** Units sitting unlinked in the warehouse per size label, for one product's brand + category (edit form "Restock from warehouse"). */
export async function getWarehouseAvailability(productId: number): Promise<Record<string, number>> {
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { brandId: true, categoryId: true } });
  if (!p) return {};
  const rows = await prisma.batch.groupBy({
    by: ["sizeOptionId"],
    where: { variantId: null, qtyRemaining: { gt: 0 }, brandId: p.brandId, categoryId: p.categoryId },
    _sum: { qtyRemaining: true },
  });
  if (rows.length === 0) return {};
  const sizes = await prisma.sizeOption.findMany({ where: { id: { in: rows.map((r) => r.sizeOptionId) } }, select: { id: true, label: true } });
  const label = new Map(sizes.map((s) => [s.id, s.label]));
  return Object.fromEntries(rows.map((r) => [label.get(r.sizeOptionId)!, r._sum.qtyRemaining ?? 0]));
}

/** Pull `qty` units for a variant from the warehouse, oldest unlinked batch first (may span several batches). */
export async function pullFromWarehouse(variantId: number, qty: number): Promise<StorageResult> {
  const v = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: { select: { brandId: true, categoryId: true } }, sizeOption: { select: { label: true } } } });
  if (!v) return { ok: false, error: "Không tìm thấy size." };
  const batches = await getLinkableBatches({ brandId: v.product.brandId, categoryId: v.product.categoryId, sizeLabel: v.sizeOption.label });
  const available = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  if (qty > available) return { ok: false, error: `Trong kho chỉ còn ${available} × ${v.sizeOption.label}.` };
  let left = qty;
  for (const b of batches) {
    if (left === 0) break;
    const take = Math.min(left, b.qtyRemaining);
    const r = await linkBatch(b.id, variantId, take);
    if (!r.ok) return r;
    left -= take;
  }
  return { ok: true };
}
