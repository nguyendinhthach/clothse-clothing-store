"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";
import { addToCart } from "@/lib/services/cart";

export async function addToCartAction(variantId: number, qty: number, returnTo: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(returnTo)}`);

  const r = await addToCart(user.id, variantId, qty);
  if (!r.ok) return { ok: false, message: r.error };
  revalidatePath("/", "layout"); // header bag count
  return { ok: true, message: "Added to bag ✓" };
}
