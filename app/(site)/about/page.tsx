import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Về ClothSE" };

const STEPS = [
  { title: "Nhập hàng", body: "Mua thẳng từ các hãng streetwear đã có tên — không qua trung gian, không hàng trôi nổi." },
  { title: "Kiểm tra", body: "Từng món được xem lại tình trạng và form thật trước khi lên kệ." },
  { title: "Đo & chụp", body: "Số đo thật, ảnh thật — không dùng ảnh mẫu của hãng." },
  { title: "Lên kệ", body: "Đăng bán với thông số trung thực, không thổi phồng." },
];

const VALUES = [
  { title: "Cam kết hàng thật", body: "Mọi món đều được kiểm tra và xác minh trước khi bán — không hàng giả, không hàng nhái." },
  { title: "Giao nhanh", body: "1–2 ngày trong Đà Lạt, 2–4 ngày toàn quốc, đóng gói ngay hôm sau khi bạn đặt." },
  { title: "Đổi trả dễ", body: "30 ngày để gửi trả, miễn chưa mặc và còn tag — không hỏi nhiều." },
  { title: "Nhận hàng rồi trả tiền", body: "Chỉ thanh toán khi nhận hàng — bạn trả cho shipper khi gói hàng đã trong tay." },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default async function AboutPage() {
  // Brands come straight from Store Management → Brands; adding one there lists it here.
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, _count: { select: { products: true } } } });

  return (
    <>
      <section className={`container ${styles.hero} ${styles.heroSplit}`}>
        <div>
          <span className={styles.tag}><span className={styles.dot} />Streetwear đa thương hiệu · Đà Lạt</span>
          <h1 className={`${styles.h1} ${styles.h1Big}`}>Về<br /><span className={styles.h1Block}>ClothSE</span></h1>
          <p className={styles.lead} style={{ maxWidth: "46ch" }}>Streetwear từ những hãng bạn đã mê, tuyển về một chỗ — chọn theo size, form và độ mặc được, không theo hype.</p>
          <div className={styles.heroActions}>
            <Link href={routes.shop()} className={styles.primary}>Vào cửa hàng</Link>
            <Link href={routes.contact} className={styles.ghost}>Liên hệ</Link>
          </div>
        </div>
        <div className={styles.art}>
          <span className={styles.artLabel}>ảnh lifestyle / editorial</span>
          <span className={styles.artCaption}>ClothSE / Đà Lạt</span>
        </div>
      </section>

      <div className="container">
        <section className={`${styles.section} ${styles.sectionTop}`}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>01</span>
            <h2 className={styles.h2}>ClothSE làm gì</h2>
          </div>
          <div className={styles.body}>
            <p>ClothSE là cửa hàng bán lẻ đa thương hiệu. Shop nhập, tuyển và bán streetwear của các hãng đã có tên — chứ không tự sản xuất dòng riêng.</p>
            <p>Mỗi đợt hàng được chọn từng món: form nào mặc đẹp, size nào người ta mặc thật, giá không bị đẩy lên bởi resale. Món nào không đạt về vải, đường cắt hay giá trị thì không lên kệ.</p>
            <p>Hàng mới về mỗi tuần, đăng với số đo thật và ghi chú tình trạng trung thực để bạn mua tự tin như thử tại chỗ.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>02</span>
            <h2 className={styles.h2}>Cách shop tuyển hàng</h2>
          </div>
          <div className={`${styles.bodyWide} ${styles.cards}`}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.card}>
                <span className={styles.cardNum}>{pad(i + 1)}</span>
                <h3 className={styles.h3}>{s.title}</h3>
                <p className={styles.cardText}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.plain}>
          <div className={styles.rowHead}>
            <div className={styles.sectionHead}>
              <span className={styles.index}>03</span>
              <h2 className={`${styles.h2} ${styles.h2Lg}`}>Các hãng đang có</h2>
            </div>
            <span className={styles.index}>đang bán {brands.length} hãng</span>
          </div>
          <div className={styles.brands}>
            {brands.map((b) => (
              <Link key={b.id} href={routes.shop({ q: b.name })} className={styles.brand}>
                <span>
                  <span className={styles.brandName}>{b.name}</span>
                  <span className={styles.brandMeta}>{b._count.products} mẫu trong kho</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.dark}>
        <div className={`container ${styles.darkInner}`}>
          <div className={styles.sectionHead}>
            <span className={styles.index}>04</span>
            <h2 className={`${styles.h2} ${styles.h2Lg}`}>Vì sao chọn ClothSE</h2>
          </div>
          <div className={styles.values}>
            {VALUES.map((v, i) => (
              <div key={v.title} className={styles.value}>
                <span className={styles.valueNum}>{pad(i + 1)}</span>
                <h3 className={styles.h3}>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`container ${styles.split}`}>
        <div className={styles.splitText}>
          <span className={styles.index}>05 · Shop ở đâu</span>
          <h2 className={`${styles.h2} ${styles.h2Lg}`}>Đặt tại<br />Đà Lạt</h2>
          <p className={styles.lead}>01 Phù Đổng Thiên Vương — đơn giao toàn quốc, thắc mắc được trả lời trong 1–2 ngày làm việc.</p>
          <Link href={routes.contact} className={styles.mono} style={{ marginTop: 6 }}>Liên hệ →</Link>
        </div>
        <div className={`${styles.art} ${styles.artWide}`}>
          <span className={styles.artLabel}>bản đồ — Đà Lạt</span>
        </div>
      </section>
    </>
  );
}
