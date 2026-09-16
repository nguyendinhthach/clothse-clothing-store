/*
  Warnings:

  - Added the required column `brandId` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeOptionId` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "brandId" INTEGER NOT NULL,
ADD COLUMN     "sizeOptionId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_sizeOptionId_fkey" FOREIGN KEY ("sizeOptionId") REFERENCES "SizeOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
