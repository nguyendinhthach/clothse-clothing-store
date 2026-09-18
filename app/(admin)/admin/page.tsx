import type { Metadata } from "next";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { getDashboard } from "@/lib/services/admin/analytics";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function AdminDashboardPage() {
  return <DashboardPanel d={await getDashboard()} />;
}
