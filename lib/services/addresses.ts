import { prisma } from "@/lib/prisma";

export async function getAddresses(userId: number) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
}

export async function getDefaultAddress(userId: number) {
  return (await prisma.address.findFirst({ where: { userId, isDefault: true } })) ?? (await prisma.address.findFirst({ where: { userId }, orderBy: { id: "asc" } }));
}

export type AddressResult = { ok: true } | { ok: false; error: string };

export interface AddressInput {
  id?: number;
  label: string;
  name: string;
  phone: string;
  line: string;
  city: string;
  isDefault: boolean;
}

/** Create or update one of the user's addresses. The first address is always the default. */
export async function saveAddress(userId: number, input: AddressInput): Promise<AddressResult> {
  const data = { label: input.label.trim() || "Home", name: input.name.trim(), phone: input.phone.trim(), line: input.line.trim(), city: input.city.trim() };
  if (!data.name || !data.phone || !data.line || !data.city) return { ok: false, error: "Name, phone, address line and city are required." };
  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = input.isDefault || count === 0;
  await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    if (input.id) {
      const owned = await tx.address.findFirst({ where: { id: input.id, userId }, select: { isDefault: true } });
      if (!owned) throw new Error("NOT_FOUND");
      await tx.address.update({ where: { id: input.id }, data: { ...data, isDefault: makeDefault || owned.isDefault } });
    } else {
      await tx.address.create({ data: { ...data, userId, isDefault: makeDefault } });
    }
  }).catch((e) => { if (e instanceof Error && e.message === "NOT_FOUND") return { ok: false, error: "Address not found." }; throw e; });
  return { ok: true };
}

export async function deleteAddress(userId: number, id: number): Promise<AddressResult> {
  const a = await prisma.address.findFirst({ where: { id, userId } });
  if (!a) return { ok: false, error: "Address not found." };
  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (a.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { id: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  return { ok: true };
}

export async function setDefaultAddress(userId: number, id: number): Promise<AddressResult> {
  const a = await prisma.address.findFirst({ where: { id, userId } });
  if (!a) return { ok: false, error: "Address not found." };
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  return { ok: true };
}
