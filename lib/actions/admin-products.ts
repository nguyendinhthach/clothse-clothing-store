"use server";

import { revalidatePath } from "next/cache";
import { deleteImage, publicIdFromUrl, uploadProductImage } from "@/lib/cloudinary";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { deleteProduct, saveProduct, setProductActive, type ProductInput, type ProductResult } from "@/lib/services/admin/products";
import { linkBatch, pullFromWarehouse } from "@/lib/services/admin/storage";
import { prisma } from "@/lib/prisma";

/** Warehouse rows submitted with the form: Add mode names a batch, Edit mode a quantity to pull per size. */
export interface WarehouseRow {
  size: string;
  batchId?: number;
  qty: number;
}

function refresh(id?: number) {
  revalidatePath(routes.adminProducts);
  revalidatePath(routes.shop());
  revalidatePath(routes.home);
  if (id) revalidatePath(routes.product(id));
}

export async function saveProductAction(input: ProductInput, warehouse: WarehouseRow[] = []): Promise<ProductResult> {
  await requireAdmin();
  const rows = warehouse.filter((w) => w.qty > 0);
  // Every warehouse row needs its size on the product.
  const sizes = [...new Set([...input.sizes, ...rows.map((w) => w.size)])];
  const r = await saveProduct({ ...input, sizes });
  if (!r.ok) return r;

  for (const w of rows) {
    const v = await prisma.variant.findFirst({ where: { productId: r.id, sizeOption: { label: w.size } }, select: { id: true } });
    if (!v) return { ok: false, error: `Đã lưu, nhưng không tìm thấy size ${w.size} để gắn lô.` };
    const lr = w.batchId ? await linkBatch(w.batchId, v.id, w.qty) : await pullFromWarehouse(v.id, w.qty);
    if (!lr.ok) { refresh(r.id); return { ok: false, error: `Đã lưu, nhưng gắn lô cho size ${w.size} lỗi: ${lr.error}` }; }
  }
  refresh(r.id);
  return r;
}

export async function setProductActiveAction(id: number, active: boolean): Promise<ProductResult> {
  await requireAdmin();
  const r = await setProductActive(id, active);
  if (r.ok) {
    refresh(id);
    revalidatePath(routes.favourites);
    revalidatePath(routes.bag());
  }
  return r;
}

export async function deleteProductAction(id: number): Promise<ProductResult> {
  await requireAdmin();
  const r = await deleteProduct(id);
  if (r.ok) refresh();
  return r;
}

export async function uploadImageAction(fd: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Chưa nhận được file." };
  try {
    const { url } = await uploadProductImage(file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Tải ảnh thất bại." };
  }
}

/** Best-effort cleanup when an image is removed from a product before saving. */
export async function discardImageAction(url: string): Promise<void> {
  await requireAdmin();
  const id = publicIdFromUrl(url);
  if (id) await deleteImage(id);
}
