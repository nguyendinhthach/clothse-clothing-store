"use client";

import { useRef, useState } from "react";
import type { Badge as BadgeName } from "@/lib/badges";
import { Badge } from "./Badge";
import { Placeholder } from "./Placeholder";
import styles from "./Gallery.module.css";

interface Props {
  name: string;
  images: { url: string; alt: string | null }[];
  badge: BadgeName;
}

const PER_VIEW = 5;

/** Main image + thumbnail strip. Adapts to any count; zero images shows one placeholder. */
export function Gallery({ name, images, badge }: Props) {
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const count = Math.max(1, images.length);
  const idx = Math.min(active, count - 1);
  const scrolls = count > PER_VIEW;
  const cols = Math.min(count, PER_VIEW);

  const scroll = (dir: -1 | 1) => strip.current?.scrollBy({ left: dir * Math.round(strip.current.clientWidth * 0.7), behavior: "smooth" });

  const render = (i: number, cls: string) =>
    images[i] ? (
      // eslint-disable-next-line @next/next/no-img-element -- remote host list is set up in the Cloudinary step
      <img src={images[i].url} alt={images[i].alt ?? `${name} — image ${i + 1}`} className={cls} />
    ) : (
      <Placeholder label={`${name} — shot ${String(i + 1).padStart(2, "0")}`} />
    );

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <span key={idx} className={styles.swap}>{render(idx, styles.img)}</span>
        <Badge badge={badge} className={styles.badge} />
        <span className={styles.counter}>
          {String(idx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>

      {count > 1 && (
        <div className={styles.stripWrap}>
          <div ref={strip} className={styles.strip} style={{ gridAutoColumns: `calc((100% - ${(cols - 1) * 12}px) / ${cols})` }}>
            {Array.from({ length: count }, (_, i) => (
              <button key={i} type="button" onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === idx} className={`${styles.thumb} ${i === idx ? styles.thumbOn : ""}`}>
                {render(i, styles.img)}
              </button>
            ))}
          </div>
          {scrolls && (
            <>
              <span className={`${styles.fade} ${styles.fadeL}`} />
              <span className={`${styles.fade} ${styles.fadeR}`} />
              <button type="button" onClick={() => scroll(-1)} aria-label="Previous images" className={`${styles.stripBtn} ${styles.stripBtnL}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true"><path d="m14.5 5.5-7 6.5 7 6.5" /></svg>
              </button>
              <button type="button" onClick={() => scroll(1)} aria-label="More images" className={`${styles.stripBtn} ${styles.stripBtnR}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden="true"><path d="m9.5 5.5 7 6.5-7 6.5" /></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
