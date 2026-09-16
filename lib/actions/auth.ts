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
  if (!email || !password) return { error: "Enter your email and password to continue." };

  try {
    // On success Auth.js throws a Next redirect — it must propagate.
    await signIn("credentials", { email, password, redirectTo: safeNext(str(fd, "next")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email or password is incorrect." };
    throw e;
  }
  return {};
}

// ─── Sign up ──────────────────────────────────────────────────────────────────

export async function signUpAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = str(fd, "password");
  if (!email || !password) return { error: "Enter an email and password to continue." };

  const created = await createUser({ email, name: str(fd, "name"), password });
  if (!created.ok) return { error: created.error };

  // "Email me drop alerts" checkbox → newsletter list (SPEC §6.10 #4)
  if (fd.get("alerts") === "on") await subscribe(email).catch(() => undefined);

  try {
    await signIn("credentials", { email: normalizeEmail(email), password, redirectTo: safeNext(str(fd, "next")) });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created, but sign-in failed. Try signing in." };
    throw e;
  }
  return {};
}

// ─── Forgot / reset password (SPEC §6.10 #1) ──────────────────────────────────

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  if (!isEmail(email)) return { error: "Enter a valid email address." };

  const reset = await createPasswordReset(email);
  if (reset) {
    const link = appUrl(`${routes.resetPassword}?token=${reset.token}`);
    await sendMail({
      to: email,
      subject: "Reset your ClothSE password",
      text: `Hi ${reset.name},\n\nSomeone asked to reset the password for this ClothSE account. Open the link below within 30 minutes to choose a new one:\n\n${link}\n\nIf this wasn't you, ignore this email — your password stays the same.\n\n— ClothSE`,
    });
  }
  // Same answer whether or not the account exists — never reveal which.
  return { done: email };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  if (!token) return { error: "This reset link is invalid or has expired. Request a new one." };
  if (password !== str(fd, "confirm")) return { error: "Passwords don't match." };

  const result = await resetPassword(token, password);
  if (!result.ok) return { error: result.error };
  return { done: "ok" };
}
