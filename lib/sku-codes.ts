// SPEC §7 — closed list of item-type codes used to mint SKUs (CSE-<code>-<seq>).
// Client-safe. Not stored on Product; category stays the only classification.

export const SKU_TYPES: { code: string; label: string; category: string }[] = [
  { code: "TEE", label: "Tee", category: "Tops" },
  { code: "SHR", label: "Shirt", category: "Tops" },
  { code: "HDY", label: "Hoodie", category: "Tops" },
  { code: "FLC", label: "Fleece", category: "Tops" },
  { code: "JKT", label: "Jacket", category: "Tops" },
  { code: "PNT", label: "Pant", category: "Bottoms" },
  { code: "JEN", label: "Jean", category: "Bottoms" },
  { code: "SHT", label: "Short", category: "Bottoms" },
  { code: "SNK", label: "Sneaker", category: "Footwear" },
  { code: "RUN", label: "Runner", category: "Footwear" },
  { code: "BOT", label: "Boot", category: "Footwear" },
  { code: "SDL", label: "Sandal", category: "Footwear" },
  { code: "CAP", label: "Cap", category: "Accessories" },
  { code: "BNE", label: "Beanie", category: "Accessories" },
  { code: "BAG", label: "Bag", category: "Accessories" },
  { code: "BLT", label: "Belt", category: "Accessories" },
  { code: "SCK", label: "Sock", category: "Accessories" },
  { code: "ACC", label: "Other accessory", category: "Accessories" },
];

export const skuTypesFor = (category: string) => SKU_TYPES.filter((t) => t.category === category);
