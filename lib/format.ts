/** 1350000 → "1.350.000₫" (SPEC §7: integer VND, Vietnamese thousands separator). */
export function formatVnd(amount: number): string {
  return amount.toLocaleString("de-DE") + "₫";
}

// SPEC §7 — stored in UTC, shown in Vietnam time. Pinning the zone also keeps
// server (Vercel = UTC) and browser output identical, so no hydration mismatch.
export const VN_TZ = "Asia/Ho_Chi_Minh";

/** 2026-09-19 → "19/9/2026" by default; pass Intl options to change the parts shown. */
export function formatDate(d: Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "numeric", year: "numeric" }): string {
  return d.toLocaleDateString("vi-VN", { timeZone: VN_TZ, ...opts });
}

export function formatTime(d: Date, opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }): string {
  return d.toLocaleTimeString("vi-VN", { timeZone: VN_TZ, ...opts });
}
