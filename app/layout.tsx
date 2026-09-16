import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-space-grotesk" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono" });

// The whole store is live, per-user data (cart, session, stock) — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ClothSE", template: "%s · ClothSE" },
  description: "Curated streetwear from the brands you love, all in one place.",
};

/** Root: html/body/fonts only. Chrome lives in the route-group layouts: (site) and (auth). */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
