import type { Metadata } from "next";
import { OrdersQueue } from "@/components/admin/OrdersQueue";
import { ORDER_TABS } from "@/lib/order-status";
import { countAdminOrders, listAdminOrders } from "@/lib/services/admin/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const tab = ORDER_TABS.find((t) => t.tab === sp.status) ?? ORDER_TABS[0];
  const [orders, counts] = await Promise.all([listAdminOrders(tab.status), countAdminOrders()]);
  return <OrdersQueue status={tab.status} counts={counts} orders={orders} />;
}
