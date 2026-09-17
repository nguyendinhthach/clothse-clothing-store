"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { getLinkableBatches, getSizeHistory, linkBatch, receiveStock, type IntakeInput, type StorageResult } from "@/lib/services/admin/storage";

function refresh() {
  revalidatePath(routes.adminStorage);
  revalidatePath(routes.adminProducts);
  revalidatePath(routes.shop());
  revalidatePath(routes.home);
}

export async function receiveStockAction(input: IntakeInput): Promise<StorageResult> {
  await requireAdmin();
  const r = await receiveStock(input);
  if (r.ok) refresh();
  return r;
}

export async function linkBatchAction(batchId: number, variantId: number, qty: number): Promise<StorageResult> {
  await requireAdmin();
  const r = await linkBatch(batchId, variantId, qty);
  if (r.ok) refresh();
  return r;
}

export async function sizeHistoryAction(variantId: number) {
  await requireAdmin();
  return getSizeHistory(variantId);
}

export async function linkableBatchesAction(opts: { brandId?: number; categoryId: number; sizeLabel: string }) {
  await requireAdmin();
  return getLinkableBatches(opts);
}
