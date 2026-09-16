// Shared by server services and client filter UI — no server imports here.
export const PRICE_MIN = 200_000;
export const PRICE_MAX = 2_000_000; // "2.000.000₫+" — treated as no upper bound
export const PRICE_STEP = 20_000;
export const PAGE_SIZE = 8;

export type SortKey = "new" | "asc" | "desc";
