"use server";

import { subscribe } from "@/lib/services/newsletter";

export interface NewsletterState {
  status: "idle" | "ok" | "error";
  message: string;
}

export async function subscribeAction(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const email = formData.get("email");
  if (typeof email !== "string") return { status: "error", message: "Email chưa đúng định dạng." };

  const result = await subscribe(email);
  if (!result.ok) return { status: "error", message: result.error };
  return {
    status: "ok",
    message: result.already
      ? "Bạn đã có trong danh sách rồi — hàng mới tuần này sẽ tới hộp thư."
      : "Xong! Hàng mới tuần này sẽ tới hộp thư của bạn.",
  };
}
