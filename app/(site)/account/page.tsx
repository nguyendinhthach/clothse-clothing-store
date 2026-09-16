import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Account" };

/** Placeholder until the Account page is ported (SPEC §12, week 5). Proves the member guard. */
export default async function AccountPage() {
  const user = await requireUser(routes.account());
  return (
    <div className="container" style={{ paddingBlock: 80, minHeight: "50vh" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 48, margin: 0, textTransform: "uppercase" }}>Account</h1>
      <p style={{ color: "var(--muted)" }}>
        Signed in as {user.name} ({user.email}) — role {user.role}.
      </p>
    </div>
  );
}
