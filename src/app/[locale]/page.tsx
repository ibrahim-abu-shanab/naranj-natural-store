import Image from "@/components/catalog-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { ProductCarousel } from "@/components/product-carousel";
import { JsonLd } from "@/components/json-ld";
import {
  getProducts,
  getCategories,
  getSettings,
  getCollections,
} from "@/lib/catalog";
import { dictionary, isLocale, localized } from "@/lib/i18n";
import { metadata, siteUrl } from "@/lib/seo";
import { homeCategories } from "@/lib/home-categories";
import { categoryImage, storefrontSlides } from "@/lib/storefront-assets";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getSettings();
  const result = metadata(
    locale,
    "",
    localized(settings, "seoTitle", locale),
    localized(settings, "seoDescription", locale),
  );
  return {
    ...result,
    title: { absolute: localized(settings, "seoTitle", locale) },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = dictionary[locale];
  const [products, categories, collections] = await Promise.all([
    getProducts(),
    getCategories(),
    getCollections(),
  ]);
  const slides = storefrontSlides;
  const roots = categories.filter((category) => !category.parentId);
  const featuredCategories = homeCategories.map((card) => {
    const category = roots.find((item) => item.slug === card.slug);
    return {
      ...card,
      href: category
        ? `/${locale}/categories/${category.slug}`
        : `/${locale}/categories/${card.slug}`,
      sourceId: category?.id,
    };
  });
  const extraCategories = roots.filter((category) => !featuredCategories.some((card) => card.sourceId === category.id));
  const productRow = (
    title: string,
    selection: typeof products,
    href: string,
    accent = false,
  ) =>
    selection.length ? (
      <ProductCarousel
        title={title}
        href={href}
        locale={locale}
        accent={accent}
      >
        {selection.slice(0, 12).map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </ProductCarousel>
    ) : null;
  const selectedCollection = collections.find((collection) =>
    products.some((product) =>
      product.collections.some(({ id }) => id === collection.id),
    ),
  );
  return (
    <div className="marketplace storefront-home">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "NARANJ",
            "@id": `${siteUrl()}/#organization`,
            logo: `${siteUrl()}/images/naranj-logo.png`,
            url: siteUrl(),
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "NARANJ",
            url: `${siteUrl()}/${locale}`,
            inLanguage: locale,
          },
        ]}
      />
      <div className="container hero-frame">
        <Hero slides={slides} locale={locale} />
        {!slides.length && (
          <div className="page-heading">
            <h1>{d.naturalSelection}</h1>
            <Link className="button" href={`/${locale}/products`}>
              {d.shopNow}
            </Link>
          </div>
        )}
      </div>
      <section
        className="home-category-section container"
        aria-label={d.categories}
      >
        <div className="shop-section-heading">
          <h2>{d.exploreCategories}</h2>
        </div>
        <div className="home-category-grid home-category-grid-detailed">
          {featuredCategories.map((category) => (
            <Link href={category.href} key={category.slug}>
              <span className="home-category-image">
                <Image src={category.image} alt="" fill sizes="(max-width: 600px) 46vw, (max-width: 1100px) 30vw, 16vw" />
              </span>
              <div className="home-category-copy">
                <h3>{localized(category, "name", locale)}<ArrowUpRight size={16} aria-hidden="true" /></h3>
                <p>{localized(category, "description", locale)}</p>
              </div>
            </Link>
          ))}
          {extraCategories.map((category) => {
            return (
              <Link
                href={`/${locale}/categories/${category.slug}`}
                key={category.slug}
              >
                <span className="home-category-image">
                  <Image
                    src={categoryImage(category)}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 45vw, 20vw"
                  />
                </span>
                <span>
                  {localized(category, "name", locale)}
                  <ArrowUpRight size={17} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      {productRow(
        d.highlights,
        products.filter((product) => product.featured),
        `/${locale}/products?featured=1`,
      )}
      {productRow(
        d.new,
        products.filter((product) => product.isNew),
        `/${locale}/products?new=1`,
      )}
      {productRow(
        d.best,
        products.filter((product) => product.bestSeller),
        `/${locale}/products?best=1`,
        true,
      )}
      {selectedCollection &&
        productRow(
          localized(selectedCollection, "name", locale),
          products.filter((product) =>
            product.collections.some(({ id }) => id === selectedCollection.id),
          ),
          `/${locale}/products?collection=${selectedCollection.slug}`,
        )}
    </div>
  );
}
