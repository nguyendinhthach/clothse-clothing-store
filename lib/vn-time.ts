// SPEC §7 — Vietnam is UTC+7 all year (no daylight saving). Calendar maths —
// month starts, day buckets, "today" — goes through these helpers instead of
// Date's local-time methods, so the result does not depend on the server's zone:
// Vercel runs in UTC and reserves the TZ variable.

const OFFSET = 7 * 3_600_000;

/** Year, month (0-based), day and weekday (0 = Sunday) of `d` on the Vietnamese calendar. */
export function vnParts(d: Date) {
  const s = new Date(d.getTime() + OFFSET);
  return { year: s.getUTCFullYear(), month: s.getUTCMonth(), day: s.getUTCDate(), weekday: s.getUTCDay() };
}

/** The instant a Vietnamese calendar day begins. Month and day may overflow, as with `new Date(y, m, d)`. */
export function vnDate(year: number, month: number, day = 1): Date {
  return new Date(Date.UTC(year, month, day) - OFFSET);
}

export function vnStartOfDay(d: Date): Date {
  const p = vnParts(d);
  return vnDate(p.year, p.month, p.day);
}

/** First instant of the Vietnamese month containing `d`, shifted by `offset` months. */
export function vnMonthStart(d: Date, offset = 0): Date {
  const p = vnParts(d);
  return vnDate(p.year, p.month + offset, 1);
}

/** "2026-09-30" as the start of that Vietnamese day, or null when malformed. */
export function vnDayFromIso(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? vnDate(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** `d` as YYYY-MM-DD on the Vietnamese calendar (date inputs, keys). */
export function vnIsoDay(d: Date): string {
  const p = vnParts(d);
  return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
