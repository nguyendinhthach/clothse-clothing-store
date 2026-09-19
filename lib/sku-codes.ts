// SPEC §7 — the item types the store starts with. At runtime the list lives in the
// ItemType table (Store Management → Loại món); this file only feeds the seed.

export const DEFAULT_ITEM_TYPES: { code: string; label: string; category: string }[] = [
  { code: "TEE", label: "Tee", category: "Tops" },
  { code: "SHR", label: "Shirt", category: "Tops" },
  { code: "HDY", label: "Hoodie", category: "Tops" },
  { code: "FLC", label: "Fleece", category: "Tops" },
  { code: "JKT", label: "Jacket", category: "Tops" },
  { code: "TOP", label: "Áo khác", category: "Tops" },
  { code: "PNT", label: "Pant", category: "Bottoms" },
  { code: "JEN", label: "Jean", category: "Bottoms" },
  { code: "SHT", label: "Short", category: "Bottoms" },
  { code: "BTM", label: "Quần khác", category: "Bottoms" },
  { code: "SNK", label: "Sneaker", category: "Footwear" },
  { code: "RUN", label: "Runner", category: "Footwear" },
  { code: "BOT", label: "Boot", category: "Footwear" },
  { code: "SDL", label: "Sandal", category: "Footwear" },
  { code: "FTW", label: "Giày khác", category: "Footwear" },
  { code: "CAP", label: "Cap", category: "Accessories" },
  { code: "BNE", label: "Beanie", category: "Accessories" },
  { code: "BAG", label: "Bag", category: "Accessories" },
  { code: "BLT", label: "Belt", category: "Accessories" },
  { code: "SCK", label: "Sock", category: "Accessories" },
  { code: "ACC", label: "Phụ kiện khác", category: "Accessories" },
];
