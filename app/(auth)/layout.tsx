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
          <span>←</span>Back to home
        </Link>
      </div>
      <main className={styles.main}>{children}</main>
      <footer className={styles.bottombar}>
        <span>© 2026 ClothSE — multi-brand streetwear</span>
        <span className={styles.bottomLinks}>
          <Link href={routes.faq}>FAQ</Link>
          <Link href={routes.privacy}>Privacy</Link>
          <Link href={routes.shop()}>Shop</Link>
        </span>
      </footer>
    </div>
  );
}
