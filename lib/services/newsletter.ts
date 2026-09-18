import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult = { ok: true; already: boolean } | { ok: false; error: string };

/** SPEC §6.10 — store the signup; no weekly sender is built. Idempotent per email. */
export async function subscribe(rawEmail: string): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email chưa đúng định dạng." };

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) return { ok: true, already: true };

  await prisma.subscriber.create({
    data: { email, unsubscribeToken: randomBytes(24).toString("base64url") },
  });
  return { ok: true, already: false };
}
