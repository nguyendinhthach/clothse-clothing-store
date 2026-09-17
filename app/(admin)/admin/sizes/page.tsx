import type { Metadata } from "next";
import { SizesPanel } from "@/components/admin/SizesPanel";
import { listSizeGroups } from "@/lib/services/admin/vocab";

export const metadata: Metadata = { title: "Sizes" };

export default async function AdminSizesPage() {
  return <SizesPanel groups={await listSizeGroups()} />;
}
