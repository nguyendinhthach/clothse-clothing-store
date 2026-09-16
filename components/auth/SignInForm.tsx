"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { signInAction, signUpAction, type FormState } from "@/lib/actions/auth";
import { PASSWORD_MIN } from "@/lib/auth-rules";
import { routes } from "@/lib/routes";
import { PasswordField } from "./PasswordField";
import styles from "./auth.module.css";

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

interface Props {
  mode: "signin" | "signup";
  next: string;
  demo: DemoAccount[];
}

export function SignInForm({ mode, next, demo }: Props) {
  const signUp = mode === "signup";
  const [state, action, pending] = useActionState<FormState, FormData>(signUp ? signUpAction : signInAction, {});
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const withNext = (path: string) => (next && next !== routes.home ? `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}` : path);

  function fill(a: DemoAccount) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = a.email;
    (form.elements.namedItem("password") as HTMLInputElement).value = a.password;
    emailRef.current?.focus();
  }

  return (
    <section className={styles.panel}>
      <div className={styles.box}>
        <div className={styles.tabs} role="tablist">
          <Link href={withNext(routes.signIn)} role="tab" aria-selected={!signUp} className={`${styles.tab} ${!signUp ? styles.tabOn : ""}`}>
            Sign in
          </Link>
          <Link href={withNext(routes.signUp)} role="tab" aria-selected={signUp} className={`${styles.tab} ${signUp ? styles.tabOn : ""}`}>
            Sign up
          </Link>
        </div>

        <h1 className={styles.h1}>{signUp ? "Join the list" : "Welcome back"}</h1>
        <p className={styles.sub}>
          {signUp
            ? "One account for early access, saved sizes and order tracking. Takes about twenty seconds."
            : "Sign in to see your saved sizes, drop reminders and order history."}
        </p>

        <form ref={formRef} action={action} className={styles.form}>
          <input type="hidden" name="next" value={next} />
          {signUp && (
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input type="text" name="name" placeholder="Alex Mercer" autoComplete="name" className={styles.input} />
            </label>
          )}
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input ref={emailRef} type="email" name="email" placeholder="you@email.com" autoComplete="email" required className={styles.input} />
          </label>
          <PasswordField
            name="password"
            label="Password"
            placeholder={signUp ? `At least ${PASSWORD_MIN} characters` : "••••••••"}
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={signUp ? PASSWORD_MIN : undefined}
          />

          <div className={styles.row}>
            {signUp ? (
              <label className={styles.check}>
                <input type="checkbox" name="alerts" defaultChecked />
                Email me drop alerts
              </label>
            ) : (
              <span />
            )}
            {!signUp && (
              <Link href={routes.forgotPassword} className={styles.link}>
                Forgot password?
              </Link>
            )}
          </div>

          <button type="submit" disabled={pending} className={styles.submit}>
            {pending ? "One moment…" : signUp ? "Create account" : "Sign in"}
          </button>

          {state.error && <div className={styles.error} role="alert">{state.error}</div>}
        </form>

        {!signUp &&
          demo.map((a) => (
            <button key={a.email} type="button" onClick={() => fill(a)} className={styles.demo}>
              <span className={styles.demoLabel}>{a.label} — tap to fill</span>
              <span className={styles.demoValue}>
                {a.email} / {a.password}
              </span>
            </button>
          ))}

        <p className={styles.switch}>
          {signUp ? "Already a member? " : "New here? "}
          <Link href={withNext(signUp ? routes.signIn : routes.signUp)}>{signUp ? "Sign in instead" : "Create an account"}</Link>
        </p>
        <p className={styles.fine}>
          By continuing you agree to the ClothSE <Link href={routes.terms}>terms</Link> and <Link href={routes.privacy}>privacy policy</Link>.
        </p>
      </div>
    </section>
  );
}
