"use server";

import { CONTACT_SUBJECTS } from "@/lib/content/contact";
import { sendMail } from "@/lib/mail";
import { isEmail } from "@/lib/services/users";
import { getCurrentUser } from "@/lib/session";

export interface ContactState {
  error?: string;
  sent?: boolean;
  /** Changes on every successful send so the form can remount and clear. */
  at?: number;
}

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" ? v.trim() : ""; };

/** Contact form → email to the shop inbox (CONTACT_TO, else the SMTP account). Reply-to is the sender. */
export async function sendContactAction(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const name = str(fd, "name");
  const email = str(fd, "email");
  const subject = str(fd, "subject");
  const message = str(fd, "message");

  if (!name || !email || !message) return { error: "Cần đủ họ tên, email và nội dung" };
  if (!isEmail(email)) return { error: "Email này nhìn chưa đúng" };
  if (message.length > 4000) return { error: "Nội dung tối đa 4000 ký tự" };
  const topic = (CONTACT_SUBJECTS as readonly string[]).includes(subject) ? subject : "Khác";

  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  if (!to) {
    console.log(`\n[contact] No CONTACT_TO / SMTP_USER — message from ${name} <${email}> (${topic}):\n${message.replace(/^/gm, "  ")}\n`);
    return { sent: true, at: Date.now() };
  }

  const user = await getCurrentUser();
  const who = user ? `Khách đã đăng nhập #${user.id} (${user.email})` : "Chưa đăng nhập";
  try {
    await sendMail({
      to,
      replyTo: `${name} <${email}>`,
      subject: `[ClothSE liên hệ] ${topic} — ${name}`,
      text: `Từ: ${name} <${email}>\nChủ đề: ${topic}\n${who}\n\n${message}`,
    });
  } catch (e) {
    console.error("[contact] send failed", e);
    return { error: "Chưa gửi được — bạn email thẳng cho shop nhé" };
  }
  return { sent: true, at: Date.now() };
}
