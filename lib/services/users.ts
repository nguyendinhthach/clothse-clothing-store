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
  if (!isEmail(email)) return { ok: false, error: "Email chưa đúng định dạng." };
  if (input.password.length < PASSWORD_MIN) return { ok: false, error: `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.` };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, error: "Email này đã có tài khoản. Bạn đăng nhập nhé." };
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
  if (password.length < PASSWORD_MIN) return { ok: false, error: `Mật khẩu cần ít nhất ${PASSWORD_MIN} ký tự.` };
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, error: "Link đặt lại không hợp lệ hoặc đã hết hạn. Yêu cầu link mới nhé." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true };
}

// ─── Account (profile + password) ─────────────────────────────────────────────

export type AccountResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(userId: number, input: { name: string; email: string; phone: string }): Promise<AccountResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  if (!name) return { ok: false, error: "Nhập họ tên của bạn." };
  if (!isEmail(email)) return { ok: false, error: "Email chưa đúng định dạng." };
  const clash = await prisma.user.findFirst({ where: { email, NOT: { id: userId } }, select: { id: true } });
  if (clash) return { ok: false, error: "Email này đang được tài khoản khác dùng." };
  await prisma.user.update({ where: { id: userId }, data: { name, email, phone: phone || null } });
  return { ok: true };
}

export async function changePassword(userId: number, current: string, next: string, confirm: string): Promise<AccountResult> {
  if (next.length < PASSWORD_MIN) return { ok: false, error: `Mật khẩu mới cần ít nhất ${PASSWORD_MIN} ký tự.` };
  if (next !== confirm) return { ok: false, error: "Hai mật khẩu mới không khớp." };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await compare(current, user.passwordHash))) return { ok: false, error: "Mật khẩu hiện tại không đúng." };
  if (await compare(next, user.passwordHash)) return { ok: false, error: "Mật khẩu mới phải khác mật khẩu hiện tại." };
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(next, 10) } });
  return { ok: true };
}
