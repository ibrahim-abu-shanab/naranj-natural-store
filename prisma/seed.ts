import "dotenv/config";
import { db } from "../src/lib/db";
import {
  demoCategories,
  demoTags,
  demoCollections,
  demoProducts,
  demoSlides,
  demoArticles,
  demoSettings,
  demoPages,
} from "../src/lib/demo";
async function main() {
  const prisma = db();
  await prisma.$transaction(async (tx) => {
    await tx.product.deleteMany({
      where: {
        id: { in: demoProducts.map(({ id }) => id) },
        sku: { startsWith: "DEMO-" },
      },
    });
    for (const category of demoCategories) {
      const { createdAt, updatedAt, ...data } = category;
      void createdAt;
      void updatedAt;
      await tx.category.upsert({
        where: { id: category.id },
        update: data,
        create: category,
      });
    }
    for (const tag of demoTags) {
      const { createdAt, updatedAt, ...data } = tag;
      void createdAt;
      void updatedAt;
      await tx.tag.upsert({ where: { id: tag.id }, update: data, create: tag });
    }
    for (const collection of demoCollections)
      await tx.collection.upsert({
        where: { id: collection.id },
        update: {},
        create: collection,
      });
    for (const slide of demoSlides)
      await tx.heroSlide.upsert({
        where: { id: slide.id },
        update: {},
        create: { ...slide, active: false },
      });
    for (const article of demoArticles)
      await tx.article.upsert({
        where: { id: article.id },
        update: {},
        create: { ...article, active: false },
      });
    await tx.siteSettings.upsert({
      where: { id: "main" },
      update: {},
      create: demoSettings,
    });
    for (const page of demoPages)
      await tx.page.upsert({
        where: { slug: page.slug },
        update: {},
        create: page,
      });
  });
  console.log(
    "Seed complete. Store taxonomy is current. Known demo products were removed; no products or admins were created.",
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => db().$disconnect());
