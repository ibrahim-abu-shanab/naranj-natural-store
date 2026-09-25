import type { Locale } from "./i18n";

export const publicCategories = [
  {
    slug: "hacamat-malzemeleri",
    nameTr: "Hacamat Malzemeleri",
    nameAr: "الحجامة ومستلزماتها",
    roots: ["hacamat-malzemeleri"],
  },
  {
    slug: "bitkisel-urunler",
    nameTr: "Bitkisel Ürünler",
    nameAr: "الخلطات والأعشاب",
    roots: ["bitkisel-urunler", "dogal-yaglar"],
  },
  {
    slug: "bakim-guzellik",
    nameTr: "Bakım & Güzellik",
    nameAr: "العناية والجمال",
    roots: ["cilt-bakimi", "kisisel-bakim"],
  },
  {
    slug: "sac-vucut-bakimi",
    nameTr: "Saç & Vücut Bakımı",
    nameAr: "العناية بالشعر والجسم",
    roots: ["sac-bakimi"],
    exact: ["vucut-bakimi"],
  },
  {
    slug: "bal-ve-dogal-urunler",
    nameTr: "Bal & Doğal Ürünler",
    nameAr: "العسل والمنتجات الطبيعية",
    roots: ["bal-ve-dogal-urunler"],
  },
] as const;

export type PublicCategory = (typeof publicCategories)[number];
export const publicCategoryName = (category: PublicCategory, locale: Locale) =>
  locale === "ar" ? category.nameAr : category.nameTr;

export function productBelongsToPublicCategory(
  product: {
    categoryId: string;
    category: { id: string; slug: string; parentId: string | null };
  },
  category: PublicCategory,
  categories: { id: string; slug: string }[],
) {
  const parentSlug = product.category.parentId
    ? categories.find(({ id }) => id === product.category.parentId)?.slug
    : product.category.slug;
  return (
    category.roots.some((slug) => slug === parentSlug) ||
    ("exact" in category &&
      category.exact.some((slug) => slug === product.category.slug))
  );
}
