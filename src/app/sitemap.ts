import type { MetadataRoute } from "next";
import {
  getProducts,
  getCategories,
  getArticles,
  getPages,
  isDemo,
} from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";
import { publicCategories } from "@/lib/public-categories";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isDemo()) return [];
  const [products, categories, articles, pages] = await Promise.all([
    getProducts(),
    getCategories(),
    getArticles(),
    getPages(),
  ]);
  const entries = [
    ...["", "/products", "/categories", "/needs", "/guide"].map((path) => ({
      path,
      updatedAt: undefined as Date | undefined,
    })),
    ...products.map((p) => ({
      path: `/products/${p.slug}`,
      updatedAt: p.updatedAt,
    })),
    ...categories.map((c) => ({
      path: `/categories/${c.slug}`,
      updatedAt: c.updatedAt,
    })),
    ...publicCategories
      .filter((group) => !categories.some(({ slug }) => slug === group.slug))
      .map((group) => ({
        path: `/categories/${group.slug}`,
        updatedAt: undefined as Date | undefined,
      })),
    ...articles.map((a) => ({
      path: `/guide/${a.slug}`,
      updatedAt: a.updatedAt,
    })),
    ...pages.map((p) => ({ path: `/${p.slug}`, updatedAt: p.updatedAt })),
  ];
  return entries.flatMap((e) =>
    ["tr", "ar"].map((locale) => ({
      url: `${siteUrl()}/${locale}${e.path}`,
      lastModified: e.updatedAt,
      alternates: {
        languages: {
          "tr-TR": `${siteUrl()}/tr${e.path}`,
          ar: `${siteUrl()}/ar${e.path}`,
        },
      },
      changeFrequency: "weekly" as const,
      priority: e.path === "" ? 1 : 0.7,
    })),
  );
}
