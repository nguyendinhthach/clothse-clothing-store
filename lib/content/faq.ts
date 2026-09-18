// FAQ copy. Answers reflect how the store actually works (SPEC §6): COD only,
// in-app cancel/refund requests, 30.000₫ shipping free over 1.000.000₫.
export interface FaqGroup {
  title: string;
  items: { q: string; lines: string[] }[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  { title: "Đơn hàng & thanh toán", items: [
    { q: "Shop nhận thanh toán kiểu gì?", lines: ["Hiện chỉ thanh toán khi nhận hàng (COD) — bạn trả đủ cho shipper lúc gói hàng tới.", "Web không thu và không lưu thông tin thẻ."] },
    { q: "Đặt rồi có đổi hoặc huỷ được không?", lines: ["Đơn còn ở Chờ xác nhận thì bạn tự huỷ được trong mục Đơn hàng của tài khoản — hàng trả về kệ ngay.", "Khi shop đã bắt đầu xử lý, nhắn kèm mã đơn để shop lo; đơn đã gửi đi thì xử lý theo dạng đổi trả."] },
    { q: "Làm sao biết đơn đã được xác nhận?", lines: ["Mọi đơn đều được shop xem tay trước khi chuyển sang xử lý. Bạn theo dõi trạng thái trong mục Đơn hàng của tài khoản."] },
  ] },
  { title: "Giao hàng", items: [
    { q: "Giao mất bao lâu?", lines: ["1–2 ngày làm việc trong Đà Lạt, 2–4 ngày làm việc ở các tỉnh khác.", "Đơn đã xác nhận được đóng gói và giao cho đơn vị vận chuyển trong 1–2 ngày làm việc."] },
    { q: "Có giao ngoài Đà Lạt không?", lines: ["Có — shop giao toàn quốc. Ngoài Đà Lạt thường mất 2–4 ngày làm việc."] },
    { q: "Phí ship bao nhiêu?", lines: ["Cố định 30.000₫, miễn phí cho đơn từ 1.000.000₫."] },
  ] },
  { title: "Đổi trả & hoàn tiền", items: [
    { q: "Chính sách đổi trả thế nào?", lines: ["30 ngày kể từ khi nhận, với món chưa mặc, chưa giặt và còn nguyên tag.", "Giày phải trả về trong hộp gốc. Đồ lót, tất và khẩu trang không nhận đổi trả vì lý do vệ sinh."] },
    { q: "Yêu cầu đổi trả bằng cách nào?", lines: ["Mở đơn đã hoàn thành trong mục Đơn hàng và bấm “Yêu cầu đổi trả” — nút này có trong 30 ngày sau khi nhận. Shop sẽ trả lời kèm hướng dẫn gửi trả.", "Khi hàng trả về và kiểm xong, shop hoàn tiền qua chuyển khoản trong 5 ngày làm việc."] },
    { q: "Ai chịu phí ship trả hàng?", lines: ["Khách chịu, trừ khi món bị lỗi hoặc giao sai — khi đó shop chịu."] },
  ] },
  { title: "Tài khoản", items: [
    { q: "Có cần tài khoản để mua không?", lines: ["Dạo cả cửa hàng không cần, nhưng để thêm vào giỏ, lưu yêu thích và thanh toán thì cần đăng nhập (tạo tài khoản chỉ mất vài giây).", "Tài khoản còn lưu địa chỉ, lịch sử đơn và cho bật báo tin khi có hàng lại."] },
    { q: "Quên mật khẩu thì sao?", lines: ["Bấm “Quên mật khẩu?” ở trang đăng nhập rồi làm theo link trong email."] },
    { q: "Báo tin có hàng lại hoạt động thế nào?", lines: ["Bật “Báo tôi” cho món bất kỳ trong Yêu thích — shop sẽ email khi món đó có hàng lại, và khi nó giảm giá."] },
  ] },
];
