import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PASSWORD_MIN } from "@/lib/auth-rules";

const RESET_TTL_MS = 30 * 60 * 1000; // SPEC §6.10: 30 minutes
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const isEmail = (e: string) => EMAIL_RE.test(e);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// ─── Sign in / sign up ────────────────────────────────────────────────────────

export async function verifyCredentials(rawEmail: string, password: string) {
  const email = normalizeEmail(rawEmail);
  if (!email || !password) return null;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  return (await compare(password, user.passwordHash)) ? user : null;
}

export type CreateUserResult = { ok: true; id: number } | { ok: false; error: string };

export async function createUser(input: { email: string; name: string; password: string }): Promise<CreateUserResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim() || email.split("@")[0];
  if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < PASSWORD_MIN) return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters.` };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, error: "An account with this email already exists. Sign in instead." };
  }
  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hash(input.password, 10), role: "USER" },
    select: { id: true },
  });
  return { ok: true, id: user.id };
}

// ─── Password reset (SPEC §6.10: hashed token, 30-minute expiry, single use) ──

/**
 * Creates a reset token for the email if an account exists. Returns the RAW
 * token to put in the email link (only the hash is stored), or null when no
 * account matches — callers must not reveal which case happened.
 */
export async function createPasswordReset(rawEmail: string): Promise<{ token: string; name: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(rawEmail) }, select: { id: true, name: true } });
  if (!user) return null;
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return { token, name: user.name };
}

export type ResetResult = { ok: true } | { ok: false; error: string };

export async function resetPassword(token: string, password: string): Promise<ResetResult> {
  if (password.length < PASSWORD_MIN) return { ok: false, error: `Password must be at least ${PASSWORD_MIN} characters.` };
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true };
}
