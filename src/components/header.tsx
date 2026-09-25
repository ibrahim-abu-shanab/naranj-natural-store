"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Heart, ShoppingBag, Menu, X, ChevronDown, Leaf } from "lucide-react";
import { dictionary, localized, type Locale } from "@/lib/i18n";
import { useStore } from "./store";
import { LiveSearch } from "./live-search";
import { BrandLogo } from "./brand-logo";
type Category = {
  id: string;
  slug: string;
  nameTr: string;
  nameAr: string;
  parentId: string | null;
};
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;
export function Header({
  locale,
  announcement,
  categories,
}: {
  locale: Locale;
  announcement: string;
  categories: Category[];
}) {
  const d = dictionary[locale],
    pathname = usePathname(),
    params = useSearchParams();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null),
    { items: storedItems } = useStore();
  // This boundary can hydrate after its provider has read localStorage.
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientHydrated,
    serverHydrated,
  );
  const items = hydrated ? storedItems : [];
  const other = locale === "tr" ? "ar" : "tr";
  const otherUrl =
    pathname.replace(/^\/(tr|ar)(?=\/|$)/, `/${other}`) +
    (params.size ? `?${params.toString()}` : "");
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <>
      <a href="#main" className="skip">
        {d.skip}
      </a>
      <div className="announcement">
        <div className="container">
          <span>
            <Leaf size={13} />
            {announcement || d.naturalSelection}
          </span>
          <div>
            <Link href={`/${locale}/guide`}>{d.guide}</Link>
            <Link href={`/${locale}/contact`}>{d.contact}</Link>
          </div>
        </div>
      </div>
      <header
        className="header shop-header"
        ref={root}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <div className="header-top container">
          <button
            className="icon mobile-menu"
            aria-label={open ? d.close : d.menu}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link
            href={`/${locale}`}
            className="logo storefront-logo"
            aria-label="NARANJ"
          >
            <BrandLogo
              locale={locale}
              sizes="(max-width: 360px) 28px, (max-width: 767px) 38px, 48px"
              preload
            />
          </Link>
          <LiveSearch locale={locale} />
          <div className="header-actions">
            <Link
              href={`/${locale}/favorites`}
              className="header-action"
              aria-label={d.favorites}
            >
              <Heart />
              <span>{d.favorites}</span>
            </Link>
            <Link
              href={`/${locale}/cart`}
              className="header-action cart-action"
              aria-label={d.cart}
            >
              <span className="cart-symbol">
                <ShoppingBag />
                <b>{items.reduce((n, p) => n + p.quantity, 0)}</b>
              </span>
              <span>{d.cart}</span>
            </Link>
            <a
              className="language"
              href={otherUrl}
              lang={other}
              hrefLang={other}
            >
              {other.toUpperCase()}
              <ChevronDown size={12} />
            </a>
          </div>
        </div>
        <nav
          id="main-nav"
          aria-label={d.categories}
          className={`nav category-nav ${open ? "open" : ""}`}
        >
          <div className="container nav-inner">
            {categories
              .filter((c) => !c.parentId)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/${locale}/categories/${c.slug}`}
                  aria-current={
                    pathname === `/${locale}/categories/${c.slug}`
                      ? "page"
                      : undefined
                  }
                  onClick={() => setOpen(false)}
                >
                  {localized(c, "name", locale)}
                </Link>
              ))}
            <Link
              className="mobile-all-products"
              href={`/${locale}/products`}
              onClick={() => setOpen(false)}
            >
              {d.products}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
