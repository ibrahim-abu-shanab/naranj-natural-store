import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.DEMO_MODE === "true"
        ? { userAgent: "*", disallow: "/" }
        : {
            userAgent: "*",
            allow: "/",
            disallow: [
              "/admin",
              "/api/",
              "/tr/cart",
              "/ar/cart",
              "/tr/favorites",
              "/ar/favorites",
            ],
          },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
