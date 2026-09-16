import { prisma } from "@/lib/prisma";

export async function getAddresses(userId: number) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
}

export async function getDefaultAddress(userId: number) {
  return (await prisma.address.findFirst({ where: { userId, isDefault: true } })) ?? (await prisma.address.findFirst({ where: { userId }, orderBy: { id: "asc" } }));
}
