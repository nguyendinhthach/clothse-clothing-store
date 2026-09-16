import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordions, type AccordionSection } from "@/components/product/Accordions";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getProductDetail, getRelatedProducts } from "@/lib/services/catalog";
import { getFavouriteIds } from "@/lib/services/favourites";
import { getCurrentUser } from "@/lib/session";
import { FREE_SHIPPING_OVER, SHIPPING_FEE } from "@/lib/shipping";
import styles from "./product.module.css";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await getProductDetail(Number(id));
  return { title: p ? `${p.name} — ${p.brand}` : "Product" };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProductDetail(Number(id));
  if (!product) notFound();

  const user = await getCurrentUser();
  const [related, favouriteIds] = await Promise.all([getRelatedProducts(product, 4), user ? getFavouriteIds(user.id) : null]);
  const fav = (pid: number) => (favouriteIds ? favouriteIds.has(pid) : null);

  const paying = product.onSale && product.salePrice != null ? product.salePrice : product.price;
  const discount = product.onSale && product.salePrice != null ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

  const sections: AccordionSection[] = [
    {
      id: "details",
      title: "Product details",
      lines: [...product.details, ...(product.modelFitNote ? [{ label: "Model", value: product.modelFitNote }] : [])],
    },
    {
      id: "size-guide",
      title: "Size guide",
      lines: Object.keys(product.sizeGuide).length
        ? Object.entries(product.sizeGuide).map(([label, value]) => ({ label, value }))
        : [{ label: "Fit", value: product.modelFitNote ?? "True to size. Between sizes? Size up for a relaxed fit." }],
    },
    {
      id: "shipping",
      title: "Shipping & returns",
      lines: [
        { label: "Delivery", value: `Nationwide. ${formatVnd(SHIPPING_FEE)} flat, free on orders over ${formatVnd(FREE_SHIPPING_OVER)}. Dispatched in 1–2 days.` },
        { label: "Payment", value: "Cash on delivery — pay the courier when your order arrives." },
        { label: "Returns", value: "30 days, unworn with tags. Request a return from your orders page." },
      ],
    },
  ];

  return (
    <div className={`container ${styles.page}`}>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href={routes.home}>Home</Link>
        <span>/</span>
        <Link href={routes.shop()}>Shop</Link>
        <span>/</span>
        <Link href={routes.shop({ cat: product.category })}>{product.category}</Link>
        <span>/</span>
        <span className={styles.crumbCurrent}>{product.name}</span>
      </nav>

      <section className={styles.main}>
        <Gallery name={product.name} images={product.images} badge={product.badge} />

        <div className={styles.info}>
          <span className={styles.kicker}>
            {product.category} — {product.sku}
          </span>
          <h1 className={styles.h1}>{product.name}</h1>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatVnd(paying)}</span>
            {discount > 0 && (
              <>
                <s className={styles.compare}>{formatVnd(product.price)}</s>
                <span className={styles.discount}>-{discount}%</span>
              </>
            )}
          </div>
          <p className={styles.brandLine}>{product.brand}</p>
          {product.description && <p className={styles.desc}>{product.description}</p>}

          <div className={styles.rule} />

          <PurchasePanel productId={product.id} price={paying} sizes={product.sizes} favourite={fav(product.id)} />
          <span className={styles.shipNote}>Free shipping over {formatVnd(FREE_SHIPPING_OVER)} — dispatched in 1–2 days</span>

          <Accordions sections={sections} initial="details" />
        </div>
      </section>

      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedHead}>
            <h2 className={styles.h2}>You may also like</h2>
            <Link href={routes.shop({ cat: product.category })} className={styles.viewAll}>
              View all {product.category}
            </Link>
          </div>
          <div className={styles.grid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" favourite={fav(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
