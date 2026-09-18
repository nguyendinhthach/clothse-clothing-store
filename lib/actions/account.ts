"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { deleteAddress, saveAddress, setDefaultAddress, type AddressInput, type AddressResult } from "@/lib/services/addresses";
import { changePassword, updateProfile, type AccountResult } from "@/lib/services/users";

export interface AccountState {
  error?: string;
  done?: string;
}

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v : ""; };

export async function updateProfileAction(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser(routes.account());
  const r = await updateProfile(user.id, { name: str(fd, "name"), email: str(fd, "email"), phone: str(fd, "phone") });
  if (!r.ok) return { error: r.error };
  revalidatePath("/", "layout"); // header initials / email
  return { done: "Đã lưu" };
}

export async function changePasswordAction(_prev: AccountState, fd: FormData): Promise<AccountState> {
  const user = await requireUser(routes.account("settings"));
  const r = await changePassword(user.id, str(fd, "current"), str(fd, "next"), str(fd, "confirm"));
  return r.ok ? { done: "Đã đổi mật khẩu" } : { error: r.error };
}

function after(r: AddressResult) {
  if (r.ok) {
    revalidatePath(routes.account("addresses"));
    revalidatePath(routes.checkout);
  }
  return r;
}

export async function saveAddressAction(input: AddressInput): Promise<AddressResult> {
  const user = await requireUser(routes.account("addresses"));
  return after(await saveAddress(user.id, input));
}
export async function deleteAddressAction(id: number): Promise<AddressResult> {
  const user = await requireUser(routes.account("addresses"));
  return after(await deleteAddress(user.id, id));
}
export async function setDefaultAddressAction(id: number): Promise<AddressResult> {
  const user = await requireUser(routes.account("addresses"));
  return after(await setDefaultAddress(user.id, id));
}

export type { AccountResult };
