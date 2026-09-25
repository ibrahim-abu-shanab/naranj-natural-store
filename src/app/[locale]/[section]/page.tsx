import Image from "@/components/catalog-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import {
  getProducts,
  getCategories,
  getTags,
  getArticles,
  getPages,
  getSettings,
  isDemo,
} from "@/lib/catalog";
import { dictionary, isLocale, localized } from "@/lib/i18n";
import { metadata } from "@/lib/seo";
import { Cart } from "@/components/cart";
import { SavedProducts } from "@/components/saved-products";
import { SocialLinks } from "@/components/social-links";
import { InformationalPage } from "@/components/informational-page";
import { publicCategories, publicCategoryName } from "@/lib/public-categories";
type Props = { params: Promise<{ locale: string; section: string }> };
const publicSections = ["categories", "needs", "guide", "cart", "favorites"];
export async function generateMetadata({ params }: Props) {
  const { locale, section } = await params;
  if (!isLocale(locale)) return {};
  const page = (await getPages()).find((p) => p.slug === section);
  const title = page
    ? localized(page, "title", locale)
    : dictionary[locale][section as keyof typeof dictionary.tr];
  return title
    ? {
        ...metadata(
          locale,
          `/${section}`,
          title,
          page
            ? localized(page, "body", locale).slice(0, 160)
            : `${title} — ${dictionary[locale].footer}`,
        ),
        ...(["cart", "favorites"].includes(section)
          ? { robots: { index: false, follow: true } }
          : {}),
      }
    : {};
}
export default async function Section({ params }: Props) {
  const { locale, section } = await params;
  if (!isLocale(locale)) notFound();
  const d = dictionary[locale];
  if (section === "cart" || section === "favorites") {
    const products = await getProducts();
    const s = await getSettings();
    return (
      <div className="container">
        <div className="page-heading">
          <h1>{section === "cart" ? d.cart : d.favorites}</h1>
        </div>
        {section === "cart" ? (
          <Cart
            products={products}
            locale={locale}
            configured={!isDemo() && !!s.whatsapp}
          />
        ) : (
          <SavedProducts products={products} locale={locale} />
        )}
      </div>
    );
  }
  if (section === "categories") {
    const categories = await getCategories();
    return (
      <div className="container section">
        <div className="section-heading">
          <h1>{d.categories}</h1>
        </div>
        <div className="category-grid">
          {publicCategories.map((category) => {
            const source = categories.find((item) =>
              category.roots.some((root) => root === item.slug),
            );
            if (!source) return null;
            return (
              <Link
                className="category-card"
                href={`/${locale}/categories/${category.slug}`}
                key={category.slug}
              >
                <Image
                  src={source.image}
                  alt={publicCategoryName(category, locale)}
                  fill
                  sizes="(max-width:760px) 50vw, 25vw"
                />
                <div>
                  <h2 style={{ fontSize: "1.5rem" }}>
                    {publicCategoryName(category, locale)}
                  </h2>
                  <ArrowUpRight />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
  if (section === "needs") {
    return (
      <div className="container section">
        <div className="page-heading">
          <h1>{d.needTitle}</h1>
          <p>{d.categorySub}</p>
        </div>
        <div className="need-pills">
          {(await getTags()).map((t) => (
            <Link key={t.id} href={`/${locale}/products?need=${t.slug}`}>
              {localized(t, "name", locale)}
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </div>
    );
  }
  if (section === "guide") {
    return (
      <div className="container section">
        <div className="page-heading">
          <h1>{d.guide}</h1>
          <p>{d.guideSub}</p>
        </div>
        <div className="article-grid">
          {(await getArticles()).map((a) => (
            <article key={a.id}>
              <Link
                className="article-image"
                href={`/${locale}/guide/${a.slug}`}
              >
                <Image
                  src={a.image}
                  alt={localized(a, "title", locale)}
                  fill
                  sizes="(max-width:760px) 100vw, 50vw"
                />
              </Link>
              <h2 style={{ marginTop: 25, fontSize: "1.8rem" }}>
                <Link href={`/${locale}/guide/${a.slug}`}>
                  {localized(a, "title", locale)}
                </Link>
              </h2>
              <p>{localized(a, "excerpt", locale)}</p>
              <Link className="text-link" href={`/${locale}/guide/${a.slug}`}>
                {d.read}
                <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    );
  }
  const page = (await getPages()).find((p) => p.slug === section);
  if (!page || publicSections.includes(section)) notFound();
  if (
    ["about", "shipping", "returns", "faq", "privacy", "terms"].includes(
      section,
    )
  )
    return (
      <InformationalPage
        slug={
          section as
            | "about"
            | "shipping"
            | "returns"
            | "faq"
            | "privacy"
            | "terms"
        }
        title={localized(page, "title", locale)}
        body={localized(page, "body", locale)}
      />
    );
  const settings = section === "contact" ? await getSettings() : null;
  return (
    <article
      className={`container prose ${section === "contact" ? "contact-page" : ""}`}
    >
      <div className="page-heading">
        <h1>{localized(page, "title", locale)}</h1>
      </div>
      <p>{localized(page, "body", locale)}</p>
      {settings && (
        <>
          <SocialLinks
            locale={locale}
            instagram={settings.instagram}
            facebook={settings.facebook}
            whatsapp={settings.whatsapp}
            large
          />
          <address>
            {settings.email && (
              <p>
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            )}
            {settings.phone && (
              <p>
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
                  {settings.phone}
                </a>
              </p>
            )}
            <p>{localized(settings, "address", locale)}</p>
          </address>
        </>
      )}
    </article>
  );
}
