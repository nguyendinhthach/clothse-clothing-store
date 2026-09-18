"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/lib/actions/admin-products";
import { categoryLabel } from "@/lib/catalog-constants";
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
            <span className={styles.fieldLabel}>Tìm</span>
            <input defaultValue={filters.q ?? ""} placeholder="Tên sản phẩm hoặc SKU…" className={`${styles.input} ${styles.inputSm}`} onKeyDown={(e) => { if (e.key === "Enter") go({ q: (e.target as HTMLInputElement).value.trim() || undefined }); }} onBlur={(e) => { const v = e.target.value.trim() || undefined; if (v !== filters.q) go({ q: v }); }} />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Hãng</span>
            <select value={filters.brand ?? ""} onChange={(e) => go({ brand: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">Mọi hãng</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Danh mục</span>
            <select value={filters.category ?? ""} onChange={(e) => go({ category: e.target.value || undefined })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">Mọi danh mục</option>
              {categories.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Trạng thái</span>
            <select value={filters.status ?? ""} onChange={(e) => go({ status: (e.target.value || undefined) as ProductFilters["status"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="">Mọi trạng thái</option>
              <option value="in">Còn hàng</option>
              <option value="low">Sắp hết</option>
              <option value="out">Hết hàng</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sắp xếp</span>
            <select value={filters.sort ?? "new"} onChange={(e) => go({ sort: e.target.value as ProductFilters["sort"] })} className={`${styles.input} ${styles.inputSm}`}>
              <option value="new">Mới nhất</option>
              <option value="name">Tên A–Z</option>
              <option value="stock">Tồn ít trước</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={() => onEdit(null)} className={styles.primaryBtn}>Thêm sản phẩm</button>
      </div>
      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableWrap}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Hãng</th>
                <th>Danh mục</th>
                <th className={styles.right}>Giá</th>
                <th className={styles.right}>Giá sale</th>
                <th className={styles.right}>Tồn</th>
                <th>Trạng thái</th>
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
                  <td className={styles.cellMono}>{categoryLabel(p.category)}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{formatVnd(p.price)}</td>
                  <td className={`${styles.right} ${styles.cellNum} ${p.onSale ? styles.saleOn : styles.muted}`}>{p.onSale && p.salePrice != null ? formatVnd(p.salePrice) : "—"}</td>
                  <td className={`${styles.right} ${styles.cellNum}`}>{p.stock}</td>
                  <td><Badge badge={p.badge} /></td>
                  <td>
                    <span className={styles.rowBtns}>
                      <button type="button" onClick={() => onEdit(p.id)} className={styles.smallBtn}>Sửa</button>
                      <button
                        type="button"
                        disabled={pending || p.ordered}
                        title={p.ordered ? "Đã có trong đơn cũ — không xoá được" : undefined}
                        onClick={() => { if (confirm(`Xoá ${p.name}? Các lô nhập vẫn nằm trong kho dưới dạng chưa gắn.`)) start(async () => { const r = await deleteProductAction(p.id); setError(r.ok ? null : r.error); router.refresh(); }); }}
                        className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
                      >
                        Xoá
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
            <span className={styles.brandName}>Không có sản phẩm khớp</span>
            <button type="button" onClick={() => router.replace(routes.adminProducts)} className={styles.smallBtn}>Xoá bộ lọc</button>
          </div>
        )}
        <div className={styles.tableFoot}>
          <span>{rows.length} sản phẩm</span>
          <span>{low} cần chú ý</span>
        </div>
      </div>
    </div>
  );
}
