import type { Metadata } from "next";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { getProductForm, getProductFormVocab, listAdminProducts, type ProductFilters, type ProductFormData } from "@/lib/services/admin/products";

export const metadata: Metadata = { title: "Products" };

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const filters: ProductFilters = {
    q: str(sp.q),
    brand: str(sp.brand),
    category: str(sp.category),
    status: sp.status === "in" || sp.status === "low" || sp.status === "out" ? sp.status : undefined,
    sort: sp.sort === "name" || sp.sort === "stock" ? sp.sort : undefined,
  };
  const [rows, vocab] = await Promise.all([listAdminProducts(filters), getProductFormVocab()]);

  let form: ProductFormData | null = null;
  if (str(sp.edit)) form = await getProductForm(Number(sp.edit));
  else if (sp.new) {
    form = { name: "", brandId: null, categoryId: vocab.categories[0]?.id ?? 0, price: "", onSale: false, salePrice: "", description: "", tags: [], sizes: [], lockedSizes: [], details: [], sizeGuide: [], modelFitNote: "", images: [] };
  }

  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) q.set(k, String(v));

  return <ProductsPanel rows={rows} filters={filters} vocab={vocab} form={form} cloudinaryReady={cloudinaryConfigured} query={q.toString()} />;
}
