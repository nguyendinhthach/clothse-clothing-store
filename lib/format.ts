/** 1350000 → "1.350.000₫" (SPEC §7: integer VND, Vietnamese thousands separator). */
export function formatVnd(amount: number): string {
  return amount.toLocaleString("de-DE") + "₫";
}
