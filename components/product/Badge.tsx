import { badgeTone, type Badge as BadgeName } from "@/lib/badges";
import styles from "./Badge.module.css";

export function Badge({ badge, className = "" }: { badge: BadgeName; className?: string }) {
  return <span className={`${styles.badge} ${styles[badgeTone(badge)]} ${className}`}>{badge}</span>;
}
