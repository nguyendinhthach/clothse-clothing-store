import type { Metadata } from "next";
import { StoragePanel } from "@/components/admin/StoragePanel";
import { getIntakeVocab, getStorageStats, listBatches, type StorageFilters } from "@/lib/services/admin/storage";

export const metadata: Metadata = { title: "Kho" };

export default async function AdminStoragePage({ searchParams }: PageProps<"/admin/storage">) {
  const sp = await searchParams;
  const filters: StorageFilters = {
    brand: typeof sp.brand === "string" && sp.brand ? sp.brand : undefined,
    status: sp.status === "unlinked" || sp.status === "linked" ? sp.status : undefined,
  };
  const [rows, stats, vocab] = await Promise.all([listBatches(filters), getStorageStats(), getIntakeVocab()]);
  return <StoragePanel rows={rows} stats={stats} filters={filters} vocab={vocab} />;
}
