import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthArt } from "@/components/auth/AuthArt";
import { SignInForm, type DemoAccount } from "@/components/auth/SignInForm";
import { getCurrentUser, safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);

  const mode = sp.mode === "signup" ? "signup" : "signin";

  // SPEC §2 — the two seeded demo accounts, shown as tap-to-fill helpers.
  const demo: DemoAccount[] = [];
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    demo.push({ label: "Admin test account", email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD });
  }
  if (process.env.SEED_USER_EMAIL && process.env.SEED_USER_PASSWORD) {
    demo.push({ label: "Regular test account", email: process.env.SEED_USER_EMAIL, password: process.env.SEED_USER_PASSWORD });
  }

  return (
    <>
      <AuthArt pill="Members only" title={<>First in<br />the queue</>}>
        Members get every drop 24 hours early, restock alerts on saved sizes, and free returns for life.
      </AuthArt>
      <SignInForm mode={mode} next={next} demo={demo} />
    </>
  );
}
