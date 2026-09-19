import { prisma } from "@/lib/prisma";

/** Numbers shown beside each rail item in Store Management. */
export async function getRailCounts() {
  const [products, brands, sizes, types, batches, orders] = await Promise.all([
    prisma.product.count(),
    prisma.brand.count(),
    prisma.sizeOption.count({ where: { active: true } }),
    prisma.itemType.count(),
    prisma.batch.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING", "SHIPPING"] } } }),
  ]);
  return { products, brands, sizes, types, storage: batches, orders };
}
