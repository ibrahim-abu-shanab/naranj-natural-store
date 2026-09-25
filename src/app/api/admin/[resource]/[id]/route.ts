import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { currentAdmin, assertSameOrigin } from "@/lib/auth";
import { isResource, schemas } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { boundedJson, BodyTooLarge } from "@/lib/request-body";
type Context = { params: Promise<{ resource: string; id: string }> };
function productSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
async function productDefaults(body: unknown, id: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const input = { ...(body as Record<string, unknown>) };
  const existing =
    id === "new"
      ? null
      : await db().product.findUnique({
          where: { id },
          select: { slug: true, sku: true },
        });
  const nameTr = String(input.nameTr || "").trim();
  const nameAr = String(input.nameAr || "").trim();
  const descriptionTr = String(input.descriptionTr || "").trim();
  const descriptionAr = String(input.descriptionAr || "").trim();
  let slug = String(input.slug || existing?.slug || productSlug(nameTr)).trim();
  if (id === "new" && !input.slug) {
    const base = slug || "urun";
    let suffix = 1;
    while (
      (await db().product.count({ where: { slug } })) ||
      (await db().slugRedirect.count({
        where: { kind: "products", oldSlug: slug },
      }))
    ) {
      suffix += 1;
      slug = `${base.slice(0, 116)}-${suffix}`;
    }
  }
  const short = (value: string) =>
    value.length <= 200 ? value : `${value.slice(0, 197).trimEnd()}…`;
  const meta = (value: string) => value.slice(0, 500).trim();
  const images = Array.isArray(input.images)
    ? input.images.map((value) => {
        const image =
          value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};
        return {
          ...image,
          altTr: String(image.altTr || nameTr).trim(),
          altAr: String(image.altAr || nameAr).trim(),
        };
      })
    : input.images;
  return {
    ...input,
    slug,
    sku:
      String(input.sku || existing?.sku || "").trim() ||
      `NRJ-${productSlug(nameTr).slice(0, 24).toUpperCase() || "URUN"}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    shortTr: String(input.shortTr || short(descriptionTr)).trim(),
    shortAr: String(input.shortAr || short(descriptionAr)).trim(),
    seoTitleTr:
      String(input.seoTitleTr || "").trim() ||
      `${nameTr} | NARANJ`.slice(0, 200).trim(),
    seoTitleAr:
      String(input.seoTitleAr || "").trim() ||
      `${nameAr} | NARANJ`.slice(0, 200).trim(),
    seoDescriptionTr:
      String(input.seoDescriptionTr || "").trim() || meta(descriptionTr),
    seoDescriptionAr:
      String(input.seoDescriptionAr || "").trim() || meta(descriptionAr),
    ingredientsTr: String(input.ingredientsTr || "").trim(),
    ingredientsAr: String(input.ingredientsAr || "").trim(),
    usageTr: String(input.usageTr || "").trim(),
    usageAr: String(input.usageAr || "").trim(),
    warningsTr: String(input.warningsTr || "").trim(),
    warningsAr: String(input.warningsAr || "").trim(),
    size: String(input.size || "").trim(),
    images,
  };
}
async function slideDefaults(body: unknown, id: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const input = { ...(body as Record<string, unknown>) };
  const existing =
    id === "new"
      ? null
      : await db().heroSlide.findUnique({
          where: { id },
          select: { ctaTr: true, ctaAr: true },
        });
  const image = String(input.desktopImage || "").trim();
  return {
    ...input,
    desktopImage: image,
    mobileImage: image,
    ctaTr: existing?.ctaTr || "Şimdi keşfet",
    ctaAr: existing?.ctaAr || "اكتشف الآن",
  };
}
function failure(error: unknown) {
  if (error instanceof BodyTooLarge)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return NextResponse.json(
        { error: "Slug veya SKU zaten kullanılıyor. / الرابط أو SKU مستخدم." },
        { status: 409 },
      );
    if (["P2003", "P2014"].includes(error.code))
      return NextResponse.json(
        {
          error:
            "İlişkili kayıtlar var. Önce bağlantıları kaldırın. / توجد سجلات مرتبطة.",
        },
        { status: 409 },
      );
    if (error.code === "P2025")
      return NextResponse.json(
        { error: "Kayıt bulunamadı. / السجل غير موجود." },
        { status: 404 },
      );
  }
  return NextResponse.json(
    {
      error:
        error instanceof Error && error.message.startsWith("Validation:")
          ? error.message.slice(11)
          : "İşlem tamamlanamadı. / تعذر إكمال العملية.",
    },
    { status: 400 },
  );
}
export async function PUT(request: Request, { params }: Context) {
  try {
    await assertSameOrigin();
    if (!(await currentAdmin()))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { resource, id } = await params;
    if (!isResource(resource))
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(request.headers.get("content-length") || 0) > 200000)
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    const rawBody = await boundedJson(request, 200000);
    const body =
      resource === "products"
        ? await productDefaults(rawBody, id)
        : resource === "slides"
          ? await slideDefaults(rawBody, id)
          : rawBody;
    const parsed = schemas[resource].safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("\n"),
        },
        { status: 422 },
      );
    const result = await db().$transaction(async (tx) => {
      let previousSlug: string | undefined;
      if (id !== "new") {
        if (resource === "products")
          previousSlug = (await tx.product.findUnique({ where: { id } }))?.slug;
        else if (resource === "categories")
          previousSlug = (await tx.category.findUnique({ where: { id } }))
            ?.slug;
        else if (resource === "articles")
          previousSlug = (await tx.article.findUnique({ where: { id } }))?.slug;
      }
      const newSlug = "slug" in parsed.data ? parsed.data.slug : undefined;
      if (
        newSlug &&
        ["products", "categories", "articles"].includes(resource)
      ) {
        const reserved = await tx.slugRedirect.findUnique({
          where: { kind_oldSlug: { kind: resource, oldSlug: newSlug } },
        });
        if (reserved)
          throw new Error(
            "Validation:Bu slug önceki bir bağlantı için ayrılmıştır. / هذا الرابط محجوز لتحويل سابق.",
          );
      }
      let saved: { id: string };
      switch (resource) {
        case "products": {
          const { images, tagIds, collectionIds, ...data } =
            schemas.products.parse(body);
          const category = await tx.category.findUnique({
            where: { id: data.categoryId },
          });
          if (!category) throw new Error("Validation:Kategori bulunamadı.");
          const relation = {
            tags: { set: tagIds.map((id) => ({ id })) },
            collections: { set: collectionIds.map((id) => ({ id })) },
          };
          const imageData = images.map((image, sortOrder) => ({
            ...image,
            sortOrder,
          }));
          saved =
            id === "new"
              ? await tx.product.create({
                  data: {
                    ...data,
                    tags: { connect: tagIds.map((id) => ({ id })) },
                    collections: {
                      connect: collectionIds.map((id) => ({ id })),
                    },
                    images: { create: imageData },
                  },
                })
              : await tx.product.update({
                  where: { id },
                  data: {
                    ...data,
                    ...relation,
                    images: { deleteMany: {}, create: imageData },
                  },
                });
          break;
        }
        case "categories": {
          const data = schemas.categories.parse(body);
          if (data.parentId) {
            if (data.parentId === id)
              throw new Error("Validation:Kategori kendisine bağlanamaz.");
            const parent = await tx.category.findUnique({
              where: { id: data.parentId },
            });
            if (!parent || parent.parentId)
              throw new Error(
                "Validation:Yalnızca ana kategori seçin. / اختر تصنيفًا رئيسيًا.",
              );
            if (
              id !== "new" &&
              (await tx.category.count({ where: { parentId: id } }))
            )
              throw new Error(
                "Validation:Alt kategorileri olan bir kategori taşınamaz.",
              );
          }
          saved =
            id === "new"
              ? await tx.category.create({ data })
              : await tx.category.update({ where: { id }, data });
          break;
        }
        case "tags": {
          const data = schemas.tags.parse(body);
          saved =
            id === "new"
              ? await tx.tag.create({ data })
              : await tx.tag.update({ where: { id }, data });
          break;
        }
        case "collections": {
          const data = schemas.collections.parse(body);
          saved =
            id === "new"
              ? await tx.collection.create({ data })
              : await tx.collection.update({ where: { id }, data });
          break;
        }
        case "slides": {
          const data = schemas.slides.parse(body);
          saved =
            id === "new"
              ? await tx.heroSlide.create({ data })
              : await tx.heroSlide.update({ where: { id }, data });
          break;
        }
        case "articles": {
          const data = schemas.articles.parse(body);
          saved =
            id === "new"
              ? await tx.article.create({ data })
              : await tx.article.update({ where: { id }, data });
          break;
        }
        case "pages": {
          const data = schemas.pages.parse(body);
          saved =
            id === "new"
              ? await tx.page.create({ data })
              : await tx.page.update({ where: { id }, data });
          break;
        }
        case "settings": {
          const data = schemas.settings.parse(body);
          saved = await tx.siteSettings.upsert({
            where: { id: "main" },
            create: { ...data, id: "main" },
            update: data,
          });
          break;
        }
      }
      if (previousSlug && newSlug && previousSlug !== newSlug) {
        await tx.slugRedirect.updateMany({
          where: { kind: resource, newSlug: previousSlug },
          data: { newSlug },
        });
        await tx.slugRedirect.create({
          data: { kind: resource, oldSlug: previousSlug, newSlug },
        });
        const segment = resource === "articles" ? "guide" : resource;
        await tx.heroSlide.updateMany({
          where: { url: `/${segment}/${previousSlug}` },
          data: { url: `/${segment}/${newSlug}` },
        });
      }
      return saved;
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ id: result.id });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(_request: Request, { params }: Context) {
  try {
    await assertSameOrigin();
    if (!(await currentAdmin()))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { resource, id } = await params;
    if (!isResource(resource) || ["settings", "pages"].includes(resource))
      return NextResponse.json({ error: "Not allowed" }, { status: 405 });
    await db().$transaction(async (tx) => {
      switch (resource) {
        case "products": {
          const p = await tx.product.findUnique({
            where: { id },
            include: { _count: { select: { collections: true } } },
          });
          if (p && (p.active || !p.archived || p._count.collections))
            throw new Error(
              "Validation:Önce ürünü arşivleyin, yayından kaldırın ve koleksiyon bağlantılarını silin. / أرشف المنتج وأوقف نشره وأزل ارتباطاته أولًا.",
            );
          if (
            p &&
            (await tx.heroSlide.count({
              where: { url: { endsWith: `/products/${p.slug}` } },
            }))
          )
            throw new Error(
              "Validation:Ürün bir slayta bağlı. / المنتج مرتبط بشريحة.",
            );
          await tx.product.delete({ where: { id } });
          break;
        }
        case "categories":
          await tx.category.delete({ where: { id } });
          break;
        case "tags": {
          if (await tx.product.count({ where: { tags: { some: { id } } } }))
            throw new Error(
              "Validation:Etiket ürünlere bağlı. / الوسم مرتبط بمنتجات.",
            );
          await tx.tag.delete({ where: { id } });
          break;
        }
        case "collections": {
          if (
            await tx.product.count({ where: { collections: { some: { id } } } })
          )
            throw new Error(
              "Validation:Koleksiyon ürünlere bağlı. / المجموعة مرتبطة بمنتجات.",
            );
          await tx.collection.delete({ where: { id } });
          break;
        }
        case "slides":
          await tx.heroSlide.delete({ where: { id } });
          break;
        case "articles":
          await tx.article.delete({ where: { id } });
          break;
      }
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
