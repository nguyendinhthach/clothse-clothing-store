import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Vietnamese UI: every face loads the "vietnamese" subset. Playfair replaces Instrument Serif, which has no Vietnamese glyphs.
const sans = Space_Grotesk({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "700"], variable: "--font-space-grotesk" });
const serif = Playfair_Display({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-playfair" });
const mono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-jetbrains-mono" });

// The whole store is live, per-user data (cart, session, stock) — never prerender.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "ClothSE", template: "%s · ClothSE" },
  description: "Streetwear chọn lọc từ những hãng bạn mê, gom về một chỗ.",
};

/** Root: html/body/fonts only. Chrome lives in the route-group layouts: (site) and (auth). */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
