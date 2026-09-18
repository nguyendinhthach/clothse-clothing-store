"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/lib/routes";
import { Logo } from "@/components/layout/Logo";
import type { HeaderUser } from "@/components/layout/SiteHeader";
import styles from "./admin.module.css";

function initials(u: HeaderUser) {
  return (u.name || u.email).trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

/** Store Management header (design): logo + Admin pill, Storefront/Shop/Orders, avatar menu. */
export function AdminHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={`${styles.wide} ${styles.bar}`}>
        <div className={styles.left}>
          <Logo />
          <span className={styles.adminPill}>Admin</span>
          <nav className={styles.nav} aria-label="Liên kết admin">
            <Link href={routes.home}>Trang bán</Link>
            <Link href={routes.shop()}>Cửa hàng</Link>
            <Link href={routes.adminOrders}>Đơn hàng</Link>
          </nav>
        </div>
        <div ref={ref} className={styles.accountWrap}>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Tài khoản" aria-expanded={open} className={styles.avatar}>
            {initials(user)}
          </button>
          {open && (
            <div className={styles.accountMenu}>
              <div className={styles.accountHead}>
                <span className={styles.accountRole}>Đang đăng nhập (admin)</span>
                <span className={styles.accountEmail}>{user.email}</span>
              </div>
              <Link href={routes.account()} className={styles.menuItem}>Tài khoản</Link>
              <Link href={routes.bag("pending")} className={styles.menuItem}>Đơn của tôi</Link>
              <Link href={routes.favourites} className={styles.menuItem}>Yêu thích</Link>
              <form action={routes.signOut} method="post">
                <button type="submit" className={`${styles.menuItem} ${styles.menuSignOut}`}>Đăng xuất</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
