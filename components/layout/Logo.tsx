import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./Logo.module.css";

/** "Cloth" + skewed accent "SE" wordmark, used in header and footer. */
export function Logo({ size = 26, link = true }: { size?: number; link?: boolean }) {
  const mark = (
    <>
      <span>Cloth</span>
      <span className={styles.se}>SE</span>
    </>
  );
  if (!link) {
    return <span className={styles.logo} style={{ fontSize: size }}>{mark}</span>;
  }
  return (
    <Link href={routes.home} className={`${styles.logo} ${styles.link}`} style={{ fontSize: size }} aria-label="ClothSE home">
      {mark}
    </Link>
  );
}
