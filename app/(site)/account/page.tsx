import type { Metadata } from "next";
import Link from "next/link";
import { AddressesPanel, ProfilePanel, SecurityPanel } from "@/components/account/AccountPanels";
import { prisma } from "@/lib/prisma";
import { routes, type AccountTab } from "@/lib/routes";
import { getAddresses } from "@/lib/services/addresses";
import { requireUser } from "@/lib/session";
import styles from "@/components/account/account.module.css";

export const metadata: Metadata = { title: "My Account" };

const TABS: { tab: AccountTab; label: string }[] = [
  { tab: "profile", label: "Profile" },
  { tab: "addresses", label: "Addresses" },
  { tab: "settings", label: "Password & Security" },
];

const initials = (name: string, email: string) =>
  (name || email).trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const sp = await searchParams;
  const tab: AccountTab = sp.tab === "addresses" || sp.tab === "settings" ? sp.tab : "profile";
  const session = await requireUser(routes.account(tab));
  const [user, addresses] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.id }, select: { name: true, email: true, phone: true, createdAt: true } }),
    getAddresses(session.id),
  ]);
  const since = user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Home</Link>
            <span>/</span>
            <span className={styles.crumbOn}>Account</span>
          </nav>
          <h1 className={styles.h1}>My Account</h1>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKicker}>Member since</span>
          <span className={styles.metaValue}>{since} · {addresses.length} {addresses.length === 1 ? "address" : "addresses"} saved</span>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.rail} aria-label="Account sections">
          {TABS.map((t) => (
            <Link key={t.tab} href={routes.account(t.tab)} aria-current={t.tab === tab ? "page" : undefined} className={`${styles.railItem} ${t.tab === tab ? styles.railOn : ""}`}>
              <span>{t.label}</span>
              <span>→</span>
            </Link>
          ))}
        </nav>
        <div>
          {tab === "profile" && <ProfilePanel user={{ name: user.name, email: user.email, phone: user.phone ?? "", initials: initials(user.name, user.email) }} />}
          {tab === "addresses" && <AddressesPanel addresses={addresses} defaultName={user.name} />}
          {tab === "settings" && <SecurityPanel />}
        </div>
      </div>
    </div>
  );
}
