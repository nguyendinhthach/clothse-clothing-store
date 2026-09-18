import type { Metadata } from "next";
import { RevenuePanel } from "@/components/admin/RevenuePanel";
import { getRevenue, resolveRange, type RangeKey } from "@/lib/services/admin/analytics";

export const metadata: Metadata = { title: "Doanh thu" };

const str = (v: unknown) => (typeof v === "string" ? v : "");

export default async function AdminRevenuePage({ searchParams }: PageProps<"/admin/revenue">) {
  const sp = await searchParams;
  const key: RangeKey = sp.range === "week" || sp.range === "year" || sp.range === "custom" ? sp.range : "month";
  const custom = { from: str(sp.from), to: str(sp.to) };
  const data = await getRevenue(resolveRange(key, custom));
  return <RevenuePanel data={data} custom={custom} />;
}
