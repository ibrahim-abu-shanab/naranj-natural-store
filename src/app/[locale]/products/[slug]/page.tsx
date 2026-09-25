import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getProducts, findRedirect } from "@/lib/catalog";
import { dictionary, isLocale, localized, money } from "@/lib/i18n";
import { metadata, siteUrl, breadcrumbSchema } from "@/lib/seo";
import { Gallery } from "@/components/gallery";
import { Favorite, ProductControls } from "@/components/product-controls";
import { ProductCard } from "@/components/product-card";
import { JsonLd } from "@/components/json-ld";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = (await getProducts()).find((p) => p.slug === slug);
  return p
    ? metadata(
        locale,
        `/products/${slug}`,
        localized(p, "seoTitle", locale) || localized(p, "name", locale),
        localized(p, "seoDescription", locale) || localized(p, "short", locale),
        p.images[0]?.url,
      )
    : {};
}
export default async function Product({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const products = await getProducts();
  const p = products.find((p) => p.slug === slug);
  if (!p) {
    const r = await findRedirect("products", slug);
    if (r) permanentRedirect(`/${locale}/products/${r.newSlug}`);
    notFound();
  }
  const d = dictionary[locale];
  const name = localized(p, "name", locale);
  const related = products
    .filter(
      (product) =>
        product.id !== p.id &&
        (product.categoryId === p.categoryId ||
          product.tags.some((tag) => p.tags.some(({ id }) => id === tag.id))),
    )
    .slice(0, 4);
  const crumbs = [
    { name: d.home, path: `/${locale}` },
    { name: d.products, path: `/${locale}/products` },
    {
      name: localized(p.category, "name", locale),
      path: `/${locale}/categories/${p.category.slug}`,
    },
    { name, path: `/${locale}/products/${slug}` },
  ];
  return (
    <div className="container">
      <nav
        className="breadcrumbs"
        aria-label={locale === "ar" ? "مسار التنقل" : "İçerik yolu"}
      >
        {crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && " / "}
            <Link
              href={c.path}
              aria-current={i === crumbs.length - 1 ? "page" : undefined}
            >
              {c.name}
            </Link>
          </span>
        ))}
      </nav>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description: localized(p, "description", locale),
            sku: p.sku,
            image: p.images.map((i) => new URL(i.url, siteUrl()).href),
            brand: { "@type": "Brand", name: "NARANJ" },
            offers: {
              "@type": "Offer",
              url: `${siteUrl()}/${locale}/products/${slug}`,
              priceCurrency: "TRY",
              price: (p.price / 100).toFixed(2),
              availability: `https://schema.org/${p.stock > 0 ? "InStock" : "OutOfStock"}`,
              itemCondition: "https://schema.org/NewCondition",
            },
          },
        ]}
      />
      <div className="product-detail">
        <Gallery images={p.images} locale={locale} />
        <div className="detail-copy">
          <p className="eyebrow">{localized(p.category, "name", locale)}</p>
          <h1>{name}</h1>
          <p>{localized(p, "short", locale)}</p>
          <div className="price-line">
            <strong>{money(p.price, locale)}</strong>
            {p.oldPrice && <del>{money(p.oldPrice, locale)}</del>}
          </div>
          <dl>
            {p.size && (
              <div>
                <dt>{d.size}</dt>
                <dd>{p.size}</dd>
              </div>
            )}
            <div>
              <dt>SKU</dt>
              <dd>{p.sku}</dd>
            </div>
            <div>
              <dt>{d.stock}</dt>
              <dd>{p.stock ? d.stock : d.unavailable}</dd>
            </div>
          </dl>
          <div className="detail-actions">
            <ProductControls id={p.id} stock={p.stock} locale={locale} />
            <Favorite id={p.id} locale={locale} />
          </div>
          <p className="detail-note">{d.orderNote}</p>
        </div>
      </div>
      <div className="product-sections">
        {(
          [
            "description",
            "ingredients",
            "usage",
            "warnings",
            "features",
          ] as const
        )
          .filter((key) => localized(p, key, locale).trim())
          .map((key, i) => (
            <details open={i === 0} key={key}>
              <summary>{d[key]}</summary>
              <p>{localized(p, key, locale)}</p>
            </details>
          ))}
      </div>
      {related.length > 0 && (
        <section className="section related-products">
          <div className="section-heading">
            <h2>{d.related}</h2>
          </div>
          <div className="product-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
