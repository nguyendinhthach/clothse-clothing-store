/**
 * Empty the catalogue before loading real products with db:import.
 *
 *   npm run db:clear-catalog            show what would be deleted
 *   npm run db:clear-catalog -- --yes   delete it
 *
 * Deletes every product (with its sizes, images, tags, favourites and cart
 * lines) and every batch, linked or not, then brands left with nothing.
 * Categories, sizes, tags, item types, users and addresses stay.
 *
 * Refuses to run once any order exists: orders point at variants, and sales
 * history is the one thing that cannot be rebuilt.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const [orders, products, batches, favourites, cartLines] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.batch.count(),
    prisma.favourite.count(),
    prisma.cartItem.count(),
  ]);

  if (orders > 0) {
    console.error(`The database already has ${orders} order(s) — refusing to clear the catalogue.`);
    process.exit(1);
  }

  const brands = await prisma.brand.findMany({ select: { name: true } });
  console.log(`Would delete ${products} product(s), ${batches} batch(es), ${favourites} favourite(s), ${cartLines} cart line(s).`);
  console.log(`Brands now: ${brands.map((b) => b.name).join(", ") || "none"} — all of them go, since no product or batch will be left.`);

  if (!process.argv.includes("--yes")) {
    console.log("\nNothing deleted. Run again with --yes to clear.");
    return;
  }

  // Batches first: Batch → Variant is onDelete: Restrict. Deleting products cascades
  // to variants, images, product tags, favourites and (through variants) cart items.
  await prisma.$transaction([
    prisma.batch.deleteMany(),
    prisma.product.deleteMany(),
    prisma.brand.deleteMany({ where: { products: { none: {} }, batches: { none: {} } } }),
  ]);
  console.log("\nCatalogue cleared.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
