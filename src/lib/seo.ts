import type { Metadata } from "next";
import type { Locale } from "./i18n";
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
export function metadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  image: string = "/images/naranj-logo.png",
): Metadata {
  const url = `${siteUrl()}/${locale}${path}`;
  const images = image ? [new URL(image, siteUrl()).href] : [];
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "tr-TR": `${siteUrl()}/tr${path}`,
        ar: `${siteUrl()}/ar${path}`,
        "x-default": `${siteUrl()}/tr${path}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "NARANJ",
      locale: locale === "ar" ? "ar_AR" : "tr_TR",
      alternateLocale: locale === "ar" ? "tr_TR" : "ar_AR",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.name,
      item: siteUrl() + v.path,
    })),
  };
}
