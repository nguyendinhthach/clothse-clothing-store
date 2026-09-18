"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { appUrl, sendMail } from "@/lib/mail";
import { routes } from "@/lib/routes";
import { safeNext } from "@/lib/session";
import { subscribe } from "@/lib/services/newsletter";
import { createPasswordReset, createUser, isEmail, normalizeEmail, resetPassword } from "@/lib/services/users";

export interface FormState {
  error?: string;
  /** Set by flows that finish without a redirect (forgot / reset). */
  done?: string;
}

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

// ─── Sign in ──────────────────────────────────────────────────────────────────

export async function signInAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  const password = str(fd, "password");
  if (!email || !password) return { error: "Nhập email và mật khẩu để tiếp tục." };

  try {
    // On success Auth.js throws a Next redirect — it must propagate.
    await signIn("credentials", { email, password, redirectTo: safeNext(str(fd, "next")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email hoặc mật khẩu không đúng." };
    throw e;
  }
  return {};
}

// ─── Sign up ──────────────────────────────────────────────────────────────────

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: "Nhập email và mật khẩu để tiếp tục." };

  const created = await createUser({ email, name: str(fd, "name"), password });
  if (!created.ok) return { error: created.error };

  // "Email me drop alerts" checkbox → newsletter list (SPEC §6.10 #4)
  if (fd.get("alerts") === "on") await subscribe(email).catch(() => undefined);

  try {
    await signIn("credentials", { email: normalizeEmail(email), password, redirectTo: safeNext(str(fd, "next")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Đã tạo tài khoản nhưng đăng nhập lỗi. Bạn thử đăng nhập lại nhé." };
    throw e;
  }
  return {};
}

// ─── Forgot / reset password (SPEC §6.10 #1) ──────────────────────────────────

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  if (!isEmail(email)) return { error: "Email chưa đúng định dạng." };

  const reset = await createPasswordReset(email);
  if (reset) {
    const link = appUrl(`${routes.resetPassword}?token=${reset.token}`);
    await sendMail({
      to: email,
      subject: "Đặt lại mật khẩu ClothSE",
      text: `Chào ${reset.name},\n\nCó yêu cầu đặt lại mật khẩu cho tài khoản ClothSE này. Mở link dưới đây trong 30 phút để chọn mật khẩu mới:\n\n${link}\n\nNếu không phải bạn, cứ bỏ qua email này — mật khẩu vẫn giữ nguyên.\n\n— ClothSE`,
    });
  }
  // Same answer whether or not the account exists — never reveal which.
  return { done: email };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  if (!token) return { error: "Link đặt lại không hợp lệ hoặc đã hết hạn. Yêu cầu link mới nhé." };
  if (password !== str(fd, "confirm")) return { error: "Hai mật khẩu không khớp." };

  const result = await resetPassword(token, password);
  if (!result.ok) return { error: result.error };
  return { done: "ok" };
}
