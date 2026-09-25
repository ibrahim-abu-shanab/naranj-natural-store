import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getCategories, getProducts, findRedirect } from "@/lib/catalog";
import { dictionary, isLocale, localized } from "@/lib/i18n";
import { metadata, breadcrumbSchema } from "@/lib/seo";
import { CatalogView, type SearchValues } from "@/components/catalog-view";
import { JsonLd } from "@/components/json-ld";
import {
  productBelongsToPublicCategory,
  publicCategories,
  publicCategoryName,
} from "@/lib/public-categories";
type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchValues>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const categories = await getCategories();
  const group = publicCategories.find((category) => category.slug === slug);
  const c = categories.find((category) => category.slug === slug);
  const source = group
    ? categories.find((category) => category.slug === group.roots[0])
    : c;
  const title = group
    ? publicCategoryName(group, locale)
    : c && localized(c, "name", locale);
  return source && title
    ? {
        ...metadata(
          locale,
          `/categories/${slug}`,
          (!group && localized(source, "seoTitle", locale)) || title,
          (!group && localized(source, "seoDescription", locale)) ||
            (!group && localized(source, "description", locale)) ||
            `${title} — ${dictionary[locale].categorySub}`,
          source.image,
        ),
        ...(Object.keys(await searchParams).length
          ? { robots: { index: false, follow: true } }
          : {}),
      }
    : {};
}
export default async function Category({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const categories = await getCategories();
  const group = publicCategories.find((category) => category.slug === slug);
  const c = categories.find((c) => c.slug === slug);
  if (!c && !group) {
    const r = await findRedirect("categories", slug);
    if (r) permanentRedirect(`/${locale}/categories/${r.newSlug}`);
    notFound();
  }
  const source = group
    ? categories.find((category) => category.slug === group.roots[0])
    : c;
  if (!source) notFound();
  const name = group
    ? publicCategoryName(group, locale)
    : localized(source, "name", locale);
  const products = await getProducts();
  const visibleProducts = group
    ? products.filter((product) =>
        productBelongsToPublicCategory(product, group, categories),
      )
    : products.filter(
        (product) =>
          product.categoryId === source.id ||
          product.category.parentId === source.id,
      );
  const rootIds = group
    ? categories
        .filter((category) =>
          group.roots.some((root) => root === category.slug),
        )
        .map(({ id }) => id)
    : [source.id];
  return (
    <div className="container">
      <nav className="breadcrumbs">
        <Link href={`/${locale}/categories`}>
          {dictionary[locale].categories}
        </Link>{" "}
        / {name}
      </nav>
      <div className="page-heading">
        <h1>{name}</h1>
        <p>{localized(source, "description", locale)}</p>
        <div className="need-pills">
          {categories
            .filter(
              (child) => child.parentId && rootIds.includes(child.parentId),
            )
            .map((child) => (
              <Link href={`/${locale}/categories/${child.slug}`} key={child.id}>
                {localized(child, "name", locale)}
              </Link>
            ))}
        </div>
      </div>
      <JsonLd
        data={breadcrumbSchema([
          { name: dictionary[locale].home, path: `/${locale}` },
          {
            name: dictionary[locale].categories,
            path: `/${locale}/categories`,
          },
          {
            name,
            path: `/${locale}/categories/${slug}`,
          },
        ])}
      />
      <CatalogView
        locale={locale}
        products={visibleProducts}
        search={await searchParams}
        basePath={`/${locale}/categories/${slug}`}
      />
    </div>
  );
}
