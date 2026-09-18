import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordions, type AccordionSection } from "@/components/product/Accordions";
import { Gallery } from "@/components/product/Gallery";
import { ProductCard } from "@/components/product/ProductCard";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { categoryLabel } from "@/lib/catalog-constants";
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
  return { title: p ? `${p.name} — ${p.brand}` : "Sản phẩm" };
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
      title: "Chi tiết sản phẩm",
      lines: [...product.details, ...(product.modelFitNote ? [{ label: "Người mẫu", value: product.modelFitNote }] : [])],
    },
    {
      id: "size-guide",
      title: "Hướng dẫn chọn size",
      lines: Object.keys(product.sizeGuide).length
        ? Object.entries(product.sizeGuide).map(([label, value]) => ({ label, value }))
        : [{ label: "Form", value: product.modelFitNote ?? "Đúng size. Lỡ cỡ giữa hai size thì lấy size lớn hơn cho thoải mái." }],
    },
    {
      id: "shipping",
      title: "Giao hàng & đổi trả",
      lines: [
        { label: "Giao hàng", value: `Toàn quốc. Phí cố định ${formatVnd(SHIPPING_FEE)}, miễn phí cho đơn từ ${formatVnd(FREE_SHIPPING_OVER)}. Gửi trong 1–2 ngày.` },
        { label: "Thanh toán", value: "Thanh toán khi nhận hàng (COD) — trả tiền cho shipper lúc nhận." },
        { label: "Đổi trả", value: "30 ngày, chưa mặc và còn tag. Gửi yêu cầu ngay trong trang Đơn hàng." },
      ],
    },
  ];

  return (
    <div className={`container ${styles.page}`}>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href={routes.home}>Trang chủ</Link>
        <span>/</span>
        <Link href={routes.shop()}>Cửa hàng</Link>
        <span>/</span>
        <Link href={routes.shop({ cat: product.category })}>{categoryLabel(product.category)}</Link>
        <span>/</span>
        <span className={styles.crumbCurrent}>{product.name}</span>
      </nav>

      <section className={styles.main}>
        <Gallery name={product.name} images={product.images} badge={product.badge} />

        <div className={styles.info}>
          <span className={styles.kicker}>
            {categoryLabel(product.category)} — {product.sku}
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
          <span className={styles.shipNote}>Miễn ship từ {formatVnd(FREE_SHIPPING_OVER)} — gửi trong 1–2 ngày</span>

          <Accordions sections={sections} initial="details" />
        </div>
      </section>

      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedHead}>
            <h2 className={styles.h2}>Có thể bạn cũng thích</h2>
            <Link href={routes.shop({ cat: product.category })} className={styles.viewAll}>
              Xem tất cả {categoryLabel(product.category)}
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
