import Image from "@/components/catalog-image";
import Link from "next/link";
import { dictionary, localized, money, type Locale } from "@/lib/i18n";
import type { CatalogProduct } from "@/lib/catalog";
import { Favorite, ProductControls } from "./product-controls";
export function ProductCard({
  product: p,
  locale,
}: {
  product: CatalogProduct;
  locale: Locale;
}) {
  const d = dictionary[locale];
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link
          href={`/${locale}/products/${p.slug}`}
          aria-label={localized(p, "name", locale)}
        >
          <Image
            src={p.images[0]?.url || "/images/image-placeholder.svg"}
            alt={
              p.images[0]
                ? localized(p.images[0], "alt", locale)
                : localized(p, "name", locale)
            }
            fill
            sizes="(max-width: 560px) 48vw, (max-width: 1000px) 30vw, 260px"
          />
          {p.images[1] && (
            <Image
              className="second-image"
              src={p.images[1].url}
              alt={localized(p.images[1], "alt", locale)}
              fill
              sizes="(max-width: 560px) 48vw, 260px"
            />
          )}
        </Link>
        <div className="badges">
          {p.oldPrice ? (
            <span className="offer-badge">
              −{Math.round((1 - p.price / p.oldPrice) * 100)}%
            </span>
          ) : p.isNew ? (
            <span>{d.newBadge}</span>
          ) : p.bestSeller ? (
            <span>{d.bestBadge}</span>
          ) : p.featured ? (
            <span>{d.featuredBadge}</span>
          ) : null}
        </div>
        <Favorite id={p.id} locale={locale} />
      </div>
      <div className="product-info">
        <h3>
          <Link href={`/${locale}/products/${p.slug}`}>
            {localized(p, "name", locale)}
          </Link>
        </h3>
        {p.size && <p className="product-size">{p.size}</p>}
        <div className="price-line">
          <strong>{money(p.price, locale)}</strong>
          {p.oldPrice && <del>{money(p.oldPrice, locale)}</del>}
          <span className={p.stock ? "in-stock" : "out-stock"}>
            {p.stock ? d.stock : d.unavailable}
          </span>
        </div>
        <ProductControls id={p.id} stock={p.stock} locale={locale} />
      </div>
    </article>
  );
}
