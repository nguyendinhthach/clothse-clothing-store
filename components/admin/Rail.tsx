"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import styles from "./admin.module.css";

export interface RailCounts {
  products: number;
  brands: number;
  sizes: number;
  storage: number;
  orders: number;
}

const SECTIONS: { href: string; label: string; count?: keyof RailCounts }[] = [
  { href: routes.admin, label: "Tổng quan" },
  { href: routes.adminRevenue, label: "Doanh thu" },
  { href: routes.adminBrands, label: "Hãng", count: "brands" },
  { href: routes.adminSizes, label: "Size", count: "sizes" },
  { href: routes.adminStorage, label: "Kho", count: "storage" },
  { href: routes.adminProducts, label: "Sản phẩm", count: "products" },
  { href: routes.adminOrders, label: "Đơn hàng", count: "orders" },
];

export function Rail({ counts }: { counts: RailCounts }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Mục quản lý" className={styles.rail}>
      {SECTIONS.map((s) => {
        const on = s.href === routes.admin ? pathname === routes.admin : pathname.startsWith(s.href);
        return (
          <Link key={s.href} href={s.href} aria-current={on ? "page" : undefined} className={`${styles.railItem} ${on ? styles.railOn : ""}`}>
            <span>{s.label}</span>
            {s.count && <span className={styles.railCount}>{counts[s.count]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
