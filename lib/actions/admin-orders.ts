"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { requireAdmin } from "@/lib/session";
import { adminCancelOrder, advanceOrder, approveRefund, type AdminOrderResult } from "@/lib/services/admin/orders";

function done(r: AdminOrderResult) {
  if (r.ok) {
    revalidatePath(routes.adminOrders);
    revalidatePath(routes.bag()); // customer side sees the new status
  }
  return r;
}

export async function advanceOrderAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(await advanceOrder(orderId));
}

export async function adminCancelOrderAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(await adminCancelOrder(orderId));
}

export async function approveRefundAction(orderId: number): Promise<AdminOrderResult> {
  await requireAdmin();
  return done(await approveRefund(orderId));
}
