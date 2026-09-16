import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { ShopBy } from "@/components/home/ShopBy";
import { ArrivalsScroller } from "@/components/home/ArrivalsScroller";
import { SaleBanner } from "@/components/home/SaleBanner";
import { BestSellers } from "@/components/home/BestSellers";
import { Newsletter } from "@/components/home/Newsletter";
import { getBestSellers, getMaxSalePercent, getNewArrivals, getShopByCounts } from "@/lib/services/catalog";

export default async function HomePage() {
  const [tiles, arrivals, best, maxPercent] = await Promise.all([
    getShopByCounts(),
    getNewArrivals(8),
    getBestSellers(4),
    getMaxSalePercent(),
  ]);

  return (
    <>
      <Hero />
      <Marquee />
      <ShopBy tiles={tiles} />
      <ArrivalsScroller products={arrivals} />
      <SaleBanner maxPercent={maxPercent} />
      <BestSellers products={best} />
      <Newsletter />
    </>
  );
}
