import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BackToTop } from "@/components/layout/BackToTop";
import { getCategoryCounts } from "@/lib/services/catalog";
import { getCartCount } from "@/lib/services/cart";
import { getCurrentUser } from "@/lib/session";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const [categories, cartCount] = await Promise.all([getCategoryCounts(), user ? getCartCount(user.id) : 0]);

  return (
    <>
      <SiteHeader categories={categories} user={user} cartCount={cartCount} />
      <main>{children}</main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
