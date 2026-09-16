import nodemailer from "nodemailer";

// SPEC §6.10 — Nodemailer over Gmail SMTP with an App Password.
// Without SMTP_USER / SMTP_PASS in .env the message is printed to the server
// console instead, so every email flow is testable locally before the Gmail
// account exists.

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || (user ? `ClothSE <${user}>` : "ClothSE <no-reply@clothse.local>");

const transport = user && pass ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) : null;

export const mailConfigured = transport !== null;

export async function sendMail(mail: Mail): Promise<void> {
  if (!transport) {
    console.log(`\n[mail] SMTP not configured — would send:\n  To: ${mail.to}\n  Subject: ${mail.subject}\n${mail.text.replace(/^/gm, "  ")}\n`);
    return;
  }
  await transport.sendMail({ from, ...mail });
}

/** Absolute URL for links inside emails. */
export function appUrl(path: string): string {
  const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return base + path;
}
