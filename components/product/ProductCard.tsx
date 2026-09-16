import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ProductCardData } from "@/lib/services/catalog";
import { Badge } from "./Badge";
import { Placeholder } from "./Placeholder";
import styles from "./ProductCard.module.css";

interface Props {
  product: ProductCardData;
  /** "tall" = 4:5 image with meta + button (design arrivals card); "square" = 1:1 with hover button. */
  variant?: "tall" | "square";
  className?: string;
}

function sizesLine(sizes: string[]) {
  if (sizes.length === 0) return "Sold out";
  return sizes.join(" · ");
}

export function ProductCard({ product: p, variant = "tall", className = "" }: Props) {
  const href = routes.product(p.id);
  const price = p.onSale && p.salePrice != null ? p.salePrice : p.price;

  return (
    <article className={`${styles.card} ${className}`}>
      <Link href={href} className={`${styles.media} ${variant === "square" ? styles.square : styles.tall}`} aria-label={p.name}>
        <span className={styles.zoom}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote host list is set up in the Cloudinary step
            <img src={p.image.url} alt={p.image.alt ?? p.name} className={styles.img} />
          ) : (
            <Placeholder label={p.name} />
          )}
        </span>
        <Badge badge={p.badge} className={styles.badge} />
        {variant === "tall" ? (
          <span className={styles.sizes}>{sizesLine(p.sizesInStock)}</span>
        ) : (
          <span className={styles.squareCta}>{p.sizesInStock.length ? "Add to bag" : "Sold out"}</span>
        )}
      </Link>

      <div className={variant === "square" ? styles.bodySquare : styles.body}>
        <div className={styles.row}>
          <h3 className={styles.name}>
            <Link href={href}>{p.name}</Link>
          </h3>
          <span className={styles.price}>
            {formatVnd(price)}
            {p.onSale && p.salePrice != null && <s className={styles.was}>{formatVnd(p.price)}</s>}
          </span>
        </div>
        {variant === "tall" && (
          <>
            <span className={styles.meta}>
              {p.brand} / {p.category}
            </span>
            <Link href={href} className={styles.cta}>
              {p.sizesInStock.length ? "Add to bag" : "Sold out"}
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
