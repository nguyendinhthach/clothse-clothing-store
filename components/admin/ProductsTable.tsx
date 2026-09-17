"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/lib/actions/admin-products";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { AdminProductRow, ProductFilters } from "@/lib/services/admin/products";
import { Badge } from "@/components/product/Badge";
import styles from "./admin.module.css";

interface Props {
  rows: AdminProductRow[];
  filters: ProductFilters;
  brands: string[];
  categories: string[];
  /** Called with a product id to edit, or null to add. */
  onEdit: (id: number | null) => void;
}

export function ProductsTable({ rows, filters, brands, categories, onEdit }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = (patch: Partial<ProductFilters>) => {
    const f = { ...filters, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) sp.set(k, String(v));
    const q = sp.toString();
    router.replace(routes.adminProducts + (q ? `?${q}` : ""), { scroll: false });
  };

  const low = rows.filter((r) => r.badge === "Low stock" || r.badge === "Out of stock").length;

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <div className={styles.filterRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Search</span>
            <input defaultValue={filters.q ?? ""} placeholder="Product name or SKU…" className={`${styles.input} ${styles.inputSm}`} onKeyDown={(e) => { if (e.key === "Enter") go({ q: (e.target as HTMLInputElement).value.trim() || undefined }); }} onBlur={(e) => { const v = e.target.value.trim() || undefined; if (v !== filters.q) go({ q: v }); }} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Brand</span>
            <select value={filters.brand ?? ""} onChange={(e) => go({ brand: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">All brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Category</span>
            <select value={filters.category ?? ""} onChange={(e) => go({ category: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <select value={filters.status ?? ""} onChange={(e) => go({ status: (e.target.value || undefined) as ProductFilters["status"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">All statuses</option>
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sort by</span>
            <select value={filters.sort ?? "new"} onChange={(e) => go({ sort: e.target.value as ProductFilters["sort"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="new">Newest</option>
              <option value="name">Name A–Z</option>
              <option value="stock">Stock, low first</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={() => onEdit(null)} className={styles.primaryBtn}>Add product</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th className={styles.right}>Price</th>
                <th className={styles.right}>Sale</th>
                <th className={styles.right}>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className={styles.prodCell}>
                      <span className={styles.prodThumb}>
                        {p.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className={styles.thumbImg} />
                        )}
                      </span>
                      <span className={styles.prodText}>
                        <Link href={routes.product(p.id)} className={styles.prodName} target="_blank">{p.name}</Link>
                        <span className={styles.prodSku}>{p.sku}</span>
                      </span>
                    </span>
                  </td>
                  <td>{p.brand}</td>
                  <td className={styles.cellMono}>{p.category}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{formatVnd(p.price)}</td>
                  <td className={`${styles.right} ${styles.cellNum} ${p.onSale ? styles.saleOn : styles.muted}`}>{p.onSale && p.salePrice != null ? formatVnd(p.salePrice) : "—"}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{p.stock}</td>
                  <td><Badge badge={p.badge} /></td>
                  <td>
                    <span className={styles.rowBtns}>
                      <button type="button" onClick={() => onEdit(p.id)} className={styles.smallBtn}>Edit</button>
                      <button
                        type="button"
                        disabled={pending || p.ordered}
                        title={p.ordered ? "On past orders — can't delete" : undefined}
                        onClick={() => { if (confirm(`Delete ${p.name}? Its batches stay in the warehouse as unlinked stock.`)) start(async () => { const r = await deleteProductAction(p.id); setError(r.ok ? null : r.error); router.refresh(); }); }}
                        className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
                      >
                        Delete
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className={styles.tableEmpty}>
            <span className={styles.brandName}>No matching products</span>
            <button type="button" onClick={() => router.replace(routes.adminProducts)} className={styles.smallBtn}>Clear filters</button>
          </div>
        )}
        <div className={styles.tableFoot}>
          <span>{rows.length} {rows.length === 1 ? "product" : "products"}</span>
          <span>{low} need attention</span>
        </div>
      </div>
    </div>
  );
}
