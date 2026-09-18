import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/bag/CheckoutForm";
import { routes } from "@/lib/routes";
import { getDefaultAddress } from "@/lib/services/addresses";
import { getBagLines } from "@/lib/services/orders";
import { requireUser } from "@/lib/session";
import styles from "@/components/bag/bag.module.css";

export const metadata: Metadata = { title: "Thanh toán" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const user = await requireUser(routes.checkout);
  const wanted = String(sp.lines ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);

  const all = await getBagLines(user.id);
  const lines = (wanted.length ? all.filter((l) => wanted.includes(l.variantId)) : all).filter((l) => l.stock > 0);
  if (lines.length === 0) redirect(routes.bag());

  const address = await getDefaultAddress(user.id);

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.head}>
        <div>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={routes.home}>Trang chủ</Link>
            <span>/</span>
            <Link href={routes.bag()}>Giỏ hàng</Link>
            <span>/</span>
            <span className={styles.crumbCurrent}>Thanh toán</span>
          </nav>
          <h1 className={styles.h1}>Thanh toán</h1>
        </div>
      </section>
      <CheckoutForm lines={lines} address={address ? { name: address.name, phone: address.phone, line: address.line, city: address.city } : { name: user.name, phone: "", line: "", city: "" }} />
    </div>
  );
}
