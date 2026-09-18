import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { routes } from "@/lib/routes";
import styles from "@/components/auth/auth.module.css";

/** Minimal frame shared by Sign In, Forgot Password and Reset Password (design). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <Logo size={22} />
        <Link href={routes.home} className={styles.backLink}>
          <span>←</span>Về trang chủ
        </Link>
      </div>
      <main className={styles.main}>{children}</main>
      <footer className={styles.bottombar}>
        <span>© 2026 ClothSE — streetwear đa thương hiệu</span>
        <span className={styles.bottomLinks}>
          <Link href={routes.faq}>FAQ</Link>
          <Link href={routes.privacy}>Bảo mật</Link>
          <Link href={routes.shop()}>Cửa hàng</Link>
        </span>
      </footer>
    </div>
  );
}
