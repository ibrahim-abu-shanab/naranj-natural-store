"use client";
import { useState } from "react";
import Image from "@/components/catalog-image";
import { localized, type Locale } from "@/lib/i18n";
export function Gallery({
  images,
  locale,
}: {
  images: { url: string; altTr: string; altAr: string }[];
  locale: Locale;
}) {
  const [index, setIndex] = useState(0);
  if (!images.length)
    return (
      <div className="gallery">
        <div className="gallery-main">
          <Image
            src="/images/image-placeholder.svg"
            alt={
              locale === "ar"
                ? "صورة المنتج غير متاحة"
                : "Ürün görseli mevcut değil"
            }
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </div>
    );
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Image
          src={images[index].url}
          alt={localized(images[index], "alt", locale)}
          fill
          sizes="(max-width: 760px) 100vw, 50vw"
          preload
        />
      </div>
      <div className="gallery-thumbs">
        {images.map((img, i) => (
          <button
            key={i}
            className={i === index ? "selected" : ""}
            aria-label={localized(img, "alt", locale)}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            <Image src={img.url} alt="" width={90} height={90} />
          </button>
        ))}
      </div>
    </div>
  );
}
