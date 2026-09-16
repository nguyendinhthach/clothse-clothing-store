import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProductCardData } from "@/lib/services/catalog";
import { Badge } from "./Badge";
import { FavouriteButton } from "./FavouriteButton";
import { Placeholder } from "./Placeholder";
import styles from "./ProductCard.module.css";

interface Props {
  product: ProductCardData;
  /**
   * "tall"   — homepage arrivals: 4:5, meta line + CTA in the body
   * "square" — homepage best sellers: 1:1, CTA slides up on hover
   * "grid"   — listing pages: 4:5, brand/category lines, heart, CTA slides up
   */
  variant?: "tall" | "square" | "grid";
  /** true/false when signed in, null for guests, undefined to hide the heart. */
  favourite?: boolean | null;
  className?: string;
}

function sizesLine(sizes: string[]) {
  if (sizes.length === 0) return "Sold out";
  return sizes.join(" · ");
}

export function ProductCard({ product: p, variant = "tall", favourite, className = "" }: Props) {
  const href = routes.product(p.id);
  const price = p.onSale && p.salePrice != null ? p.salePrice : p.price;
  const cta = p.sizesInStock.length ? "Add to bag" : "Sold out";

  return (
    <article className={`${styles.card} ${className}`}>
      <div className={`${styles.media} ${variant === "square" ? styles.square : styles.tall}`}>
        <Link href={href} className={styles.zoom} aria-label={p.name}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote host list is set up in the Cloudinary step
            <img src={p.image.url} alt={p.image.alt ?? p.name} className={styles.img} />
          ) : (
            <Placeholder label={p.name} />
          )}
        </Link>
        <Badge badge={p.badge} className={styles.badge} />
        {favourite !== undefined && <FavouriteButton productId={p.id} favourite={favourite} className={styles.heart} />}
        {variant === "tall" ? (
          <span className={styles.sizes}>{sizesLine(p.sizesInStock)}</span>
        ) : (
          <Link href={href} className={styles.revealCta}>{cta}</Link>
        )}
      </div>

      <div className={variant === "tall" ? styles.body : styles.bodyCompact}>
        {variant === "grid" && <span className={styles.meta}>{p.brand}</span>}
        <div className={styles.row}>
          <h3 className={styles.name}>
            <Link href={href}>{p.name}</Link>
          </h3>
          <span className={styles.price}>
            {formatVnd(price)}
            {p.onSale && p.salePrice != null && <s className={styles.was}>{formatVnd(p.price)}</s>}
          </span>
        </div>
        {variant === "grid" && <span className={styles.meta}>{p.category}</span>}
        {variant === "tall" && (
          <>
            <span className={styles.meta}>
              {p.brand} / {p.category}
            </span>
            <Link href={href} className={styles.cta}>{cta}</Link>
          </>
        )}
      </div>
    </article>
  );
}
