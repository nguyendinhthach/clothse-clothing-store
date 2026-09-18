import { prisma } from "@/lib/prisma";
import { CART_MAX_PER_LINE } from "@/lib/cart-constants";

/** Units in the user's bag (header badge). */
export async function getCartCount(userId: number): Promise<number> {
  const r = await prisma.cartItem.aggregate({ where: { userId }, _sum: { qty: true } });
  return r._sum.qty ?? 0;
}

export type AddResult = { ok: true; qty: number } | { ok: false; error: string };

/**
 * Add units of one size to the bag. Never lets the line exceed current stock
 * (SPEC §6.3: no ordering beyond stock); the real deduction happens at checkout.
 */
export async function addToCart(userId: number, variantId: number, qty: number): Promise<AddResult> {
  if (!Number.isInteger(qty) || qty < 1) return { ok: false, error: "Chọn số lượng." };
  const variant = await prisma.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
  if (!variant) return { ok: false, error: "Size này không còn nữa." };
  if (variant.stock === 0) return { ok: false, error: "Size này đã hết hàng." };

  const existing = await prisma.cartItem.findUnique({ where: { userId_variantId: { userId, variantId } } });
  const wanted = Math.min((existing?.qty ?? 0) + qty, CART_MAX_PER_LINE);
  const next = Math.min(wanted, variant.stock);
  if (existing && next === existing.qty) {
    return {
      ok: false,
      error: next >= CART_MAX_PER_LINE ? `Tối đa ${CART_MAX_PER_LINE} món mỗi size — giỏ của bạn đã đủ.` : `Chỉ còn ${variant.stock} món — giỏ của bạn đã có đủ số đó.`,
    };
  }

  await prisma.cartItem.upsert({
    where: { userId_variantId: { userId, variantId } },
    update: { qty: next },
    create: { userId, variantId, qty: next },
  });
  return { ok: true, qty: next };
}
