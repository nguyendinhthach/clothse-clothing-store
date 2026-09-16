"use client";

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/lib/actions/newsletter";
import styles from "./home.module.css";

const initial: NewsletterState = { status: "idle", message: "No spam. Unsubscribe in one click." };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeAction, initial);
  const noteClass = state.status === "ok" ? styles.newsNoteOk : state.status === "error" ? styles.newsNoteErr : "";

  return (
    <section className={styles.news}>
      <div className={`container ${styles.newsInner}`}>
        <div>
          <h2 className={styles.newsH2}>
            Get the drop
            <br />
            <span>before it&apos;s gone</span>
          </h2>
          <p className={styles.newsLead}>One email a week. New stock first, no noise.</p>
        </div>
        <form action={action} className={styles.newsForm}>
          <div className={styles.newsRow}>
            <input type="email" name="email" required placeholder="you@email.com" className={styles.newsInput} aria-label="Email address" />
            <button type="submit" disabled={pending} className={styles.newsBtn}>
              {pending ? "Signing up…" : "Sign me up"}
            </button>
          </div>
          <span className={`${styles.newsNote} ${noteClass}`} aria-live="polite">{state.message}</span>
        </form>
      </div>
    </section>
  );
}
