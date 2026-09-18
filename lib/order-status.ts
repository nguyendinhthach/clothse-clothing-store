// Client-safe labels for the order pipeline (SPEC §6.1). Order = tab order in the design.
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import type { BagTab } from "@/lib/routes";

export const ORDER_TABS: { tab: BagTab; status: OrderStatus; label: string; emptyTitle: string; emptyBody: string }[] = [
  { tab: "pending", status: "PENDING", label: "Chờ xác nhận", emptyTitle: "Không có đơn chờ xác nhận", emptyBody: "Đơn mới đặt nằm ở đây trước. Shop xem và xác nhận từng đơn rồi mới chuyển sang xử lý." },
  { tab: "processing", status: "PROCESSING", label: "Đang xử lý", emptyTitle: "Không có đơn đang xử lý", emptyBody: "Đơn đã xác nhận, đang được soạn và đóng gói tại Đà Lạt sẽ hiện ở đây." },
  { tab: "shipping", status: "SHIPPING", label: "Đang giao", emptyTitle: "Không có đơn đang giao", emptyBody: "Đơn đã gửi cho đơn vị vận chuyển hiện ở đây cho tới khi giao xong." },
  { tab: "completed", status: "COMPLETED", label: "Hoàn thành", emptyTitle: "Chưa có đơn hoàn thành", emptyBody: "Đơn đã giao nằm ở đây để bạn mua lại hoặc yêu cầu đổi trả trong 30 ngày." },
  { tab: "cancelled", status: "CANCELLED", label: "Đã huỷ", emptyTitle: "Không có đơn đã huỷ", emptyBody: "Đơn bạn hoặc shop huỷ được lưu lại ở đây." },
  { tab: "refund", status: "REFUND", label: "Đổi trả", emptyTitle: "Không có yêu cầu đổi trả", emptyBody: "Yêu cầu đổi trả trong 30 ngày kể từ khi nhận hàng — các yêu cầu đang mở được theo dõi ở tab này." },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  REFUND: "Đổi trả",
};
