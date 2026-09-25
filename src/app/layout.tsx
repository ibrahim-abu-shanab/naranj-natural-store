import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import "@fontsource-variable/manrope";
import "./storefront.css";
const arabicFont = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: { default: "NARANJ", template: "%s | NARANJ" },
  icons: { icon: "/favicon.svg" },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale =
    (await headers()).get("x-naranj-locale") === "ar" ? "ar" : "tr";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={locale === "ar" ? arabicFont.variable : undefined}>
      <body>{children}</body>
    </html>
  );
}
