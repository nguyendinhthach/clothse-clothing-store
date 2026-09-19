import type { Metadata } from "next";
import Link from "next/link";
import { AddressesPanel, ProfilePanel, SecurityPanel } from "@/components/account/AccountPanels";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { routes, type AccountTab } from "@/lib/routes";
import { getAddresses } from "@/lib/services/addresses";
import { requireUser } from "@/lib/session";
import styles from "@/components/account/account.module.css";

export const metadata: Metadata = { title: "Tài khoản" };

const TABS: { tab: AccountTab; label: string }[] = [
  { tab: "profile", label: "Hồ sơ" },
  { tab: "addresses", label: "Địa chỉ" },
  { tab: "settings", label: "Mật khẩu & bảo mật" },
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
  const since = formatDate(user.createdAt, { month: "numeric", year: "numeric" });

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Trang chủ</Link>
            <span>/</span>
            <span className={styles.crumbOn}>Tài khoản</span>
          </nav>
          <h1 className={styles.h1}>Tài khoản</h1>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKicker}>Thành viên từ</span>
          <span className={styles.metaValue}>{since} · {addresses.length} địa chỉ đã lưu</span>
        </div>
      </section>

      <div className={styles.shell}>
        <nav className={styles.rail} aria-label="Mục tài khoản">
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
