"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { addSize, deleteBrand, deleteItemType, renameSize, reorderSizes, saveBrand, saveItemType, setSizeActive, type VocabResult } from "@/lib/services/admin/vocab";

function after(r: VocabResult, path: string) {
  if (r.ok) {
    revalidatePath(path);
    revalidatePath(routes.shop()); // filters read the vocab
  }
  return r;
}

export async function saveBrandAction(input: { id?: number; name: string }): Promise<VocabResult> {
  await requireAdmin();
  return after(await saveBrand(input), routes.adminBrands);
}
export async function deleteBrandAction(id: number): Promise<VocabResult> {
  await requireAdmin();
  return after(await deleteBrand(id), routes.adminBrands);
}

export async function addSizeAction(categoryId: number, label: string): Promise<VocabResult> {
  await requireAdmin();
  return after(await addSize(categoryId, label), routes.adminSizes);
}
export async function renameSizeAction(id: number, label: string): Promise<VocabResult> {
  await requireAdmin();
  return after(await renameSize(id, label), routes.adminSizes);
}
export async function setSizeActiveAction(id: number, active: boolean): Promise<VocabResult> {
  await requireAdmin();
  return after(await setSizeActive(id, active), routes.adminSizes);
}
export async function reorderSizesAction(categoryId: number, ids: number[]): Promise<VocabResult> {
  await requireAdmin();
  return after(await reorderSizes(categoryId, ids), routes.adminSizes);
}

export async function saveItemTypeAction(input: { id?: number; categoryId: number; code: string; label: string }): Promise<VocabResult> {
  await requireAdmin();
  const r = await saveItemType(input);
  if (r.ok) revalidatePath(routes.adminProducts); // the product form's type list
  return after(r, routes.adminTypes);
}
export async function deleteItemTypeAction(id: number): Promise<VocabResult> {
  await requireAdmin();
  return after(await deleteItemType(id), routes.adminTypes);
}
