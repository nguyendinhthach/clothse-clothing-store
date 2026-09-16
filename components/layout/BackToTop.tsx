"use client";

import { useEffect, useState } from "react";
import styles from "./BackToTop.module.css";

const THRESHOLD = 480;

/** Floating "back to top" button; appears after scrolling past THRESHOLD. */
export function BackToTop() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(window.scrollY > THRESHOLD);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      className={`${styles.btn} ${on ? styles.on : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" aria-hidden="true">
        <path d="M12 20V5" />
        <path d="M5 11.5 12 4.5l7 7" />
      </svg>
    </button>
  );
}
