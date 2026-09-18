import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/static/ContactForm";
import { SHOP_CONTACT } from "@/lib/content/contact";
import { routes } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Liên hệ" };

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <>
      <section className={`container ${styles.hero}`} style={{ paddingBottom: "clamp(20px, 3vw, 40px)" }}>
        <span className={styles.tag}><span className={`${styles.dot} ${styles.dotPulse}`} />Trả lời trong 1–2 ngày làm việc</span>
        <h1 className={styles.h1}>Nhắn cho<br /><span className={styles.h1Block}>ClothSE</span></h1>
        <p className={styles.lead} style={{ maxWidth: "48ch" }}>Hỏi về đơn hàng, đổi trả hay bất cứ gì khác — shop ở đây để giúp.</p>
      </section>

      <section className={`container ${styles.contact}`}>
        <div className={styles.panel}>
          <h2 className={`${styles.h2} ${styles.h2Panel}`}>Gửi tin nhắn</h2>
          <ContactForm defaults={{ name: user?.name ?? "", email: user?.email ?? "" }} />
        </div>

        <div className={styles.side}>
          <div className={`${styles.panel} ${styles.panelDark}`}>
            <h2 className={`${styles.h2} ${styles.h2Panel}`}>Liên hệ trực tiếp</h2>
            <div className={styles.reach}>
              <span className={styles.reachKicker}>Email</span>
              <a href={`mailto:${SHOP_CONTACT.email}`} className={styles.reachLink}>{SHOP_CONTACT.email}</a>
              <span className={styles.reachNote}>Đơn hàng, đổi trả và mọi thứ khác.</span>
            </div>
            <div className={styles.reach}>
              <span className={styles.reachKicker}>Điện thoại</span>
              <a href={SHOP_CONTACT.phoneHref} className={styles.reachLink}>{SHOP_CONTACT.phone}</a>
            </div>
            <div className={styles.reach}>
              <span className={styles.reachKicker}>Cửa hàng</span>
              <span className={styles.reachText}>{SHOP_CONTACT.addressLines[0]}<br />{SHOP_CONTACT.addressLines[1]}</span>
            </div>
            <div className={styles.reach} style={{ gap: 12 }}>
              <span className={styles.reachKicker}>Theo dõi</span>
              <div className={styles.social}>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className={styles.socialLink}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.5 21v-7.4h2.6l.4-3h-3V8.7c0-.9.3-1.5 1.6-1.5H16.6V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2h-2.6v3h2.6V21h3.6Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.panelSm}`}>
            <span className={styles.kickerSm}>Đã đặt đơn rồi?</span>
            <p className={styles.cardText}>Theo dõi, đổi trả và tình trạng giao nằm trong lịch sử đơn — cách nhanh nhất để xem.</p>
            <Link href={routes.bag("pending")} className={`${styles.mono} ${styles.monoSm}`} style={{ marginTop: 4 }}>Xem đơn hàng</Link>
          </div>
        </div>
      </section>
    </>
  );
}
