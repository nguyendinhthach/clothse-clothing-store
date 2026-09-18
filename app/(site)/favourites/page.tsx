import type { Metadata } from "next";
import Link from "next/link";
import { FavouriteCard } from "@/components/favourites/FavouriteCard";
import { routes } from "@/lib/routes";
import { getFavouriteCards } from "@/lib/services/catalog";
import { requireUser } from "@/lib/session";
import styles from "@/components/favourites/favourites.module.css";

export const metadata: Metadata = { title: "Yêu thích" };

export default async function FavouritesPage() {
  const user = await requireUser(routes.favourites);
  const items = await getFavouriteCards(user.id);
  const alerts = items.filter((i) => i.notify).length;

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Trang chủ</Link>
            <span>/</span>
            <span className={styles.crumbOn}>Yêu thích</span>
          </nav>
          <h1 className={styles.h1}>Yêu thích</h1>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKicker}>Đã lưu</span>
          <span className={styles.metaCount}>
            {items.length} món đã lưu
          </span>
          <span className={styles.metaNote}>{alerts > 0 ? `${alerts} món đang bật báo tin` : "Chưa bật báo tin"}</span>
        </div>
      </section>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyKicker}>0 món đã lưu</span>
          <h3 className={styles.emptyTitle}>Chưa có món nào</h3>
          <p className={styles.emptyBody}>
            Chạm vào tim ở món bạn thích — shop giữ ở đây và có thể báo bạn khi món đó có hàng lại hoặc giảm giá.
          </p>
          <Link href={routes.shop()} className={styles.emptyBtn}>Dạo cửa hàng</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((i) => (
            <FavouriteCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
