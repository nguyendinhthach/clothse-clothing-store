import { prisma } from "@/lib/prisma";
import { appUrl, sendMail } from "@/lib/mail";
import { formatVnd } from "@/lib/format";
import { routes } from "@/lib/routes";

// SPEC §6.10 #3 — "Notify me" on Favourites: restock and price-drop emails.
// Fire-and-forget: a mail failure must never roll back the stock or product write.

async function recipients(productId: number) {
  const favs = await prisma.favourite.findMany({ where: { productId, notify: true }, include: { user: { select: { email: true, name: true } } } });
  return favs.map((f) => f.user);
}

export async function notifyRestock(productId: number): Promise<number> {
  const [product, users] = await Promise.all([prisma.product.findUnique({ where: { id: productId }, select: { name: true } }), recipients(productId)]);
  if (!product || users.length === 0) return 0;
  const link = appUrl(routes.product(productId));
  await Promise.allSettled(
    users.map((u) =>
      sendMail({
        to: u.email,
        subject: `${product.name} is back in stock`,
        text: `Hi ${u.name},\n\n${product.name} just landed back in the warehouse. Sizes go fast — grab yours here:\n\n${link}\n\nYou're getting this because you turned on alerts for it in your Favourites.\n\n— ClothSE`,
      }),
    ),
  );
  return users.length;
}

export async function notifySale(productId: number): Promise<number> {
  const [product, users] = await Promise.all([prisma.product.findUnique({ where: { id: productId }, select: { name: true, price: true, salePrice: true } }), recipients(productId)]);
  if (!product || !product.salePrice || users.length === 0) return 0;
  const link = appUrl(routes.product(productId));
  const pct = Math.round((1 - product.salePrice / product.price) * 100);
  await Promise.allSettled(
    users.map((u) =>
      sendMail({
        to: u.email,
        subject: `Price drop: ${product.name} is now ${formatVnd(product.salePrice!)}`,
        text: `Hi ${u.name},\n\n${product.name} just dropped from ${formatVnd(product.price)} to ${formatVnd(product.salePrice!)} (-${pct}%). Sale lines don't restock, so it's while sizes last:\n\n${link}\n\nYou're getting this because you turned on alerts for it in your Favourites.\n\n— ClothSE`,
      }),
    ),
  );
  return users.length;
}
