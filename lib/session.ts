import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import type { Role } from "@/lib/generated/prisma/client";

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

/** The signed-in user from the session cookie, or null. Cheap: no DB hit. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return { id: Number(u.id), email: u.email, name: u.name, role: u.role };
}

/** Only allow same-origin paths as post-login targets. */
export function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : routes.home;
}

/** SPEC §2 — member-only pages redirect guests to sign-in and come back afterwards. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(nextPath ? `${routes.signIn}?next=${encodeURIComponent(nextPath)}` : routes.signIn);
  return user;
}

/** SPEC §2 — admin-only. 404 rather than 403 so the admin area is not advertised. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.signIn}?next=${encodeURIComponent(routes.admin)}`);
  if (user.role !== "ADMIN") notFound();
  return user;
}
