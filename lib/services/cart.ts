import { prisma } from "@/lib/prisma";

/** Units in the user's bag (header badge). */
export async function getCartCount(userId: number): Promise<number> {
  const r = await prisma.cartItem.aggregate({ where: { userId }, _sum: { qty: true } });
  return r._sum.qty ?? 0;
}
