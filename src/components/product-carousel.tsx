"use client";
import { useRef, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { dictionary, type Locale } from "@/lib/i18n";
export function ProductCarousel({
  title,
  href,
  locale,
  children,
  accent = false,
}: {
  title: string;
  href: string;
  locale: Locale;
  children: ReactNode;
  accent?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null),
    d = dictionary[locale];
  const [range, setRange] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      const position = Math.abs(element.scrollLeft);
      setRange({
        previous: position > 4,
        next: position + element.clientWidth < element.scrollWidth - 4,
      });
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [children]);
  const move = (direction: number) => {
    if (rail.current)
      rail.current.scrollBy({
        left:
          direction *
          (locale === "ar" ? -1 : 1) *
          rail.current.clientWidth *
          0.8,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <section className={`shop-section ${accent ? "shop-accent" : ""}`}>
      <div className="container">
        <div className="shop-section-heading">
          <h2>{title}</h2>
          <div>
            <Link href={href} aria-label={`${d.all}: ${title}`}>
              <span>{d.all}</span>
              <ArrowUpRight size={16} />
            </Link>
            {(range.previous || range.next) && (
              <div className="carousel-buttons">
                <button
                  type="button"
                  disabled={!range.previous}
                  aria-label={`${d.previous}: ${title}`}
                  onClick={() => move(-1)}
                >
                  {locale === "ar" ? (
                    <ChevronRight size={18} />
                  ) : (
                    <ChevronLeft size={18} />
                  )}
                </button>
                <button
                  type="button"
                  disabled={!range.next}
                  aria-label={`${d.next}: ${title}`}
                  onClick={() => move(1)}
                >
                  {locale === "ar" ? (
                    <ChevronLeft size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="product-rail"
          ref={rail}
          tabIndex={0}
          aria-label={title}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
