import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n";
import { SocialLinks } from "./social-links";
import { BrandLogo } from "./brand-logo";
export function Footer({
  locale,
  instagram,
  facebook,
  whatsapp,
}: {
  locale: Locale;
  instagram: string;
  facebook: string;
  whatsapp: string;
}) {
  const d = dictionary[locale];
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link
            className="logo footer-logo"
            href={`/${locale}`}
            aria-label="NARANJ"
          >
            <BrandLogo locale={locale} sizes="120px" />
          </Link>
          <p>{d.footer}</p>
        </div>
        <div>
          <h3>{d.discover}</h3>
          {[
            ["products", d.products],
            ["categories", d.categories],
            ["needs", d.needs],
            ["guide", d.guide],
          ].map(([path, label]) => (
            <Link key={path} href={`/${locale}/${path}`}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h3>NARANJ</h3>
          {[
            ["about", d.about],
            ["contact", d.contact],
            ["shipping", d.shipping],
            ["returns", d.returns],
            ["faq", d.faq],
          ].map(([path, label]) => (
            <Link key={path} href={`/${locale}/${path}`}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h3>{d.contact}</h3>
          <p>{d.footerContact}</p>
          <SocialLinks
            locale={locale}
            instagram={instagram}
            facebook={facebook}
            whatsapp={whatsapp}
          />
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} NARANJ. {d.copyright}
        </span>
        <div>
          <Link href={`/${locale}/privacy`}>{d.privacy}</Link>
          <Link href={`/${locale}/terms`}>{d.terms}</Link>
        </div>
        <span>TR / AR</span>
      </div>
    </footer>
  );
}
