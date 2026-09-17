"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import type { AdminProductRow, ProductFilters, ProductFormData } from "@/lib/services/admin/products";
import { ProductForm, type FormVocab } from "./ProductForm";
import { ProductsTable } from "./ProductsTable";

interface Props {
  rows: AdminProductRow[];
  filters: ProductFilters;
  vocab: FormVocab;
  /** Present when ?edit=<id> or ?new=1 is in the URL. */
  form: ProductFormData | null;
  cloudinaryReady: boolean;
  /** Current filter query string (without the form params), to return to on close. */
  query: string;
}

export function ProductsPanel({ rows, filters, vocab, form, cloudinaryReady, query }: Props) {
  const router = useRouter();
  const base = routes.adminProducts + (query ? `?${query}` : "");
  const open = (id: number | null) => router.replace(`${base}${query ? "&" : "?"}${id ? `edit=${id}` : "new=1"}`, { scroll: false });
  const close = () => router.replace(base, { scroll: false });

  return (
    <>
      <ProductsTable rows={rows} filters={filters} brands={vocab.brands.map((b) => b.name)} categories={vocab.categories.map((c) => c.name)} onEdit={open} />
      {form && <ProductForm key={form.id ?? "new"} initial={form} vocab={vocab} cloudinaryReady={cloudinaryReady} onClose={close} />}
    </>
  );
}
