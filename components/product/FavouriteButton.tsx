"use client";

import { usePathname } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { toggleFavouriteAction } from "@/lib/actions/favourites";
import styles from "./FavouriteButton.module.css";

interface Props {
  productId: number;
  /** null = guest (clicking redirects to sign-in) */
  favourite: boolean | null;
  className?: string;
  size?: number;
}

export function FavouriteButton({ productId, favourite, className = "", size = 34 }: Props) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(favourite === true);

  return (
    <button
      type="button"
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={on}
      disabled={pending}
      className={`${styles.btn} ${on ? styles.on : ""} ${className}`}
      style={{ width: size, height: size }}
      onClick={(e) => {
        e.preventDefault();
        start(async () => {
          setOn(!on);
          await toggleFavouriteAction(productId, pathname);
        });
      }}
    >
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 20.5 4.6 13.3a4.7 4.7 0 0 1 0-6.7 4.7 4.7 0 0 1 6.7 0l.7.7.7-.7a4.7 4.7 0 0 1 6.7 0 4.7 4.7 0 0 1 0 6.7L12 20.5Z" />
      </svg>
    </button>
  );
}
