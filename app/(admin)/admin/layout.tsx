import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Rail } from "@/components/admin/Rail";
import { getRailCounts } from "@/lib/services/admin/counts";
import { requireAdmin } from "@/lib/session";
import styles from "@/components/admin/admin.module.css";

export const metadata: Metadata = { title: { default: "Quản lý cửa hàng", template: "%s · Quản lý cửa hàng" } };

/** Store Management frame (SPEC §2: server-side admin guard; 404 for everyone else). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const counts = await getRailCounts();
  const synced = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <AdminHeader user={user} />
      <main className={`${styles.wide} ${styles.main}`}>
        <section className={styles.head}>
          <div>
            <span className={styles.kicker}>Admin · ClothSE Đà Lạt</span>
            <h1 className={styles.h1}>Quản lý cửa hàng</h1>
          </div>
          <div className={styles.headRight}>
            <span className={styles.synced}>Đồng bộ {synced}</span>
          </div>
        </section>
        <div className={styles.shell}>
          <Rail counts={counts} />
          <div className={styles.content}>{children}</div>
        </div>
      </main>
    </>
  );
}
