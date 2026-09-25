import { notFound } from "next/navigation";
import { CatalogView, type SearchValues } from "@/components/catalog-view";
import { getProducts } from "@/lib/catalog";
import { dictionary, isLocale } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchValues>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const q = await searchParams;
  return {
    ...metadata(
      locale,
      "/products",
      dictionary[locale].products,
      dictionary[locale].featuredSub,
    ),
    ...(Object.keys(q).length
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
export default async function Products({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container">
      <div className="page-heading">
        <p className="eyebrow">NARANJ COLLECTION</p>
        <h1>{dictionary[locale].products}</h1>
        <p>{dictionary[locale].categorySub}</p>
      </div>
      <CatalogView
        locale={locale}
        products={await getProducts()}
        search={await searchParams}
        basePath={`/${locale}/products`}
      />
    </div>
  );
}
