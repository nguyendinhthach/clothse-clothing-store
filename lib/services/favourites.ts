import { prisma } from "@/lib/prisma";

export async function getFavouriteIds(userId: number): Promise<Set<number>> {
  const rows = await prisma.favourite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(rows.map((r) => r.productId));
}

/** SPEC decision 17 — favourites are per product. Returns the new state. */
export async function toggleFavourite(userId: number, productId: number): Promise<boolean> {
  const existing = await prisma.favourite.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.favourite.create({ data: { userId, productId } });
  return true;
}

export async function setFavouriteNotify(userId: number, productId: number, notify: boolean): Promise<void> {
  await prisma.favourite.updateMany({ where: { userId, productId }, data: { notify } });
}
