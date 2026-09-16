import { prisma } from "@/lib/prisma";

/** Product count per category, in the fixed display order (SPEC §5). */
export async function getCategoryCounts() {
  const rows = await prisma.category.findMany({
    orderBy: { id: "asc" },
    select: { name: true, _count: { select: { products: true } } },
  });
  return rows.map((c) => ({ name: c.name, count: c._count.products }));
}
