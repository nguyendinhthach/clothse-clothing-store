// Client-safe labels for the order pipeline (SPEC §6.1). Order = tab order in the design.
import type { OrderStatus } from "@/lib/generated/prisma/enums";
import type { BagTab } from "@/lib/routes";

export const ORDER_TABS: { tab: BagTab; status: OrderStatus; label: string; emptyTitle: string; emptyBody: string }[] = [
  { tab: "pending", status: "PENDING", label: "To Confirm", emptyTitle: "Nothing awaiting confirmation", emptyBody: "New orders land here first. We review and confirm each one before moving it into processing." },
  { tab: "processing", status: "PROCESSING", label: "Processing", emptyTitle: "No orders processing", emptyBody: "Once an order is confirmed, items being picked and packed in Đà Lạt show up here." },
  { tab: "shipping", status: "SHIPPING", label: "Shipping", emptyTitle: "Nothing in transit", emptyBody: "Dispatched parcels show up here until they're delivered." },
  { tab: "completed", status: "COMPLETED", label: "Completed", emptyTitle: "No completed orders", emptyBody: "Delivered orders stay here so you can reorder or open a return within 30 days." },
  { tab: "cancelled", status: "CANCELLED", label: "Cancelled", emptyTitle: "No cancelled orders", emptyBody: "Anything you or we cancel is archived here." },
  { tab: "refund", status: "REFUND", label: "Return/Refund", emptyTitle: "No returns open", emptyBody: "Start a return within 30 days of delivery — open cases are tracked on this tab." },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "To Confirm",
  PROCESSING: "Processing",
  SHIPPING: "Shipping",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUND: "Return/Refund",
};
