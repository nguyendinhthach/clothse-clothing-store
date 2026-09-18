"use client";

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/lib/actions/newsletter";
import styles from "./home.module.css";

const initial: NewsletterState = { status: "idle", message: "Không spam. Huỷ đăng ký bất cứ lúc nào." };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeAction, initial);
  const noteClass = state.status === "ok" ? styles.newsNoteOk : state.status === "error" ? styles.newsNoteErr : "";

  return (
    <section className={styles.news}>
      <div className={`container ${styles.newsInner}`}>
        <div>
          <h2 className={styles.newsH2}>
            Biết hàng mới
            <br />
            <span>trước khi hết size</span>
          </h2>
          <p className={styles.newsLead}>Mỗi tuần một email. Hàng mới báo trước, không gì khác.</p>
        </div>
        <form action={action} className={styles.newsForm}>
          <div className={styles.newsRow}>
            <input type="email" name="email" required placeholder="ban@email.com" className={styles.newsInput} aria-label="Địa chỉ email" />
            <button type="submit" disabled={pending} className={styles.newsBtn}>
              {pending ? "Đang đăng ký…" : "Đăng ký"}
            </button>
          </div>
          <span className={`${styles.newsNote} ${noteClass}`} aria-live="polite">{state.message}</span>
        </form>
      </div>
    </section>
  );
}
