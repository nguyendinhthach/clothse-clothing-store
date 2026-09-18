import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/static/FaqList";
import { FAQ_GROUPS } from "@/lib/content/faq";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <>
      <section className={`container ${styles.hero} ${styles.heroRuled}`}>
        <span className={styles.tag}>Hỗ trợ · FAQ</span>
        <h1 className={`${styles.h1} ${styles.h1Small}`}>Câu hỏi<br /><span className={styles.h1Block}>thường gặp</span></h1>
        <p className={styles.lead}>Chưa thấy câu trả lời bạn cần? <Link href={routes.contact}>Nhắn cho shop</Link>.</p>
      </section>

      <div className={`container ${styles.faq}`}>
        <FaqList groups={FAQ_GROUPS} />
        <section className={styles.band}>
          <div className={styles.bandText}>
            <h2 className={`${styles.h2} ${styles.h2Sm}`}>Vẫn còn vướng?</h2>
            <p>Gửi chi tiết cho shop, bạn sẽ có trả lời trong 1–2 ngày làm việc.</p>
          </div>
          <Link href={routes.contact} className={`${styles.mono} ${styles.monoInverse}`}>Liên hệ →</Link>
        </section>
      </div>
    </>
  );
}
