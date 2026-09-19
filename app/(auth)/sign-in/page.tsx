import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthArt } from "@/components/auth/AuthArt";
import { SignInForm } from "@/components/auth/SignInForm";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);

  const mode = sp.mode === "signup" ? "signup" : "signin";

  return (
    <>
      <AuthArt pill="Dành cho thành viên" title={<>Đứng đầu<br />hàng chờ</>}>
        Thành viên biết mỗi đợt hàng sớm 24 giờ, được báo khi size đã lưu có lại, và lưu địa chỉ để đặt nhanh hơn.
      </AuthArt>
      <SignInForm mode={mode} next={next} />
    </>
  );
}
