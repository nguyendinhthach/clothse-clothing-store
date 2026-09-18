import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalBand, LegalHero, LegalSection } from "@/components/static/Legal";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function PrivacyPage() {
  return (
    <>
      <LegalHero kicker="Bảo mật · Cập nhật tháng 9/2026" title="Chính sách" block="Bảo mật" lead="Shop thu gì, dùng để làm gì, và cách sửa hay xoá. Nói gọn: chỉ những gì một đơn hàng cần." />
      <div className={`container ${styles.legal}`}>
        <LegalSection n={1} title="Shop thu thập gì">
          <ul>
            <li>Họ tên</li>
            <li>Email</li>
            <li>Số điện thoại</li>
            <li>Địa chỉ giao hàng</li>
            <li>Lịch sử đơn — bạn mua gì, size nào, trạng thái đơn</li>
          </ul>
          <p>Nếu bạn tạo tài khoản, shop lưu thêm địa chỉ đã lưu và danh sách Yêu thích. Shop hoàn toàn không thu thông tin thẻ.</p>
        </LegalSection>

        <LegalSection n={2} title="Dùng để làm gì">
          <ul>
            <li><strong>Xử lý đơn:</strong> xác nhận, đóng gói và giao gói hàng cho đơn vị vận chuyển.</li>
            <li><strong>Liên hệ giao COD:</strong> số điện thoại và địa chỉ được chuyển cho shipper để liên lạc và thu tiền lúc giao.</li>
            <li><strong>Báo có hàng lại / giảm giá:</strong> chỉ khi bạn bật “Báo tôi” cho món trong Yêu thích, hoặc đăng ký email hàng tuần.</li>
            <li><strong>Hỗ trợ:</strong> trả lời tin nhắn bạn gửi từ trang Liên hệ.</li>
          </ul>
          <p>Shop không bán dữ liệu của bạn, không dùng để phân tích hồ sơ hay chạy quảng cáo.</p>
        </LegalSection>

        <LegalSection n={3} title="Dữ liệu thanh toán">
          <p>ClothSE chỉ nhận thanh toán khi nhận hàng. Web không thu thông tin thẻ hay tài khoản ngân hàng, nên không có gì để chuyển cho cổng thanh toán — không bên thứ ba nào nhận dữ liệu của bạn.</p>
          <Callout>Không thu thông tin thẻ · Chỉ COD</Callout>
        </LegalSection>

        <LegalSection n={4} title="Ai thấy dữ liệu của bạn">
          <p>Chỉ đội ClothSE và shipper được giao đơn của bạn — người này nhận họ tên, số điện thoại, địa chỉ và số tiền cần thu. Không chia sẻ cho ai khác, trừ khi pháp luật yêu cầu.</p>
        </LegalSection>

        <LegalSection n={5} title="Giữ trong bao lâu">
          <p>Hồ sơ đơn hàng được giữ chừng nào shop còn cần cho kế toán và đổi trả. Thông tin tài khoản giữ tới khi bạn yêu cầu xoá; đồng ý nhận tin kết thúc ngay khi bạn huỷ đăng ký.</p>
        </LegalSection>

        <LegalSection n={6} title="Quyền của bạn">
          <ul>
            <li>Yêu cầu bản sao dữ liệu shop đang giữ về bạn.</li>
            <li>Yêu cầu sửa thông tin sai — họ tên, email và số điện thoại bạn tự đổi được trong <Link href={routes.account()}>Tài khoản</Link>.</li>
            <li>Yêu cầu xoá tài khoản và thông tin cá nhân.</li>
            <li>Tắt báo tin trong Yêu thích, hoặc huỷ đăng ký email bằng một cú bấm.</li>
          </ul>
          <p>Gửi các yêu cầu này qua <Link href={routes.contact}>trang Liên hệ</Link>, shop xử lý trong 30 ngày.</p>
        </LegalSection>

        <LegalBand />
      </div>
    </>
  );
}
