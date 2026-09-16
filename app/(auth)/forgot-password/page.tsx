import type { Metadata } from "next";
import { AuthArt } from "@/components/auth/AuthArt";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthArt pill="Account recovery" title={<>Locked out,<br />not left out</>}>
        Your saved sizes, favourites and order history are waiting. One email and you&apos;re back in.
      </AuthArt>
      <ForgotPasswordForm />
    </>
  );
}
