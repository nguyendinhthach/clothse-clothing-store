"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { adminCancelOrder, advanceOrder, approveRefund, failDelivery, type AdminOrderResult } from "@/lib/services/admin/orders";
import { mailAfterResponse, notifyOrderStatus } from "@/lib/services/notify";

function done(orderId: number, r: AdminOrderResult) {
  if (r.ok) {
    revalidatePath(routes.adminOrders);
    revalidatePath(routes.bag()); // customer side sees the new status
    const { status } = r;
    // An admin only reaches REFUND by approving it; the customer opens the request.
    if (status !== "PENDING") mailAfterResponse(() => notifyOrderStatus(orderId, status === "REFUND" ? "REFUND_APPROVED" : status));
  }
  return r;
}

export async function advanceOrderAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(orderId, await advanceOrder(orderId));
}

export async function adminCancelOrderAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(orderId, await adminCancelOrder(orderId));
}

export async function failDeliveryAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(orderId, await failDelivery(orderId));
}

export async function approveRefundAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(orderId, await approveRefund(orderId));
}
