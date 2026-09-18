"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryLabel } from "@/lib/catalog-constants";
import { routes } from "@/lib/routes";
import { Logo } from "./Logo";
import styles from "./SiteHeader.module.css";

export interface HeaderUser {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface Props {
  categories: { name: string; count: number }[];
  user: HeaderUser | null;
  cartCount: number;
}

function initials(user: HeaderUser) {
  return (user.name || user.email)
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function SiteHeader({ categories, user, cartCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close everything on navigation (state adjusted during render, per React docs)
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setShopOpen(false);
    setMenuOpen(false);
    setAccountOpen(false);
  }

  // Click outside closes the account menu
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [accountOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const isAdmin = user?.role === "ADMIN";
  const active = (href: string) => (pathname === href ? styles.active : "");

  const shopLinks = categories.map((c, i) => ({
    label: categoryLabel(c.name),
    count: c.count,
    href: routes.shop({ cat: c.name }),
    delay: `${40 + i * 40}ms`,
  }));

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (q) router.push(routes.shop({ q }));
    setSearchOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <div className={styles.left}>
          <Logo />

          <nav className={styles.nav} aria-label="Chính">
            <Link href={routes.home} className={`${styles.navLink} ${active(routes.home)}`}>
              Trang chủ<span className={styles.underline} />
            </Link>
            <Link href={routes.newArrivals} className={`${styles.navLink} ${active(routes.newArrivals)}`}>
              Hàng mới<span className={styles.underline} />
            </Link>
            <div className={styles.shopWrap} onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
              <Link href={routes.shop()} className={`${styles.navLink} ${styles.shopLink} ${pathname === "/shop" ? styles.active : ""}`}>
                Cửa hàng <span className={`${styles.arrow} ${shopOpen ? styles.arrowOpen : ""}`}>▼</span>
                <span className={styles.underline} />
              </Link>
              {shopOpen && (
                <div className={styles.dropdown}>
                  {shopLinks.map((l) => (
                    <Link key={l.label} href={l.href} className={styles.dropItem} style={{ animationDelay: l.delay }}>
                      <span>{l.label}</span>
                      <span className={styles.dropCount}>{l.count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href={routes.sale} className={styles.saleLink}>
              Sale
            </Link>
          </nav>
        </div>

        <div className={styles.right}>
          {searchOpen && (
            <form onSubmit={submitSearch} className={styles.searchForm}>
              <input ref={searchRef} name="q" placeholder="Tìm cargo, tee, giày…" className={styles.searchInput} aria-label="Tìm sản phẩm" />
            </form>
          )}
          <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-label="Tìm kiếm" className={styles.iconBtn}>
            ⌕
          </button>

          <Link href={routes.bag()} aria-label="Giỏ hàng" className={styles.bagBtn}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
              <path d="M4 7h16l-1.4 12.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8L4 7Z" />
              <path d="M8.5 7V5.6A3.5 3.5 0 0 1 12 2.1a3.5 3.5 0 0 1 3.5 3.5V7" />
            </svg>
            {cartCount > 0 && <span className={styles.bagCount}>{cartCount}</span>}
          </Link>

          {!user && (
            <Link href={routes.signIn} className={styles.loginBtn}>
              Đăng nhập
            </Link>
          )}

          {user && (
            <div ref={accountRef} className={styles.accountWrap}>
              <button type="button" onClick={() => setAccountOpen((v) => !v)} aria-label="Tài khoản" aria-expanded={accountOpen} className={styles.avatar}>
                {initials(user)}
              </button>
              {accountOpen && (
                <div className={styles.accountMenu}>
                  <div className={styles.accountHead}>
                    <div className={styles.accountRole}>{isAdmin ? "Đang đăng nhập (admin)" : "Đang đăng nhập"}</div>
                    <div className={styles.accountEmail}>{user.email}</div>
                  </div>
                  <Link href={routes.account()} className={styles.menuItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c0-3.6 3.2-5.6 7.2-5.6s7.2 2 7.2 5.6" /></svg>
                    Tài khoản
                  </Link>
                  <Link href={routes.bag("pending")} className={styles.menuItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><path d="M4.5 6.5h15v13h-15z" /><path d="M8.5 6.5V4.2h7v2.3" /><path d="M8.5 11h7" /></svg>
                    Đơn hàng
                  </Link>
                  <Link href={routes.favourites} className={styles.menuItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" /></svg>
                    Yêu thích
                  </Link>
                  <Link href={routes.account("settings")} className={styles.menuItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 3.4v2.2M12 18.4v2.2M4.6 12h2.2M17.2 12h2.2M6.6 6.6l1.6 1.6M15.8 15.8l1.6 1.6M17.4 6.6l-1.6 1.6M8.2 15.8l-1.6 1.6" /></svg>
                    Cài đặt
                  </Link>
                  {isAdmin ? (
                    <Link href={routes.admin} className={`${styles.menuItem} ${styles.menuAdmin}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><path d="M4 9.5h16v10.5H4z" /><path d="M4 9.5 6 4h12l2 5.5" /><path d="M9.5 20v-5.5h5V20" /></svg>
                      Quản lý cửa hàng
                    </Link>
                  ) : (
                    <span className={styles.menuRule} />
                  )}
                  <form action={routes.signOut} method="post">
                    <button type="submit" className={`${styles.menuItem} ${styles.menuSignOut}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true"><path d="M14.5 4.5h-9v15h9" /><path d="M18.5 12h-8" /><path d="m15.5 9 3 3-3 3" /></svg>
                      Đăng xuất
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen} className={styles.burger}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className={styles.mobileNav} aria-label="Di động">
          <Link href={routes.home} className={styles.mobileLink}>Trang chủ</Link>
          <Link href={routes.newArrivals} className={styles.mobileLink}>Hàng mới</Link>
          <div className={styles.mobileGroup}>
            <div className={styles.mobileTitle}>Cửa hàng</div>
            <div className={styles.mobileChips}>
              {shopLinks.map((l) => (
                <Link key={l.label} href={l.href} className={styles.chip}>{l.label}</Link>
              ))}
            </div>
          </div>
          <Link href={routes.sale} className={`${styles.mobileLink} ${styles.mobileSale}`}>
            <span>Sale</span>
          </Link>
          {!user && (
            <Link href={routes.signIn} className={styles.mobileLogin}>Đăng nhập / Đăng ký</Link>
          )}
        </nav>
      )}
    </header>
  );
}
