import Link from "next/link";
import { routes } from "@/lib/routes";
import { Logo } from "./Logo";
import styles from "./SiteFooter.module.css";

const COLUMNS = [
  {
    title: "Mua sắm",
    items: [
      { label: "Hàng mới", href: routes.newArrivals },
      { label: "Áo", href: routes.shop({ cat: "Tops" }) },
      { label: "Quần", href: routes.shop({ cat: "Bottoms" }) },
      { label: "Phụ kiện", href: routes.shop({ cat: "Accessories" }) },
      { label: "Giày", href: routes.shop({ cat: "Footwear" }) },
      { label: "Sale", href: routes.sale },
    ],
  },
  {
    title: "Hỗ trợ",
    items: [
      { label: "FAQ", href: routes.faq },
      { label: "Theo dõi đơn hàng", href: routes.bag("pending") },
      { label: "Điều khoản dịch vụ", href: routes.terms },
      { label: "Chính sách bảo mật", href: routes.privacy },
    ],
  },
  {
    title: "Thông tin",
    items: [{ label: "Về ClothSE", href: routes.about }],
  },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div>
          <div className={styles.brand}>
            <Logo link={false} />
          </div>
          <p className={styles.tagline}>Đủ chất để mặc mỗi ngày. Đủ tự tin để khỏi giải thích.</p>
          <div className={styles.social}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className={styles.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-7.4h2.6l.4-3h-3V8.7c0-.9.3-1.5 1.6-1.5H16.6V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2h-2.6v3h2.6V21h3.6Z" />
              </svg>
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className={styles.heading}>{col.title}</h3>
            <div className={styles.links}>
              {col.items.map((i) => (
                <Link key={i.label} href={i.href} className={styles.link}>
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className={styles.heading}>Liên hệ</h3>
          <div className={styles.links}>
            <a href="mailto:hey@clothse.com" className={styles.link}>hey@clothse.com</a>
            <span>0778 222 082</span>
            <span>01 Phù Đổng Thiên Vương<br />Đà Lạt</span>
            <Link href={routes.contact} className={styles.cta}>Nhắn cho chúng mình →</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.legal}`}>
        <span>© 2026 ClothSE — bảo lưu mọi quyền</span>
      </div>
    </footer>
  );
}
