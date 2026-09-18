import type { Metadata } from "next";
import { AuthArt } from "@/components/auth/AuthArt";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Mật khẩu mới" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <>
      <AuthArt pill="Link đã xác thực" title={<>Một chiếc<br />chìa khoá mới</>}>
        Chọn mật khẩu bạn chưa dùng ở đâu khác. Đặt xong, các thiết bị khác sẽ bị đăng xuất.
      </AuthArt>
      <ResetPasswordForm token={token} />
    </>
  );
}
