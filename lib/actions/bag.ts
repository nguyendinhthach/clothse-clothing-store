"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";
import { toggleFavourite } from "@/lib/services/favourites";
import { cancelOrder, placeOrder, removeCartLines, requestRefund, setCartQty } from "@/lib/services/orders";
import { prisma } from "@/lib/prisma";

async function requireUserOrRedirect(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(returnTo)}`);
  return user;
}

function refreshBag() {
  revalidatePath(routes.bag());
  revalidatePath("/", "layout"); // header count
}

export async function setBagQtyAction(variantId: number, qty: number): Promise<void> {
  const user = await requireUserOrRedirect(routes.bag());
  await setCartQty(user.id, variantId, qty);
  refreshBag();
}

export async function removeBagLinesAction(variantIds: number[]): Promise<void> {
  const user = await requireUserOrRedirect(routes.bag());
  await removeCartLines(user.id, variantIds);
  refreshBag();
}

/** "Save for later" — move the line to favourites (product-level, SPEC decision 17). */
export async function saveForLaterAction(variantId: number): Promise<void> {
  const user = await requireUserOrRedirect(routes.bag());
  const v = await prisma.variant.findUnique({ where: { id: variantId }, select: { productId: true } });
  if (v) {
    const isFav = await prisma.favourite.findUnique({ where: { userId_productId: { userId: user.id, productId: v.productId } } });
    if (!isFav) await toggleFavourite(user.id, v.productId);
  }
  await removeCartLines(user.id, [variantId]);
  refreshBag();
  revalidatePath(routes.favourites);
}

export interface CheckoutState {
  error?: string;
}

export async function placeOrderAction(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const user = await requireUserOrRedirect(routes.checkout);
  const variantIds = String(fd.get("lines") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  const ship = { name: String(fd.get("name") ?? ""), phone: String(fd.get("phone") ?? ""), address: String(fd.get("address") ?? "") };

  const r = await placeOrder(user.id, variantIds, ship);
  if (!r.ok) return { error: r.error };
  refreshBag();
  redirect(`${routes.bag("pending")}&placed=${encodeURIComponent(r.code)}`);
}

export async function cancelOrderAction(orderId: number): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserOrRedirect(routes.bag("pending"));
  const r = await cancelOrder(user.id, orderId);
  if (r.ok) revalidatePath(routes.bag());
  return r;
}

export async function requestRefundAction(orderId: number): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUserOrRedirect(routes.bag("completed"));
  const r = await requestRefund(user.id, orderId);
  if (r.ok) revalidatePath(routes.bag());
  return r;
}
