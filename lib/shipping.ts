// SPEC §6.8 — flat domestic fee, free above a threshold. Both are constants
// for now (phase 1); phase 2 moves them to a Setting table. Every Order
// snapshots the fee it was charged, so changing these never rewrites history.

export const SHIPPING_FEE = 30_000;
export const FREE_SHIPPING_OVER = 1_000_000;

export function shippingFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
}
