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
          <span>←</span>Về đăng nhập
        </Link>

        {state.done ? (
          <div className={styles.artCopy} style={{ position: "static", padding: 0 }}>
            <span className={styles.stamp}>
              <span className={`${styles.dot} ${styles.dotAccent}`} />
              Đã gửi link
            </span>
            <h1 className={styles.h1}>Kiểm tra email</h1>
            <p className={styles.sub} style={{ marginBottom: 8 }}>Nếu địa chỉ này có tài khoản, link đặt lại mật khẩu đã được gửi tới</p>
            <p className={styles.sentTo}>{state.done}</p>
            <div className={styles.stack}>
              <Link href={routes.signIn} className={styles.submit} style={{ marginTop: 0 }}>Về đăng nhập</Link>
              <form action={action}>
                <input type="hidden" name="email" value={state.done} />
                <button type="submit" disabled={pending} className={styles.ghost} style={{ width: "100%" }}>
                  {pending ? "Đang gửi…" : "Gửi lại link"}
                </button>
              </form>
            </div>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Vài phút vẫn chưa thấy? Kiểm tra mục spam, hoặc <Link href={routes.contact}>liên hệ hỗ trợ</Link>.
            </p>
          </div>
        ) : (
          <div>
            <h1 className={styles.h1}>Đặt lại mật khẩu</h1>
            <p className={styles.sub}>Nhập email, shop sẽ gửi bạn link để đặt lại.</p>
            <form action={action} className={styles.form}>
              <label className={styles.field}>
                <span className={styles.label}>Email</span>
                <input type="email" name="email" placeholder="ban@email.com" autoComplete="email" required className={styles.input} />
              </label>
              <button type="submit" disabled={pending} className={styles.submit}>
                {pending ? "Đang gửi…" : "Gửi link đặt lại"}
              </button>
              {state.error && <div className={styles.error} role="alert">{state.error}</div>}
            </form>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Link hết hạn sau 30 phút. Vẫn vướng? <Link href={routes.contact}>Liên hệ hỗ trợ</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
