"use server";

import { revalidatePath } from "next/cache";
import { deleteImage, publicIdFromUrl, uploadProductImage } from "@/lib/cloudinary";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { deleteProduct, saveProduct, type ProductInput, type ProductResult } from "@/lib/services/admin/products";

function refresh(id?: number) {
  revalidatePath(routes.adminProducts);
  revalidatePath(routes.shop());
  revalidatePath(routes.home);
  if (id) revalidatePath(routes.product(id));
}

export async function saveProductAction(input: ProductInput): Promise<ProductResult> {
  await requireAdmin();
  const r = await saveProduct(input);
  if (r.ok) refresh(r.id);
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
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  try {
    const { url } = await uploadProductImage(file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

/** Best-effort cleanup when an image is removed from a product before saving. */
export async function discardImageAction(url: string): Promise<void> {
  await requireAdmin();
  const id = publicIdFromUrl(url);
  if (id) await deleteImage(id);
}
