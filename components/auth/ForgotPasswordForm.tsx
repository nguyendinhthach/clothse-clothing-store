"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type FormState } from "@/lib/actions/auth";
import { routes } from "@/lib/routes";
import styles from "./auth.module.css";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});

  return (
    <section className={styles.panel}>
      <div className={styles.box}>
        <Link href={routes.signIn} className={styles.backLink} style={{ marginBottom: "clamp(24px, 3vw, 34px)" }}>
          <span>←</span>Back to sign in
        </Link>

        {state.done ? (
          <div className={styles.artCopy} style={{ position: "static", padding: 0 }}>
            <span className={styles.stamp}>
              <span className={`${styles.dot} ${styles.dotAccent}`} />
              Link sent
            </span>
            <h1 className={styles.h1}>Check your email</h1>
            <p className={styles.sub} style={{ marginBottom: 8 }}>If an account exists for this address, we&apos;ve sent a reset link to</p>
            <p className={styles.sentTo}>{state.done}</p>
            <div className={styles.stack}>
              <Link href={routes.signIn} className={styles.submit} style={{ marginTop: 0 }}>Back to sign in</Link>
              <form action={action}>
                <input type="hidden" name="email" value={state.done} />
                <button type="submit" disabled={pending} className={styles.ghost} style={{ width: "100%" }}>
                  {pending ? "Sending…" : "Resend link"}
                </button>
              </form>
            </div>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Nothing in your inbox after a few minutes? Check spam, or <Link href={routes.contact}>contact support</Link>.
            </p>
          </div>
        ) : (
          <div>
            <h1 className={styles.h1}>Reset your password</h1>
            <p className={styles.sub}>Enter your email and we&apos;ll send you a link to reset it.</p>
            <form action={action} className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input type="email" name="email" placeholder="you@email.com" autoComplete="email" required className={styles.input} />
              </label>
              <button type="submit" disabled={pending} className={styles.submit}>
                {pending ? "Sending…" : "Send reset link"}
              </button>
              {state.error && <div className={styles.error} role="alert">{state.error}</div>}
            </form>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Reset links expire after 30 minutes. Still stuck? <Link href={routes.contact}>Contact support</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
