import type { Metadata } from "next";
import { TypesPanel } from "@/components/admin/TypesPanel";
import { listItemTypeGroups } from "@/lib/services/admin/vocab";

export const metadata: Metadata = { title: "Loại món" };

export default async function AdminTypesPage() {
  return <TypesPanel groups={await listItemTypeGroups()} />;
}
