import type { Metadata } from "next";
import { AuthArt } from "@/components/auth/AuthArt";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthArt pill="Khôi phục tài khoản" title={<>Quên mật khẩu,<br />không mất gì</>}>
        Size đã lưu, món yêu thích và lịch sử đơn vẫn còn nguyên. Một email là bạn vào lại được.
      </AuthArt>
      <ForgotPasswordForm />
    </>
  );
}
