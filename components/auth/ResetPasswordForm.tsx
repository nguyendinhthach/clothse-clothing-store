"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type FormState } from "@/lib/actions/auth";
import { PASSWORD_MIN } from "@/lib/auth-rules";
import { routes } from "@/lib/routes";
import { PasswordField } from "./PasswordField";
import styles from "./auth.module.css";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});

  return (
    <section className={styles.panel}>
      <div className={styles.box}>
        <Link href={routes.signIn} className={styles.backLink} style={{ marginBottom: "clamp(24px, 3vw, 34px)" }}>
          <span>←</span>Back to sign in
        </Link>

        {state.done ? (
          <div>
            <span className={styles.stamp}>
              <span className={`${styles.dot} ${styles.dotAccent}`} />
              Password updated
            </span>
            <h1 className={styles.h1}>Your password has been updated</h1>
            <p className={styles.sub}>Sign in with your new password to pick up where you left off.</p>
            <Link href={routes.signIn} className={styles.submit} style={{ marginTop: 0 }}>Sign in</Link>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Didn&apos;t request this change? <Link href={routes.contact}>Contact support</Link> right away.
            </p>
          </div>
        ) : !token ? (
          <div>
            <h1 className={styles.h1}>Link not valid</h1>
            <p className={styles.sub}>This reset link is missing or has expired. Request a new one and try again.</p>
            <Link href={routes.forgotPassword} className={styles.submit} style={{ marginTop: 0 }}>Request a new link</Link>
          </div>
        ) : (
          <div>
            <h1 className={styles.h1}>Set a new password</h1>
            <p className={styles.sub}>Choose a new password for your ClothSE account.</p>
            <form action={action} className={styles.form}>
              <input type="hidden" name="token" value={token} />
              <PasswordField name="password" label="New password" placeholder={`At least ${PASSWORD_MIN} characters`} autoComplete="new-password" minLength={PASSWORD_MIN} meter />
              <PasswordField name="confirm" label="Confirm new password" placeholder="Repeat it" autoComplete="new-password" minLength={PASSWORD_MIN} />
              <button type="submit" disabled={pending} className={styles.submit}>
                {pending ? "Saving…" : "Update password"}
              </button>
              {state.error && <div className={styles.error} role="alert">{state.error}</div>}
            </form>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Use at least {PASSWORD_MIN} characters with a mix of letters, numbers and symbols.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
