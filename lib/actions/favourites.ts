"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";
import { setFavouriteNotify, toggleFavourite } from "@/lib/services/favourites";

/** Heart button on product cards and the detail page. Guests are sent to sign in and back. */
export async function toggleFavouriteAction(productId: number, returnTo: string): Promise<{ favourite: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(returnTo)}`);
  const favourite = await toggleFavourite(user.id, productId);
  revalidatePath(routes.favourites);
  return { favourite };
}

export async function setNotifyAction(productId: number, notify: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(routes.favourites)}`);
  await setFavouriteNotify(user.id, productId, notify);
  revalidatePath(routes.favourites);
}
