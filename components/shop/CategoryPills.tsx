import Link from "next/link";
import styles from "./shop.module.css";

interface Props {
  basePath: string;
  categories: string[];
  active: string | null;
  /** Query params to keep when switching category (e.g. sort). */
  keep?: Record<string, string | undefined>;
}

/** Round single-select category pills used by New Arrivals and Sale. */
export function CategoryPills({ basePath, categories, active, keep = {} }: Props) {
  const href = (cat: string | null) => {
    const sp = new URLSearchParams();
    if (cat) sp.set("cat", cat);
    for (const [k, v] of Object.entries(keep)) if (v) sp.set(k, v);
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  return (
    <div className={styles.roundPills}>
      <span className={styles.groupLabel} style={{ marginRight: 4 }}>Category</span>
      <Link href={href(null)} className={`${styles.roundPill} ${!active ? styles.roundPillOn : ""}`}>All</Link>
      {categories.map((c) => (
        <Link key={c} href={href(c)} className={`${styles.roundPill} ${active === c ? styles.roundPillOn : ""}`}>{c}</Link>
      ))}
    </div>
  );
}
