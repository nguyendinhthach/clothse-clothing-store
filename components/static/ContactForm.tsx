"use client";

import { useActionState } from "react";
import { sendContactAction, type ContactState } from "@/lib/actions/contact";
import { CONTACT_SUBJECTS } from "@/lib/content/contact";
import styles from "./static.module.css";

export function ContactForm({ defaults }: { defaults: { name: string; email: string } }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactAction, {});
  // A successful send remounts the form (key on the outer element) so the message clears.
  return (
    <form key={state.at ?? 0} action={action} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>Full name</span>
        <input name="name" defaultValue={defaults.name} placeholder="Alex Mercer" required autoComplete="name" className={styles.input} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input name="email" type="email" defaultValue={defaults.email} placeholder="you@email.com" required autoComplete="email" className={styles.input} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Subject</span>
        <select name="subject" defaultValue={CONTACT_SUBJECTS[0]} className={styles.select}>
          {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Message</span>
        <textarea name="message" rows={6} required maxLength={4000} placeholder="Tell us what you need — order number helps if it's about a purchase." className={styles.textarea} />
      </label>
      <button type="submit" disabled={pending} className={styles.submit}>{pending ? "Sending…" : "Send message"}</button>
      {state.error && <div role="alert" className={`${styles.notice} ${styles.noticeErr}`}>{state.error}</div>}
      {state.sent && <div role="status" className={styles.notice}>Thanks — we&apos;ll get back to you within 1–2 business days.</div>}
    </form>
  );
}
