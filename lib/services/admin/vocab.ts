import { prisma } from "@/lib/prisma";

export type VocabResult = { ok: true } | { ok: false; error: string };

// ─── Brands ───────────────────────────────────────────────────────────────────

export async function listBrands() {
  const rows = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return rows.map((b) => ({ id: b.id, name: b.name, products: b._count.products }));
}

export async function saveBrand(input: { id?: number; name: string }): Promise<VocabResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a brand name." };
  const clash = await prisma.brand.findFirst({ where: { name: { equals: name, mode: "insensitive" }, NOT: input.id ? { id: input.id } : undefined } });
  if (clash) return { ok: false, error: `"${clash.name}" already exists.` };
  if (input.id) await prisma.brand.update({ where: { id: input.id }, data: { name } });
  else await prisma.brand.create({ data: { name } });
  return { ok: true };
}

/** A brand with products (or batches) cannot go — reassign them first. */
export async function deleteBrand(id: number): Promise<VocabResult> {
  const b = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true, batches: true } } } });
  if (!b) return { ok: false, error: "Brand not found." };
  if (b._count.products > 0 || b._count.batches > 0) return { ok: false, error: `${b.name} still has ${b._count.products} products and ${b._count.batches} batches.` };
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
  if (!label) return { ok: false, error: "Enter a size label." };
  const clash = await prisma.sizeOption.findFirst({ where: { categoryId, label: { equals: label, mode: "insensitive" } } });
  if (clash) return { ok: false, error: `"${clash.label}" already exists in this category.` };
  const last = await prisma.sizeOption.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  await prisma.sizeOption.create({ data: { categoryId, label, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  return { ok: true };
}

export async function renameSize(id: number, rawLabel: string): Promise<VocabResult> {
  const label = rawLabel.trim();
  if (!label) return { ok: false, error: "A size needs a label." };
  const s = await prisma.sizeOption.findUnique({ where: { id } });
  if (!s) return { ok: false, error: "Size not found." };
  const clash = await prisma.sizeOption.findFirst({ where: { categoryId: s.categoryId, label: { equals: label, mode: "insensitive" }, NOT: { id } } });
  if (clash) return { ok: false, error: `"${clash.label}" already exists in this category.` };
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
  if (ids.length !== known.size || ids.some((id) => !known.has(id))) return { ok: false, error: "Size list is out of date — reload and try again." };
  await prisma.$transaction(ids.map((id, i) => prisma.sizeOption.update({ where: { id }, data: { sortOrder: i + 1 } })));
  return { ok: true };
}
