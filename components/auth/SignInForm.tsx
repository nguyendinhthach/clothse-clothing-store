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
            Đăng nhập
          </Link>
          <Link href={withNext(routes.signUp)} role="tab" aria-selected={signUp} className={`${styles.tab} ${signUp ? styles.tabOn : ""}`}>
            Đăng ký
          </Link>
        </div>

        <h1 className={styles.h1}>{signUp ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
        <p className={styles.sub}>
          {signUp
            ? "Một tài khoản để biết hàng sớm, lưu size và theo dõi đơn. Mất chừng hai mươi giây."
            : "Đăng nhập để xem size đã lưu, nhắc đợt hàng mới và lịch sử đơn."}
        </p>

        <form ref={formRef} action={action} className={styles.form}>
          <input type="hidden" name="next" value={next} />
          {signUp && (
            <label className={styles.field}>
              <span className={styles.label}>Họ tên</span>
              <input type="text" name="name" placeholder="Nguyễn Văn A" autoComplete="name" className={styles.input} />
            </label>
          )}
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input ref={emailRef} type="email" name="email" placeholder="ban@email.com" autoComplete="email" required className={styles.input} />
          </label>
          <PasswordField
            name="password"
            label="Mật khẩu"
            placeholder={signUp ? `Ít nhất ${PASSWORD_MIN} ký tự` : "••••••••"}
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={signUp ? PASSWORD_MIN : undefined}
          />

          <div className={styles.row}>
            {signUp ? (
              <label className={styles.check}>
                <input type="checkbox" name="alerts" defaultChecked />
                Báo tôi khi có hàng mới
              </label>
            ) : (
              <span />
            )}
            {!signUp && (
              <Link href={routes.forgotPassword} className={styles.link}>
                Quên mật khẩu?
              </Link>
            )}
          </div>

          <button type="submit" disabled={pending} className={styles.submit}>
            {pending ? "Chờ một chút…" : signUp ? "Tạo tài khoản" : "Đăng nhập"}
          </button>

          {state.error && <div className={styles.error} role="alert">{state.error}</div>}
        </form>

        {!signUp &&
          demo.map((a) => (
            <button key={a.email} type="button" onClick={() => fill(a)} className={styles.demo}>
              <span className={styles.demoLabel}>{a.label} — chạm để điền</span>
              <span className={styles.demoValue}>
                {a.email} / {a.password}
              </span>
            </button>
          ))}

        <p className={styles.switch}>
          {signUp ? "Đã có tài khoản? " : "Lần đầu tới đây? "}
          <Link href={withNext(signUp ? routes.signIn : routes.signUp)}>{signUp ? "Đăng nhập" : "Tạo tài khoản"}</Link>
        </p>
        <p className={styles.fine}>
          Tiếp tục là bạn đồng ý với <Link href={routes.terms}>điều khoản</Link> và <Link href={routes.privacy}>chính sách bảo mật</Link> của ClothSE.
        </p>
      </div>
    </section>
  );
}
