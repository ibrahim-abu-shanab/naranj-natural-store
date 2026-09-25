import { fields, type Field } from "@/lib/admin-fields";
import type { Resource } from "@/lib/validation";
export function formSections(
  resource: Resource,
): { title: string; fields: Field[]; advanced?: boolean }[] {
  if (resource === "products") {
    const productFields = fields.products;
    const pick = (keys: string[]) =>
      keys.map((key) => productFields.find((field) => field.key === key)!);
    const standard = [
      { title: "الاسم", fields: pick(["nameAr", "nameTr"]) },
      { title: "السعر", fields: pick(["price", "oldPrice", "size"]) },
      {
        title: "التصنيف",
        fields: pick(["categoryId", "tagIds"]),
      },
      {
        title: "وصف المنتج",
        fields: pick(["descriptionAr", "descriptionTr"]),
      },
      {
        title: "طريقة الاستخدام",
        fields: pick(["usageAr", "usageTr"]),
      },
      {
        title: "الظهور",
        fields: pick(["active", "featured", "isNew", "bestSeller"]),
      },
    ];
    const visible = new Set(
      standard.flatMap(({ fields }) => fields.map((f) => f.key)),
    );
    return [
      ...standard,
      {
        title: "إعدادات المنتج الإضافية",
        fields: productFields.filter((field) => !visible.has(field.key)),
        advanced: true,
      },
    ];
  }
  if (resource === "slides")
    return [
      {
        title: "محتوى الشريحة",
        fields: fields.slides,
      },
    ];
  if (resource === "categories") {
    const categoryFields = fields.categories;
    const primaryKeys = ["image", "nameAr", "nameTr", "active"];
    return [
      {
        title: "صورة واسم التصنيف",
        fields: primaryKeys.map(
          (key) => categoryFields.find((field) => field.key === key)!,
        ),
      },
      {
        title: "إعدادات التصنيف الإضافية",
        fields: categoryFields.filter(
          (field) => !primaryKeys.includes(field.key),
        ),
        advanced: true,
      },
    ];
  }
  const groups = [
    "المعلومات الأساسية",
    "التصنيف",
    "السعر والمخزون",
    "المحتوى العربي",
    "المحتوى التركي",
    "المكونات وطريقة الاستخدام",
    "الصور والروابط",
    "تحسين محركات البحث",
    "حالة الظهور",
  ];
  const section = (key: string) => {
    if (key.startsWith("seo")) return 7;
    if (
      [
        "active",
        "archived",
        "featured",
        "isNew",
        "bestSeller",
        "sortOrder",
      ].includes(key)
    )
      return 8;
    if (["categoryId", "parentId", "tagIds", "collectionIds"].includes(key))
      return 1;
    if (["price", "oldPrice", "stock"].includes(key)) return 2;
    if (/^(ingredients|usage|warnings)/.test(key)) return 5;
    if (["image", "desktopImage", "mobileImage", "url"].includes(key)) return 6;
    if (key.endsWith("Ar")) return 3;
    if (key.endsWith("Tr")) return 4;
    return 0;
  };
  return groups
    .map((title, i) => ({
      title,
      fields: fields[resource].filter((f) => section(f.key) === i),
    }))
    .filter((g) => g.fields.length);
}
