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
          <span>←</span>Về đăng nhập
        </Link>

        {state.done ? (
          <div>
            <span className={styles.stamp}>
              <span className={`${styles.dot} ${styles.dotAccent}`} />
              Đã đổi mật khẩu
            </span>
            <h1 className={styles.h1}>Mật khẩu đã được đổi</h1>
            <p className={styles.sub}>Đăng nhập bằng mật khẩu mới để tiếp tục.</p>
            <Link href={routes.signIn} className={styles.submit} style={{ marginTop: 0 }}>Đăng nhập</Link>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Không phải bạn yêu cầu? <Link href={routes.contact}>Liên hệ hỗ trợ</Link> ngay.
            </p>
          </div>
        ) : !token ? (
          <div>
            <h1 className={styles.h1}>Link không hợp lệ</h1>
            <p className={styles.sub}>Link đặt lại bị thiếu hoặc đã hết hạn. Yêu cầu link mới rồi thử lại.</p>
            <Link href={routes.forgotPassword} className={styles.submit} style={{ marginTop: 0 }}>Yêu cầu link mới</Link>
          </div>
        ) : (
          <div>
            <h1 className={styles.h1}>Đặt mật khẩu mới</h1>
            <p className={styles.sub}>Chọn mật khẩu mới cho tài khoản ClothSE của bạn.</p>
            <form action={action} className={styles.form}>
              <input type="hidden" name="token" value={token} />
              <PasswordField name="password" label="Mật khẩu mới" placeholder={`Ít nhất ${PASSWORD_MIN} ký tự`} autoComplete="new-password" minLength={PASSWORD_MIN} meter />
              <PasswordField name="confirm" label="Nhập lại mật khẩu mới" placeholder="Gõ lại lần nữa" autoComplete="new-password" minLength={PASSWORD_MIN} />
              <button type="submit" disabled={pending} className={styles.submit}>
                {pending ? "Đang lưu…" : "Đổi mật khẩu"}
              </button>
              {state.error && <div className={styles.error} role="alert">{state.error}</div>}
            </form>
            <p className={styles.fine} style={{ marginTop: "clamp(22px, 2.6vw, 30px)" }}>
              Ít nhất {PASSWORD_MIN} ký tự, trộn chữ, số và ký hiệu.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
