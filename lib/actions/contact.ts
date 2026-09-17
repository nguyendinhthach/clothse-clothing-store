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

  if (!name || !email || !message) return { error: "Name, email and message are required" };
  if (!isEmail(email)) return { error: "That email address looks off" };
  if (message.length > 4000) return { error: "Keep the message under 4000 characters" };
  const topic = (CONTACT_SUBJECTS as readonly string[]).includes(subject) ? subject : "Other";

  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  if (!to) {
    console.log(`\n[contact] No CONTACT_TO / SMTP_USER — message from ${name} <${email}> (${topic}):\n${message.replace(/^/gm, "  ")}\n`);
    return { sent: true, at: Date.now() };
  }

  const user = await getCurrentUser();
  const who = user ? `Signed-in customer #${user.id} (${user.email})` : "Not signed in";
  try {
    await sendMail({
      to,
      replyTo: `${name} <${email}>`,
      subject: `[ClothSE contact] ${topic} — ${name}`,
      text: `From: ${name} <${email}>\nSubject: ${topic}\n${who}\n\n${message}`,
    });
  } catch (e) {
    console.error("[contact] send failed", e);
    return { error: "Couldn't send right now — email us directly instead" };
  }
  return { sent: true, at: Date.now() };
}
