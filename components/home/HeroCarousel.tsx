"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";
import styles from "./home.module.css";

export interface HeroSlide {
  /** Placeholder caption until real photography lands; also the image alt. */
  label: string;
  /** Path under /public — omit to show the striped placeholder. */
  src?: string;
  /** Placeholder stripe colours (design gives each look a slightly different tint). */
  tint?: [string, string];
}

const INTERVAL_MS = 4500;

/** Hero look slider: auto-advances, pauses while hovered, honours reduced motion. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const n = slides.length;
  const go = (i: number) => setIndex(((i % n) + n) % n);

  useEffect(() => {
    if (n < 2 || hovered) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | null = null;
    const sync = () => {
      if (timer) clearInterval(timer);
      timer = mq.matches ? null : setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => { if (timer) clearInterval(timer); mq.removeEventListener("change", sync); };
  }, [n, hovered]);

  const caption = `SS26 / LOOK ${String(index + 1).padStart(2, "0")}`;

  return (
    <div className={styles.heroArt} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link href={routes.newArrivals} aria-label="Shop new arrivals" className={styles.heroLink}>
        {slides.map((s, i) => (
          <span
            key={s.label}
            className={`${styles.heroSlide} ${i === index ? styles.heroSlideOn : ""}`}
            style={s.src ? undefined : { background: `repeating-linear-gradient(135deg, ${s.tint?.[0] ?? "#e1deea"} 0 10px, ${s.tint?.[1] ?? "#d3cfe0"} 10px 20px)` }}
            aria-hidden={i !== index}
          >
            {s.src ? <Image src={s.src} alt={s.label} fill sizes="(max-width: 899px) 100vw, 50vw" priority={i === 0} className={styles.heroImg} /> : <span className={styles.heroPh}>{s.label}</span>}
          </span>
        ))}
        <span className={styles.heroTint} />
        <span className={styles.heroTag}>{caption}</span>
      </Link>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous look" className={`${styles.heroArrow} ${styles.heroArrowLeft}`}>←</button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next look" className={`${styles.heroArrow} ${styles.heroArrowRight}`}>→</button>
          <div className={styles.heroDots}>
            {slides.map((s, i) => (
              <button key={s.label} type="button" onClick={() => go(i)} aria-label={`Show look ${i + 1}`} aria-current={i === index ? "true" : undefined} className={`${styles.heroDot} ${i === index ? styles.heroDotOn : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
