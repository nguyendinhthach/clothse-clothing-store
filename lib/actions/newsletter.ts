"use server";

import { subscribe } from "@/lib/services/newsletter";

export interface NewsletterState {
  status: "idle" | "ok" | "error";
  message: string;
}

export async function subscribeAction(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const email = formData.get("email");
  if (typeof email !== "string") return { status: "error", message: "Enter a valid email address." };

  const result = await subscribe(email);
  if (!result.ok) return { status: "error", message: result.error };
  return {
    status: "ok",
    message: result.already
      ? "You're already on the list — this week's arrivals are on their way."
      : "You're in — check your inbox for this week's arrivals.",
  };
}
