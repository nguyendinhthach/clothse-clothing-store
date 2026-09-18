// Shared by server services and client filter UI — no server imports here.
export const PRICE_MIN = 200_000;
export const PRICE_MAX = 2_000_000; // "2.000.000₫+" — treated as no upper bound
export const PRICE_STEP = 20_000;
export const PAGE_SIZE = 8;

export type SortKey = "new" | "asc" | "desc" | "discount";

/**
 * Category names live in the DB in English (seed, xlsx import, `?cat=` URLs all use them as keys).
 * Only the label shown to customers is Vietnamese; unknown names (added later via admin) fall through unchanged.
 */
const CATEGORY_LABEL: Record<string, string> = {
  Tops: "Áo",
  Bottoms: "Quần",
  Accessories: "Phụ kiện",
  Footwear: "Giày",
};
export const categoryLabel = (name: string) => CATEGORY_LABEL[name] ?? name;

/** Same idea for tags: only the gendered ones need a Vietnamese label. */
const TAG_LABEL: Record<string, string> = { Men: "Nam", Women: "Nữ" };
export const tagLabel = (name: string) => TAG_LABEL[name] ?? name;
