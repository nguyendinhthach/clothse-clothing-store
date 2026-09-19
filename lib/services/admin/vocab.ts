import { prisma } from "@/lib/prisma";

export type VocabResult = { ok: true } | { ok: false; error: string };

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function listBrands() {
  const rows = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return rows.map((b) => ({ id: b.id, name: b.name, products: b._count.products }));
}

export async function saveBrand(input: { id?: number; name: string }): Promise<VocabResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nhập tên hãng." };
  const clash = await prisma.brand.findFirst({ where: { name: { equals: name, mode: "insensitive" }, NOT: input.id ? { id: input.id } : undefined } });
  if (clash) return { ok: false, error: `"${clash.name}" đã có rồi.` };
  if (input.id) await prisma.brand.update({ where: { id: input.id }, data: { name } });
  else await prisma.brand.create({ data: { name } });
  return { ok: true };
}

/** A brand with products (or batches) cannot go — reassign them first. */
export async function deleteBrand(id: number): Promise<VocabResult> {
  const b = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true, batches: true } } } });
  if (!b) return { ok: false, error: "Không tìm thấy hãng." };
  if (b._count.products > 0 || b._count.batches > 0) return { ok: false, error: `${b.name} vẫn còn ${b._count.products} sản phẩm và ${b._count.batches} lô hàng.` };
  await prisma.brand.delete({ where: { id } });
  return { ok: true };
}

// ─── Sizes (SPEC §6.5: per-category vocabulary, sort_order set by hand, never hard-deleted) ──

export async function listSizeGroups() {
  const cats = await prisma.category.findMany({
    orderBy: { id: "asc" },
    include: { sizes: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { variants: true } } } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    sizes: c.sizes.map((s) => ({ id: s.id, label: s.label, sortOrder: s.sortOrder, active: s.active, variants: s._count.variants })),
  }));
}

export async function addSize(categoryId: number, rawLabel: string): Promise<VocabResult> {
  const label = rawLabel.trim();
  if (!label) return { ok: false, error: "Nhập tên size." };
  const clash = await prisma.sizeOption.findFirst({ where: { categoryId, label: { equals: label, mode: "insensitive" } } });
  if (clash) return { ok: false, error: `"${clash.label}" đã có trong danh mục này.` };
  const last = await prisma.sizeOption.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  await prisma.sizeOption.create({ data: { categoryId, label, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  return { ok: true };
}

export async function renameSize(id: number, rawLabel: string): Promise<VocabResult> {
  const label = rawLabel.trim();
  if (!label) return { ok: false, error: "Size cần có tên." };
  const s = await prisma.sizeOption.findUnique({ where: { id } });
  if (!s) return { ok: false, error: "Không tìm thấy size." };
  const clash = await prisma.sizeOption.findFirst({ where: { categoryId: s.categoryId, label: { equals: label, mode: "insensitive" }, NOT: { id } } });
  if (clash) return { ok: false, error: `"${clash.label}" đã có trong danh mục này.` };
  await prisma.sizeOption.update({ where: { id }, data: { label } });
  return { ok: true };
}

export async function setSizeActive(id: number, active: boolean): Promise<VocabResult> {
  await prisma.sizeOption.update({ where: { id }, data: { active } });
  return { ok: true };
}

/** Persist a drag-and-drop order: ids in their new display order. */
export async function reorderSizes(categoryId: number, ids: number[]): Promise<VocabResult> {
  const existing = await prisma.sizeOption.findMany({ where: { categoryId }, select: { id: true } });
  const known = new Set(existing.map((s) => s.id));
  if (ids.length !== known.size || ids.some((id) => !known.has(id))) return { ok: false, error: "Danh sách size đã cũ — tải lại rồi thử lại." };
  await prisma.$transaction(ids.map((id, i) => prisma.sizeOption.update({ where: { id }, data: { sortOrder: i + 1 } })));
  return { ok: true };
}

// ─── Item types (SPEC §7: per-category codes that mint SKUs; a code with products is frozen) ──

const CODE_RE = /^[A-Z]{3}$/;

export async function listItemTypeGroups() {
  const cats = await prisma.category.findMany({
    orderBy: { id: "asc" },
    include: { types: { orderBy: { code: "asc" }, include: { _count: { select: { products: true } } } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    types: c.types.map((t) => ({ id: t.id, code: t.code, label: t.label, products: t._count.products })),
  }));
}

/** Suggest a code from a label: first three consonant-ish ASCII letters, e.g. "Váy" → "VAY". */
export function suggestTypeCode(label: string): string {
  const ascii = label.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toUpperCase().replace(/[^A-Z]/g, "");
  return ascii.slice(0, 3);
}

export async function saveItemType(input: { id?: number; categoryId: number; code: string; label: string }): Promise<VocabResult> {
  const label = input.label.trim();
  const code = input.code.trim().toUpperCase();
  if (!label) return { ok: false, error: "Nhập tên loại món." };
  if (!CODE_RE.test(code)) return { ok: false, error: "Mã phải đúng 3 chữ cái A–Z, ví dụ HDY." };
  const existing = input.id ? await prisma.itemType.findUnique({ where: { id: input.id }, include: { _count: { select: { products: true } } } }) : null;
  if (input.id && !existing) return { ok: false, error: "Không tìm thấy loại món." };
  // The code is printed inside every SKU of its products — once used it never changes.
  if (existing && existing._count.products > 0 && (existing.code !== code || existing.categoryId !== input.categoryId)) {
    return { ok: false, error: `${existing.code} đã có ${existing._count.products} sản phẩm — chỉ đổi được tên, không đổi mã hay danh mục.` };
  }
  const codeClash = await prisma.itemType.findFirst({ where: { code, NOT: input.id ? { id: input.id } : undefined } });
  if (codeClash) return { ok: false, error: `Mã ${code} đang dùng cho "${codeClash.label}".` };
  const labelClash = await prisma.itemType.findFirst({ where: { categoryId: input.categoryId, label: { equals: label, mode: "insensitive" }, NOT: input.id ? { id: input.id } : undefined } });
  if (labelClash) return { ok: false, error: `"${labelClash.label}" đã có trong danh mục này.` };
  if (input.id) await prisma.itemType.update({ where: { id: input.id }, data: { code, label, categoryId: input.categoryId } });
  else await prisma.itemType.create({ data: { code, label, categoryId: input.categoryId } });
  return { ok: true };
}

export async function deleteItemType(id: number): Promise<VocabResult> {
  const t = await prisma.itemType.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!t) return { ok: false, error: "Không tìm thấy loại món." };
  if (t._count.products > 0) return { ok: false, error: `${t.label} (${t.code}) vẫn còn ${t._count.products} sản phẩm.` };
  await prisma.itemType.delete({ where: { id } });
  return { ok: true };
}
