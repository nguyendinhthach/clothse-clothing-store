import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Store Management" };

/** Placeholder until Store Management is ported (SPEC §12, week 3). Proves the admin guard. */
export default async function AdminPage() {
  const user = await requireAdmin();
  return (
    <div className="container" style={{ paddingBlock: 80, minHeight: "50vh" }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 48, margin: 0, textTransform: "uppercase" }}>Store Management</h1>
      <p style={{ color: "var(--muted)" }}>Admin area — {user.email}.</p>
    </div>
  );
}
