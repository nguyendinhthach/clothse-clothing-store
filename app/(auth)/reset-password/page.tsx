import type { Metadata } from "next";
import { AuthArt } from "@/components/auth/AuthArt";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <>
      <AuthArt pill="Secure link verified" title={<>One new<br />key, please</>}>
        Pick something you haven&apos;t used elsewhere. We&apos;ll sign you out of other devices once it&apos;s set.
      </AuthArt>
      <ResetPasswordForm token={token} />
    </>
  );
}
