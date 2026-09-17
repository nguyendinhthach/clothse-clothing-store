import type { Metadata } from "next";
import { BrandsPanel } from "@/components/admin/BrandsPanel";
import { listBrands } from "@/lib/services/admin/vocab";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  return <BrandsPanel brands={await listBrands()} />;
}
