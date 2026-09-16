import styles from "./Placeholder.module.css";

/** Striped stand-in used wherever a product has no image yet (design placeholder). */
export function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`${styles.ph} ${className}`} aria-hidden="true">
      <span className={styles.label}>{label}</span>
    </span>
  );
}
