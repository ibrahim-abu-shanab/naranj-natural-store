import "server-only";
import { cache } from "react";
import { db } from "./db";
import { withRestoredPages } from "./page-content";
import {
  demoProducts,
  demoCategories,
  demoTags,
  demoCollections,
  demoSlides,
  demoArticles,
  demoSettings,
  demoPages,
} from "./demo";
export const isDemo = () => process.env.DEMO_MODE === "true";
const include = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: true,
  tags: true,
  collections: true,
};
export const getProducts = cache(async () =>
  isDemo()
    ? demoProducts
    : db().product.findMany({
        where: {
          active: true,
          archived: false,
          category: {
            active: true,
            OR: [{ parentId: null }, { parent: { active: true } }],
          },
        },
        include,
        orderBy: { createdAt: "desc" },
      }),
);
export type CatalogProduct = Awaited<ReturnType<typeof getProducts>>[number];
export const getCategories = cache(async () =>
  isDemo()
    ? demoCategories
    : db().category.findMany({
        where: {
          active: true,
          OR: [{ parentId: null }, { parent: { active: true } }],
        },
        orderBy: { sortOrder: "asc" },
      }),
);
export const getTags = cache(async () =>
  isDemo()
    ? demoTags
    : db().tag.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
);
export const getCollections = cache(async () =>
  isDemo()
    ? demoCollections
    : db().collection.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
);
export const getSlides = cache(async () =>
  isDemo()
    ? demoSlides
    : db().heroSlide.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      }),
);
export const getArticles = cache(async () =>
  isDemo()
    ? demoArticles
    : db().article.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      }),
);
export const getSettings = cache(async () =>
  isDemo()
    ? demoSettings
    : ((await db().siteSettings.findUnique({ where: { id: "main" } })) ??
      demoSettings),
);
export const getPages = cache(async () =>
  isDemo() ? demoPages : withRestoredPages(await db().page.findMany()),
);
export async function findRedirect(kind: string, slug: string) {
  return isDemo()
    ? null
    : db().slugRedirect.findUnique({
        where: { kind_oldSlug: { kind, oldSlug: slug } },
      });
}
