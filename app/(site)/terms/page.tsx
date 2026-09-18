import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalBand, LegalHero, LegalSection } from "@/components/static/Legal";
import { routes } from "@/lib/routes";
import styles from "@/components/static/static.module.css";

export const metadata: Metadata = { title: "Điều khoản dịch vụ" };

export default function TermsPage() {
  return (
    <>
      <LegalHero kicker="Pháp lý · Cập nhật tháng 9/2026" title="Điều khoản" block="Dịch vụ" lead="Luật chơi khi mua ở ClothSE — kèm đầy đủ chính sách giao hàng và đổi trả, gom về một chỗ." />
      <div className={`container ${styles.legal}`}>
        <LegalSection n={1} title="Thoả thuận">
          <p>Khi dạo ClothSE hoặc đặt đơn, bạn đồng ý với các điều khoản này. Shop bán streetwear của các hãng bên thứ ba; mô tả, số đo và hình ảnh sản phẩm do các hãng cung cấp và được đăng lại một cách trung thực.</p>
          <p>Điều khoản có thể được cập nhật khi cửa hàng thay đổi. Bản đang hiển thị trên trang này là bản áp dụng cho đơn của bạn.</p>
        </LegalSection>

        <LegalSection n={2} title="Đặt đơn & xác nhận">
          <p>Đặt đơn là yêu cầu mua, chưa phải giao dịch đã chốt. Shop xác nhận tay từng đơn trước khi chuyển sang xử lý — bạn theo dõi trạng thái trong <Link href={routes.bag("pending")}>Đơn hàng</Link>.</p>
          <ul>
            <li>Shop có thể từ chối đơn nếu hàng vừa hết, giá bị đăng nhầm, hoặc thông tin giao hàng thiếu.</li>
            <li>Giá hiển thị bằng đồng Việt Nam và đã gồm VAT (nếu có).</li>
            <li>Kho dùng chung với cửa hàng thật, nên size có thể hết trong lúc từ thêm vào giỏ tới khi xác nhận.</li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="Thanh toán">
          <p>ClothSE chỉ nhận thanh toán khi nhận hàng (COD). Bạn trả đủ cho shipper lúc gói hàng tới — shop không thu, không lưu và không xử lý thông tin thẻ ở bất kỳ bước nào.</p>
          <Callout>Chỉ COD · chuẩn bị đúng số tiền cho shipper</Callout>
        </LegalSection>

        <LegalSection n={4} title="Chính sách giao hàng">
          <ul>
            <li><strong>Gửi hàng:</strong> đơn đã xác nhận được đóng gói và giao cho đơn vị vận chuyển trong 1–2 ngày làm việc.</li>
            <li><strong>Thời gian giao:</strong> 1–2 ngày làm việc trong Đà Lạt, 2–4 ngày làm việc ở các tỉnh khác.</li>
            <li><strong>Phí ship:</strong> cố định 30.000₫.</li>
            <li><strong>Miễn ship:</strong> đơn từ 1.000.000₫.</li>
            <li><strong>Giao không thành:</strong> shipper giao tối đa hai lần; gói COD không giao được sẽ quay về shop và đơn bị huỷ.</li>
          </ul>
        </LegalSection>

        <LegalSection n={5} title="Đổi trả & hoàn tiền">
          <p>Bạn có 30 ngày kể từ khi nhận hàng để trả lại.</p>
          <ul>
            <li>Món phải chưa mặc, chưa giặt và còn nguyên tag.</li>
            <li>Giày phải trả về trong hộp gốc, không hư hỏng.</li>
            <li>Đồ lót, tất và khẩu trang không nhận đổi trả vì lý do vệ sinh.</li>
            <li>Hàng sale cũng áp dụng 30 ngày, trừ khi ghi rõ không đổi trả.</li>
          </ul>
          <p>Để yêu cầu đổi trả, mở đơn đã hoàn thành trong <Link href={routes.bag("completed")}>Đơn hàng</Link> và bấm “Yêu cầu đổi trả”, hoặc nhắn từ trang Liên hệ kèm mã đơn. Shop trả lời kèm hướng dẫn gửi trả; khi hàng về và kiểm xong, tiền được hoàn qua chuyển khoản trong 5 ngày làm việc. Phí ship trả hàng do khách chịu, trừ khi món bị lỗi hoặc giao sai.</p>
        </LegalSection>

        <LegalSection n={6} title="Huỷ đơn">
          <p>Đơn còn Chờ xác nhận có thể huỷ miễn phí trong mục Đơn hàng của tài khoản. Khi shop đã bắt đầu xử lý, nhắn kèm mã đơn; gói hàng đã đi cùng shipper thì phải xử lý theo dạng đổi trả.</p>
          <p>Từ chối nhận gói COD nhiều lần có thể khiến shop từ chối các đơn sau.</p>
        </LegalSection>

        <LegalSection n={7} title="Sử dụng website">
          <p>Nội dung trên web — chữ, bố cục và hình ảnh — thuộc về ClothSE hoặc các hãng shop bán, không được dùng lại cho mục đích thương mại khi chưa có phép. Tài khoản là của riêng bạn; giữ kín thông tin đăng nhập và báo shop nếu nghi ngờ bị dùng trái phép.</p>
        </LegalSection>

        <LegalBand />
      </div>
    </>
  );
}
