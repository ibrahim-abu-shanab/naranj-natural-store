import "server-only";
import { db } from "./db";
import type { Resource } from "./validation";
export async function adminRecords(resource: Resource) {
  switch (resource) {
    case "products":
      return db().product.findMany({
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          tags: true,
          collections: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    case "categories":
      return db().category.findMany({ orderBy: { sortOrder: "asc" } });
    case "tags":
      return db().tag.findMany({ orderBy: { sortOrder: "asc" } });
    case "collections":
      return db().collection.findMany({ orderBy: { sortOrder: "asc" } });
    case "slides":
      return db().heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
    case "articles":
      return db().article.findMany({ orderBy: { updatedAt: "desc" } });
    case "settings":
      return db().siteSettings.findMany();
    case "pages":
      return db().page.findMany({ orderBy: { slug: "asc" } });
  }
}
export async function adminOptions() {
  const [categories, tags, collections] = await Promise.all([
    db().category.findMany({ orderBy: { sortOrder: "asc" } }),
    db().tag.findMany(),
    db().collection.findMany(),
  ]);
  return {
    categories: categories.map((c) => ({
      id: c.id,
      label: c.nameAr,
      parentId: c.parentId,
    })),
    tags: tags.map((t) => ({ id: t.id, label: t.nameAr })),
    collections: collections.map((c) => ({
      id: c.id,
      label: c.nameAr,
    })),
  };
}
