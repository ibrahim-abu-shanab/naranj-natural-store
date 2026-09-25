import Image from "@/components/catalog-image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getArticles, findRedirect } from "@/lib/catalog";
import { dictionary, isLocale, localized } from "@/lib/i18n";
import { metadata, siteUrl, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const a = (await getArticles()).find((a) => a.slug === slug);
  if (!a) return {};
  const base = metadata(
    locale,
    `/guide/${slug}`,
    localized(a, "seoTitle", locale) || localized(a, "title", locale),
    localized(a, "seoDescription", locale) || localized(a, "excerpt", locale),
    a.image,
  );
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article" as const,
      publishedTime: new Date(a.createdAt).toISOString(),
      modifiedTime: new Date(a.updatedAt).toISOString(),
      authors: [a.author],
    },
  };
}
export default async function Article({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const a = (await getArticles()).find((a) => a.slug === slug);
  if (!a) {
    const r = await findRedirect("articles", slug);
    if (r) permanentRedirect(`/${locale}/guide/${r.newSlug}`);
    notFound();
  }
  return (
    <article className="container prose">
      <nav className="breadcrumbs">
        <Link href={`/${locale}`}>{dictionary[locale].home}</Link> /{" "}
        <Link href={`/${locale}/guide`}>{dictionary[locale].guide}</Link>
      </nav>
      <div className="page-heading">
        <p className="eyebrow">{dictionary[locale].guide}</p>
        <h1>{localized(a, "title", locale)}</h1>
        <p>{localized(a, "excerpt", locale)}</p>
        <p>
          {a.author} ·{" "}
          {new Date(a.createdAt).toLocaleDateString(
            locale === "ar" ? "ar-TR" : "tr-TR",
          )}
        </p>
      </div>
      <div className="cover">
        <Image
          src={a.image}
          alt={localized(a, "title", locale)}
          fill
          sizes="(max-width:760px) 100vw, 780px"
          preload
        />
      </div>
      <p>{localized(a, "body", locale)}</p>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: localized(a, "title", locale),
            description: localized(a, "excerpt", locale),
            image: new URL(a.image, siteUrl()).href,
            datePublished: new Date(a.createdAt).toISOString(),
            dateModified: new Date(a.updatedAt).toISOString(),
            author: { "@type": "Organization", name: a.author },
            publisher: { "@type": "Organization", name: "NARANJ" },
            mainEntityOfPage: `${siteUrl()}/${locale}/guide/${slug}`,
            inLanguage: locale,
          },
          breadcrumbSchema([
            { name: dictionary[locale].home, path: `/${locale}` },
            { name: dictionary[locale].guide, path: `/${locale}/guide` },
            {
              name: localized(a, "title", locale),
              path: `/${locale}/guide/${slug}`,
            },
          ]),
        ]}
      />
    </article>
  );
}
