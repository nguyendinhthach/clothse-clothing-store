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
        <span className={styles.label}>Họ tên</span>
        <input name="name" defaultValue={defaults.name} placeholder="Nguyễn Văn A" required autoComplete="name" className={styles.input} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input name="email" type="email" defaultValue={defaults.email} placeholder="ban@email.com" required autoComplete="email" className={styles.input} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Chủ đề</span>
        <select name="subject" defaultValue={CONTACT_SUBJECTS[0]} className={styles.select}>
          {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Nội dung</span>
        <textarea name="message" rows={6} required maxLength={4000} placeholder="Bạn cần gì cứ nói — nếu về đơn hàng, kèm mã đơn sẽ nhanh hơn." className={styles.textarea} />
      </label>
      <button type="submit" disabled={pending} className={styles.submit}>{pending ? "Đang gửi…" : "Gửi tin nhắn"}</button>
      {state.error && <div role="alert" className={`${styles.notice} ${styles.noticeErr}`}>{state.error}</div>}
      {state.sent && <div role="status" className={styles.notice}>Cảm ơn bạn — shop sẽ trả lời trong 1–2 ngày làm việc.</div>}
    </form>
  );
}
