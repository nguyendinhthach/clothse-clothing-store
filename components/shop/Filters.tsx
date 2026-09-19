"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categoryLabel, PRICE_MAX, PRICE_MIN, PRICE_STEP, tagLabel } from "@/lib/catalog-constants";
import { formatVnd } from "@/lib/format";
import { buildShopQuery, filtersActive, type ShopParams } from "@/lib/shop-params";
import styles from "./shop.module.css";

interface Facets {
  categories: string[];
  types: { code: string; label: string; category: string; count: number }[];
  tags: string[];
  brands: { name: string; count: number }[];
}

interface Props {
  basePath: string;
  params: ShopParams;
  facets: Facets;
  total: number;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function Filters({ basePath, params, facets, total }: Props) {
  const router = useRouter();
  // Any filter change resets "show" back to the first page.
  const go = (patch: Partial<ShopParams>) => router.replace(basePath + buildShopQuery({ ...params, ...patch, show: undefined }), { scroll: false });
  // Picking a category narrows the type list to that category; a type outside the new selection is dropped.
  const typesShown = params.cats.length ? facets.types.filter((t) => params.cats.includes(t.category)) : facets.types;
  const pickCategory = (c: string) => {
    const cats = toggle(params.cats, c);
    const allowed = new Set(facets.types.filter((t) => !cats.length || cats.includes(t.category)).map((t) => t.code));
    go({ cats, types: params.types.filter((code) => allowed.has(code)) });
  };

  return (
    <aside className={styles.aside}>
      <div className={styles.asideHead}>
        <span className={styles.asideTitle}>Bộ lọc</span>
        <span className={styles.asideCount}>{total} sản phẩm</span>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Danh mục</span>
        <div className={styles.pills}>
          {facets.categories.map((c) => (
            <button key={c} type="button" onClick={() => pickCategory(c)} className={`${styles.pill} ${params.cats.includes(c) ? styles.pillOn : ""}`}>
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      {typesShown.length > 0 && (
        <div className={styles.group}>
          <span className={styles.groupLabel}>Loại</span>
          <div className={styles.pills}>
            {typesShown.map((t) => (
              <button key={t.code} type="button" onClick={() => go({ types: toggle(params.types, t.code) })} className={`${styles.pill} ${params.types.includes(t.code) ? styles.pillOn : ""}`} title={`${t.count} sản phẩm`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.group}>
        <span className={styles.groupLabel}>Đặc điểm</span>
        <div className={styles.pills}>
          {facets.tags.map((t) => (
            <button key={t} type="button" onClick={() => go({ tags: toggle(params.tags, t) })} className={`${styles.pill} ${params.tags.includes(t) ? styles.pillOn : ""}`}>
              {tagLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Hãng</span>
        <div className={styles.brandList}>
          {facets.brands.map((b) => {
            const on = params.brands.includes(b.name);
            return (
              <button key={b.name} type="button" onClick={() => go({ brands: toggle(params.brands, b.name) })} className={styles.brandRow} aria-pressed={on}>
                <span className={`${styles.box} ${on ? styles.boxOn : ""}`}>{on ? "✓" : ""}</span>
                <span className={styles.brandName}>{b.name}</span>
                <span className={styles.brandCount}>{b.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Giá</span>
        <PriceRange min={params.min} max={params.max} onCommit={(min, max) => go({ min, max })} />
      </div>

      {filtersActive(params) && (
        <button type="button" onClick={() => router.replace(basePath, { scroll: false })} className={styles.clear}>
          Xoá bộ lọc
        </button>
      )}
    </aside>
  );
}

// ─── Two-thumb price slider (ported from the design's pointer logic) ─────────

function PriceRange({ min, max, onCommit }: { min: number; max: number; onCommit: (min: number, max: number) => void }) {
  const [range, setRange] = useState({ min, max });
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<"min" | "max" | null>(null);
  // Window listeners are attached once; they read the latest values through refs
  // so a commit uses the current range AND the current filters (onCommit closes over them).
  const latest = useRef(range);
  const commit = useRef(onCommit);
  useEffect(() => {
    latest.current = range;
    commit.current = onCommit;
  });

  // Keep local thumbs in sync when the URL changes elsewhere (e.g. Clear filters).
  const [seen, setSeen] = useState({ min, max });
  if (seen.min !== min || seen.max !== max) {
    setSeen({ min, max });
    setRange({ min, max });
  }

  const pct = (v: number) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const valueAt = (clientX: number) => {
    const el = track.current;
    if (!el) return PRICE_MIN;
    const r = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round((PRICE_MIN + t * (PRICE_MAX - PRICE_MIN)) / PRICE_STEP) * PRICE_STEP;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const v = valueAt(e.clientX);
      setRange((s) => (drag.current === "min" ? { ...s, min: Math.min(v, s.max - PRICE_STEP) } : { ...s, max: Math.max(v, s.min + PRICE_STEP) }));
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      commit.current(latest.current.min, latest.current.max);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function startDrag(which: "min" | "max", e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    drag.current = which;
  }
  const onTrackDown = (e: React.PointerEvent) => {
    const v = valueAt(e.clientX);
    const which = Math.abs(v - range.min) <= Math.abs(v - range.max) ? "min" : "max";
    drag.current = which;
    setRange((s) => (which === "min" ? { ...s, min: Math.min(v, s.max - PRICE_STEP) } : { ...s, max: Math.max(v, s.min + PRICE_STEP) }));
  };

  return (
    <div className={styles.priceWrap}>
      <div ref={track} onPointerDown={onTrackDown} className={styles.track}>
        <span className={styles.rail} />
        <span className={styles.railOn} style={{ left: `${pct(range.min)}%`, right: `${100 - pct(range.max)}%` }} />
        <span role="slider" aria-label="Giá thấp nhất" aria-valuemin={PRICE_MIN} aria-valuemax={PRICE_MAX} aria-valuenow={range.min} tabIndex={0} onPointerDown={(e) => startDrag("min", e)} className={`${styles.thumb} ${styles.thumbMin}`} style={{ left: `${pct(range.min)}%` }} />
        <span role="slider" aria-label="Giá cao nhất" aria-valuemin={PRICE_MIN} aria-valuemax={PRICE_MAX} aria-valuenow={range.max} tabIndex={0} onPointerDown={(e) => startDrag("max", e)} className={`${styles.thumb} ${styles.thumbMax}`} style={{ right: `${100 - pct(range.max)}%` }} />
      </div>
      <div className={styles.priceLabels}>
        <span>{formatVnd(range.min)}</span>
        <span className={styles.priceMax}>{range.max >= PRICE_MAX ? `${formatVnd(PRICE_MAX)}+` : formatVnd(range.max)}</span>
      </div>
    </div>
  );
}
