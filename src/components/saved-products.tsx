"use client";
import { useStore } from "./store";
import { dictionary, localized, type Locale } from "@/lib/i18n";
import Link from "next/link";
import Image from "@/components/catalog-image";
import { Heart } from "lucide-react";
import { Favorite, ProductControls } from "./product-controls";
type SavedProduct = {
  id: string;
  slug: string;
  nameTr: string;
  nameAr: string;
  stock: number;
  images: { url: string }[];
};
export function SavedProducts({
  products,
  locale,
}: {
  products: SavedProduct[];
  locale: Locale;
}) {
  const { favorites, ready } = useStore();
  const saved = products.filter((p) => favorites.includes(p.id));
  const d = dictionary[locale];
  if (!ready) return <div className="skeleton" />;
  return saved.length ? (
    <div className="product-grid section">
      {saved.map((p) => (
        <article className="product-card" key={p.id}>
          <div className="product-photo">
            <Link href={`/${locale}/products/${p.slug}`}>
              <Image
                src={p.images[0]?.url || "/images/image-placeholder.svg"}
                alt={localized(p, "name", locale)}
                fill
                sizes="(max-width: 760px) 45vw, 25vw"
              />
            </Link>
            <Favorite id={p.id} locale={locale} />
          </div>
          <h2
            className="product-info"
            style={{ fontSize: "1.3rem", marginBottom: 18 }}
          >
            <Link href={`/${locale}/products/${p.slug}`}>
              {localized(p, "name", locale)}
            </Link>
          </h2>
          <ProductControls id={p.id} stock={p.stock} locale={locale} />
        </article>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <Heart size={50} />
      <h2>{d.noFavorites}</h2>
      <Link className="button" href={`/${locale}/products`}>
        {d.discover}
      </Link>
    </div>
  );
}
