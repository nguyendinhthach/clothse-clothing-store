import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { computeBadge, type Badge } from "@/lib/badges";
import { getBestSellerIds } from "@/lib/services/catalog";
import { SKU_TYPES } from "@/lib/sku-codes";
import { notifySale } from "@/lib/services/notify";
import { getWarehouseAvailability } from "@/lib/services/admin/storage";

export type ProductResult = { ok: true; id: number } | { ok: false; error: string };

// ─── Table ────────────────────────────────────────────────────────────────────

export interface AdminProductRow {
  id: number;
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  stock: number;
  badge: Badge;
  image: string | null;
  ordered: boolean;
}

export interface ProductFilters {
  q?: string;
  brand?: string;
  category?: string;
  status?: "in" | "low" | "out";
  sort?: "new" | "name" | "stock";
}

export async function listAdminProducts(f: ProductFilters, now = new Date()): Promise<AdminProductRow[]> {
  const where: Prisma.ProductWhereInput = {};
  if (f.q) where.OR = [{ name: { contains: f.q, mode: "insensitive" } }, { sku: { contains: f.q, mode: "insensitive" } }];
  if (f.brand) where.brand = { name: f.brand };
  if (f.category) where.category = { name: f.category };

  const [rows, best] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: f.sort === "name" ? { name: "asc" } : { createdAt: "desc" },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        variants: { select: { stock: true, _count: { select: { orderItems: true } } } },
      },
    }),
    getBestSellerIds(now),
  ]);

  let items = rows.map<AdminProductRow>((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    brand: p.brand.name,
    category: p.category.name,
    price: p.price,
    salePrice: p.salePrice,
    onSale: p.onSale,
    stock: p.variants.reduce((s, v) => s + v.stock, 0),
    badge: computeBadge({ stocks: p.variants.map((v) => v.stock), onSale: p.onSale, restockedAt: p.restockedAt, createdAt: p.createdAt, isBestSeller: best.has(p.id) }, "default", now),
    image: p.images[0]?.url ?? null,
    ordered: p.variants.some((v) => v._count.orderItems > 0),
  }));

  if (f.status === "in") items = items.filter((p) => p.badge !== "Out of stock" && p.badge !== "Low stock");
  if (f.status === "low") items = items.filter((p) => p.badge === "Low stock");
  if (f.status === "out") items = items.filter((p) => p.badge === "Out of stock");
  if (f.sort === "stock") items.sort((a, b) => a.stock - b.stock);
  return items;
}

// ─── Form data ────────────────────────────────────────────────────────────────

export interface DetailLine {
  label: string;
  value: string;
}
export interface GuideRow {
  size: string;
  chest: string;
  length: string;
  sleeve: string;
}
export interface ProductFormData {
  id?: number;
  name: string;
  sku?: string;
  brandId: number | null;
  categoryId: number;
  typeCode?: string;
  price: number | "";
  onSale: boolean;
  salePrice: number | "";
  description: string;
  tags: string[];
  /** Size labels offered (a Variant each). */
  sizes: string[];
  /** Size labels that cannot be removed (stock or order history). */
  lockedSizes: string[];
  details: DetailLine[];
  sizeGuide: GuideRow[];
  modelFitNote: string;
  images: { url: string; alt: string }[];
  /** Edit mode: unlinked warehouse units per size label for this brand + category. */
  warehouse?: Record<string, number>;
  /** Edit mode: units currently on the shelf (Variant.stock) per size label. */
  shelf?: Record<string, number>;
}

export async function getProductFormVocab() {
  const [brands, categories, tags] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, sizes: { where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } } } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  return {
    brands,
    categories: categories.map((c) => ({ id: c.id, name: c.name, sizes: c.sizes.map((s) => s.label) })),
    tags: tags.map((t) => t.name),
  };
}

const asDetails = (json: unknown): DetailLine[] =>
  Array.isArray(json) ? json.filter((d): d is DetailLine => !!d && typeof d === "object" && "label" in d).map((d) => ({ label: String(d.label ?? ""), value: String(d.value ?? "") })) : [];

const asGuide = (json: unknown): GuideRow[] => {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  return Object.entries(json as Record<string, unknown>).map(([size, v]) => {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    return { size, chest: String(o.chest ?? ""), length: String(o.length ?? ""), sleeve: String(o.sleeve ?? "") };
  });
};

export async function getProductForm(id: number): Promise<ProductFormData | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { sizeOption: true, _count: { select: { orderItems: true, batches: true } } } },
    },
  });
  if (!p) return null;
  const sizes = p.variants.sort((a, b) => a.sizeOption.sortOrder - b.sizeOption.sortOrder);
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    brandId: p.brandId,
    categoryId: p.categoryId,
    price: p.price,
    onSale: p.onSale,
    salePrice: p.salePrice ?? "",
    description: p.description ?? "",
    tags: p.tags.map((t) => t.tag.name),
    sizes: sizes.map((v) => v.sizeOption.label),
    lockedSizes: sizes.filter((v) => v.stock > 0 || v._count.orderItems > 0 || v._count.batches > 0).map((v) => v.sizeOption.label),
    details: asDetails(p.details),
    sizeGuide: asGuide(p.sizeGuide),
    modelFitNote: p.modelFitNote ?? "",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    warehouse: await getWarehouseAvailability(p.id),
    shelf: Object.fromEntries(sizes.map((v) => [v.sizeOption.label, v.stock])),
  };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/** Next free SKU for a type code: CSE-HDY-007 (SPEC §7, sequential per code). */
export async function nextSku(code: string): Promise<string> {
  const rows = await prisma.product.findMany({ where: { sku: { startsWith: `CSE-${code}-` } }, select: { sku: true } });
  const max = rows.reduce((m, r) => Math.max(m, Number(r.sku.split("-")[2]) || 0), 0);
  return `CSE-${code}-${String(max + 1).padStart(3, "0")}`;
}

export type ProductInput = Omit<ProductFormData, "lockedSizes" | "sku" | "warehouse" | "shelf"> & { sku?: string };

export async function saveProduct(input: ProductInput): Promise<ProductResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Cần có tên sản phẩm." };
  if (!input.brandId) return { ok: false, error: "Chọn hãng." };
  const price = Number(input.price);
  if (!Number.isInteger(price) || price <= 0) return { ok: false, error: "Giá phải là số nguyên (VNĐ)." };
  const salePrice = input.onSale ? Number(input.salePrice) : null;
  if (input.onSale && (!Number.isInteger(salePrice) || salePrice! <= 0 || salePrice! >= price)) {
    return { ok: false, error: "Giá sale phải là số nguyên và thấp hơn giá gốc (SPEC §6.11)." }; // on_sale ⇒ sale_price set and < price
  }
  if (!input.id && !SKU_TYPES.some((t) => t.code === input.typeCode)) return { ok: false, error: "Chọn loại món để tạo SKU." };

  const category = await prisma.category.findUnique({ where: { id: input.categoryId }, include: { sizes: true } });
  if (!category) return { ok: false, error: "Không tìm thấy danh mục." };
  const sizeIds = new Map(category.sizes.map((s) => [s.label, s.id]));
  const wanted = [...new Set(input.sizes.map((s) => s.trim()).filter(Boolean))];
  const unknown = wanted.filter((l) => !sizeIds.has(l));
  if (unknown.length) return { ok: false, error: `Size không thuộc ${category.name}: ${unknown.join(", ")}.` };
  if (wanted.length === 0) return { ok: false, error: "Chọn ít nhất một size — sản phẩm không có size thì không bán được." };

  const details = input.details.map((d) => ({ label: d.label.trim(), value: d.value.trim() })).filter((d) => d.label && d.value);
  const sizeGuide: Record<string, { chest: string; length: string; sleeve: string }> = {};
  for (const g of input.sizeGuide) if (g.chest || g.length || g.sleeve) sizeGuide[g.size] = { chest: g.chest, length: g.length, sleeve: g.sleeve };
  const tagNames = [...new Set(input.tags.map((t) => t.trim()).filter(Boolean))];

  const data = {
    name,
    brandId: input.brandId,
    categoryId: category.id,
    price,
    salePrice: input.onSale ? salePrice : null,
    onSale: input.onSale,
    description: input.description.trim() || null,
    details: details.length ? details : undefined,
    sizeGuide: Object.keys(sizeGuide).length ? sizeGuide : undefined,
    modelFitNote: input.modelFitNote.trim() || null,
  };

  let saleTurnedOn = false;
  try {
    const id = await prisma.$transaction(async (tx) => {
      // Tags: create any new names, then replace the join rows (SPEC §6.12 free-form)
      const tags = await Promise.all(tagNames.map((n) => tx.tag.upsert({ where: { name: n }, update: {}, create: { name: n }, select: { id: true } })));

      let productId = input.id;
      if (productId) {
        const existing = await tx.product.findUnique({ where: { id: productId }, select: { categoryId: true, onSale: true } });
        if (!existing) throw new Error("NOT_FOUND");
        saleTurnedOn = input.onSale && !existing.onSale;
        if (existing.categoryId !== category.id) {
          const withHistory = await tx.variant.count({ where: { productId, OR: [{ stock: { gt: 0 } }, { orderItems: { some: {} } }, { batches: { some: {} } }] } });
          if (withHistory > 0) throw new Error("CATEGORY_LOCKED");
        }
        await tx.product.update({ where: { id: productId }, data: { ...data, details: details.length ? details : Prisma.JsonNull, sizeGuide: Object.keys(sizeGuide).length ? sizeGuide : Prisma.JsonNull } });
        await tx.productTag.deleteMany({ where: { productId } });
      } else {
        const created = await tx.product.create({ data: { ...data, sku: await nextSku(input.typeCode!) }, select: { id: true } });
        productId = created.id;
      }
      if (tags.length) await tx.productTag.createMany({ data: tags.map((t) => ({ productId: productId!, tagId: t.id })) });

      // Variants: add missing sizes at stock 0; drop sizes only when nothing references them
      const current = await tx.variant.findMany({ where: { productId }, include: { sizeOption: true, _count: { select: { orderItems: true, batches: true } } } });
      for (const v of current) {
        if (wanted.includes(v.sizeOption.label)) continue;
        if (v.stock > 0 || v._count.orderItems > 0 || v._count.batches > 0) throw new Error(`SIZE_LOCKED:${v.sizeOption.label}`);
        await tx.cartItem.deleteMany({ where: { variantId: v.id } });
        await tx.variant.delete({ where: { id: v.id } });
      }
      const have = new Set(current.map((v) => v.sizeOption.label));
      for (const label of wanted) if (!have.has(label)) await tx.variant.create({ data: { productId, sizeOptionId: sizeIds.get(label)!, stock: 0 } });

      // Images: replace the ordered list (files already live on Cloudinary)
      await tx.productImage.deleteMany({ where: { productId } });
      if (input.images.length) await tx.productImage.createMany({ data: input.images.map((im, i) => ({ productId: productId!, url: im.url, alt: im.alt.trim() || null, sortOrder: i + 1 })) });

      return productId;
    });
    if (saleTurnedOn) void notifySale(id); // SPEC §6.10 #3 — price-drop alert for Favourites with notify on
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return { ok: false, error: "Không tìm thấy sản phẩm." };
    if (msg === "CATEGORY_LOCKED") return { ok: false, error: "Không đổi được danh mục khi size đã có tồn, lô nhập hoặc đơn." };
    if (msg.startsWith("SIZE_LOCKED:")) return { ok: false, error: `Size ${msg.slice(12)} đã có tồn, lô nhập hoặc đơn nên không bỏ được.` };
    throw e;
  }
}

/** Only products that were never ordered can be deleted; the rest keep their history. */
export async function deleteProduct(id: number): Promise<ProductResult> {
  const ordered = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (ordered > 0) return { ok: false, error: "Sản phẩm đã có trong đơn cũ nên không xoá được. Muốn ngừng bán thì đưa tồn mọi size về 0." };
  await prisma.$transaction(async (tx) => {
    await tx.batch.updateMany({ where: { variant: { productId: id } }, data: { variantId: null } }); // batches stay as unlinked stock
    await tx.product.delete({ where: { id } }); // cascades variants, images, tags, favourites, cart lines
  });
  return { ok: true, id };
}
