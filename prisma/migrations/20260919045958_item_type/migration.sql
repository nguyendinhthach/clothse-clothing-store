-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "typeId" INTEGER;

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_code_key" ON "ItemType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_categoryId_label_key" ON "ItemType"("categoryId", "label");

-- CreateIndex
CREATE INDEX "Product_typeId_idx" ON "Product"("typeId");

-- AddForeignKey
ALTER TABLE "ItemType" ADD CONSTRAINT "ItemType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ItemType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the closed list that used to live in lib/sku-codes.ts, plus an "other" code per category
-- so the admin is never stuck. Then point every existing product at the type its SKU encodes.
INSERT INTO "ItemType" ("code", "label", "categoryId")
SELECT v.code, v.label, c.id
FROM (VALUES
  ('TEE', 'Tee', 'Tops'), ('SHR', 'Shirt', 'Tops'), ('HDY', 'Hoodie', 'Tops'), ('FLC', 'Fleece', 'Tops'), ('JKT', 'Jacket', 'Tops'), ('TOP', 'Áo khác', 'Tops'),
  ('PNT', 'Pant', 'Bottoms'), ('JEN', 'Jean', 'Bottoms'), ('SHT', 'Short', 'Bottoms'), ('BTM', 'Quần khác', 'Bottoms'),
  ('SNK', 'Sneaker', 'Footwear'), ('RUN', 'Runner', 'Footwear'), ('BOT', 'Boot', 'Footwear'), ('SDL', 'Sandal', 'Footwear'), ('FTW', 'Giày khác', 'Footwear'),
  ('CAP', 'Cap', 'Accessories'), ('BNE', 'Beanie', 'Accessories'), ('BAG', 'Bag', 'Accessories'), ('BLT', 'Belt', 'Accessories'), ('SCK', 'Sock', 'Accessories'), ('ACC', 'Phụ kiện khác', 'Accessories')
) AS v(code, label, cat)
JOIN "Category" c ON c.name = v.cat;

UPDATE "Product" p
SET "typeId" = t.id
FROM "ItemType" t
WHERE split_part(p.sku, '-', 2) = t.code;
