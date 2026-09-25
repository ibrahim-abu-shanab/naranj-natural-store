import { z } from "zod";
const text = z.string().trim().min(1).max(200);
const long = z.string().trim().min(1).max(30000);
const optional = z.string().trim().max(30000).default("");
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, digits and hyphens.",
  );
export const internalUrl = z
  .string()
  .max(500)
  .regex(
    /^\/(?!\/)[a-zA-Z0-9\-/]*(?:\?[a-zA-Z0-9=&%\-]*)?$/,
    "Use an internal path, for example /products?collection=your-slug.",
  );
export const imageUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (
      /^\/images\/[a-zA-Z0-9_.-]+\.(webp|png|jpe?g|avif)$/.test(value) ||
      /^\/uploads\/[a-f0-9-]+\.webp$/.test(value)
    )
      return true;
    try {
      const u = new URL(value);
      const endpoint = process.env.AWS_ENDPOINT_URL_S3;
      const bucket = process.env.STORAGE_BUCKET || "naranj-products";
      const allowed =
        process.env.STORAGE_PUBLIC_URL ||
        (endpoint ? `${endpoint.replace(/\/$/, "")}/${bucket}` : "");
      const allowedUrl = allowed ? new URL(allowed) : null;
      return (
        !!allowedUrl &&
        u.protocol === "https:" &&
        u.origin === allowedUrl.origin &&
        (u.pathname === allowedUrl.pathname ||
          u.pathname.startsWith(`${allowedUrl.pathname.replace(/\/$/, "")}/`))
      );
    } catch {
      return false;
    }
  }, "Choose an uploaded image or a bundled /images/ image.");
const bool = z.boolean();
const order = z.number().int().min(0).max(10000);
const ids = z.array(z.string().min(1).max(100)).max(200);
const name = { nameTr: text, nameAr: text };
const seo = {
  seoTitleTr: z.string().trim().max(200).default(""),
  seoTitleAr: z.string().trim().max(200).default(""),
  seoDescriptionTr: z.string().trim().max(500).default(""),
  seoDescriptionAr: z.string().trim().max(500).default(""),
};
const descriptions = { descriptionTr: optional, descriptionAr: optional };
export const schemas = {
  products: z
    .object({
      ...name,
      slug: slugSchema,
      sku: text,
      shortTr: text,
      shortAr: text,
      descriptionTr: long,
      descriptionAr: long,
      ingredientsTr: optional,
      ingredientsAr: optional,
      usageTr: optional,
      usageAr: optional,
      warningsTr: optional,
      warningsAr: optional,
      featuresTr: optional,
      featuresAr: optional,
      seoTitleTr: z.string().max(200).default(""),
      seoTitleAr: z.string().max(200).default(""),
      seoDescriptionTr: z.string().max(500).default(""),
      seoDescriptionAr: z.string().max(500).default(""),
      price: z.number().int().min(1).max(100000000),
      oldPrice: z.number().int().min(1).max(100000000).nullable(),
      size: z.string().trim().max(200).default(""),
      stock: z.number().int().min(0).max(1000000),
      categoryId: text,
      tagIds: ids,
      collectionIds: ids,
      featured: bool,
      isNew: bool,
      bestSeller: bool,
      active: bool,
      archived: bool,
      images: z
        .array(z.object({ url: imageUrl, altTr: text, altAr: text }))
        .min(1)
        .max(12),
    })
    .refine((p) => p.oldPrice === null || p.oldPrice > p.price, {
      message: "Old price must exceed current price.",
      path: ["oldPrice"],
    }),
  categories: z.object({
    ...seo,
    ...name,
    ...descriptions,
    slug: slugSchema,
    image: imageUrl,
    parentId: z.string().nullable(),
    sortOrder: order,
    active: bool,
  }),
  tags: z.object({ ...name, slug: slugSchema, sortOrder: order, active: bool }),
  collections: z.object({
    ...name,
    ...descriptions,
    slug: slugSchema,
    sortOrder: order,
    active: bool,
  }),
  slides: z.object({
    titleTr: text,
    titleAr: text,
    descriptionTr: optional,
    descriptionAr: optional,
    ctaTr: text,
    ctaAr: text,
    url: internalUrl,
    desktopImage: imageUrl,
    mobileImage: imageUrl,
    sortOrder: order,
    active: bool,
  }),
  articles: z.object({
    ...seo,
    slug: slugSchema,
    titleTr: text,
    titleAr: text,
    excerptTr: text,
    excerptAr: text,
    bodyTr: long,
    bodyAr: long,
    image: imageUrl,
    author: text,
    active: bool,
  }),
  settings: z.object({
    whatsapp: z
      .string()
      .regex(
        /^$|^[1-9][0-9]{7,14}$/,
        "International digits only, without + or spaces.",
      ),
    email: z.union([z.literal(""), z.email()]),
    phone: z.string().max(100),
    addressTr: optional,
    addressAr: optional,
    instagram: z.union([z.literal(""), z.url().startsWith("https://")]),
    facebook: z.union([z.literal(""), z.url().startsWith("https://")]),
    announcementTr: z.string().max(200),
    announcementAr: z.string().max(200),
    seoTitleTr: text,
    seoTitleAr: text,
    seoDescriptionTr: text,
    seoDescriptionAr: text,
  }),
  pages: z.object({
    slug: z.enum([
      "about",
      "contact",
      "shipping",
      "returns",
      "privacy",
      "terms",
      "faq",
    ]),
    titleTr: text,
    titleAr: text,
    bodyTr: long,
    bodyAr: long,
  }),
};
export type Resource = keyof typeof schemas;
export function isResource(v: string): v is Resource {
  return Object.hasOwn(schemas, v);
}
