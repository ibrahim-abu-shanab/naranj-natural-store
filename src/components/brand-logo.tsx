import Image from "next/image";
import logo from "../../public/images/naranj-logo.png";
import type { Locale } from "@/lib/i18n";

export function BrandLogo({
  locale,
  sizes,
  preload = false,
}: {
  locale: Locale;
  sizes: string;
  preload?: boolean;
}) {
  return (
    <>
      <Image src={logo} alt="" sizes={sizes} preload={preload} />
      <div className="brand-wordmark">
        NARANJ
        <span className="brand-tagline">
          {locale === "ar" ? "من الطبيعة، بعناية" : "DOĞADAN, ÖZENLE"}
        </span>
      </div>
    </>
  );
}
