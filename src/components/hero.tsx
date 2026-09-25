"use client";
import { useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { dictionary, localized, type Locale } from "@/lib/i18n";
type Slide = {
  id: string;
  titleTr: string;
  titleAr: string;
  descriptionTr: string;
  descriptionAr: string;
  ctaTr: string;
  ctaAr: string;
  url: string;
  desktopImage: string;
  mobileImage: string;
};
export function Hero({ slides, locale }: { slides: Slide[]; locale: Locale }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const start = useRef<number | null>(null);
  const d = dictionary[locale];
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (paused || hover || hidden || reduced || slides.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      3000,
    );
    return () => clearInterval(id);
  }, [paused, hover, hidden, reduced, slides.length]);
  if (!slides.length) return null;
  const move = (offset: number) =>
    setIndex((i) => (i + offset + slides.length) % slides.length);
  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label={locale === "ar" ? "مختارات نارنج" : "NARANJ seçkileri"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
      onTouchStart={(e) => {
        start.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (start.current !== null) {
          const diff = e.changedTouches[0].clientX - start.current;
          if (Math.abs(diff) > 50)
            move((diff < 0 ? 1 : -1) * (locale === "ar" ? -1 : 1));
        }
        start.current = null;
      }}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hero-slide ${i === index ? "active" : ""}`}
          aria-hidden={i !== index}
          inert={i !== index}
        >
          <div className="hero-image">
            <picture>
              <source
                media="(max-width: 760px)"
                srcSet={
                  getImageProps({
                    src: s.mobileImage,
                    alt: "",
                    width: 900,
                    height: 1200,
                    sizes: "100vw",
                  }).props.srcSet
                }
              />
              <Image
                src={s.desktopImage}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 60vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            </picture>
          </div>
          <div className="container hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">
                <span /> {d.natural}
              </p>
              {i === 0 ? (
                <h1>{localized(s, "title", locale)}</h1>
              ) : (
                <h2>{localized(s, "title", locale)}</h2>
              )}
              <p>{localized(s, "description", locale)}</p>
              <Link
                className="button"
                href={`/${locale}${s.url.replace(/^\/(tr|ar)(?=\/|$)/, "")}`}
              >
                {localized(s, "cta", locale)}
                {locale === "ar" ? (
                  <ArrowLeft size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
              </Link>
              <span className="hero-caption">
                NARANJ —{" "}
                {locale === "tr"
                  ? "DOĞAL BAKIM KOLEKSİYONU"
                  : "مجموعة العناية الطبيعية"}
              </span>
            </div>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <div className="hero-controls container">
          <div className="dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                aria-label={`${i + 1}: ${localized(s, "title", locale)}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
              >
                <span />
              </button>
            ))}
          </div>
          <span className="slide-number">
            {String(index + 1).padStart(2, "0")}{" "}
            <span>/ {String(slides.length).padStart(2, "0")}</span>
          </span>
          <button
            className="icon"
            aria-label={paused ? d.play : d.pause}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            className="icon"
            aria-label={d.previous}
            onClick={() => move(-1)}
          >
            {locale === "ar" ? (
              <ArrowRight size={19} />
            ) : (
              <ArrowLeft size={19} />
            )}
          </button>
          <button className="icon" aria-label={d.next} onClick={() => move(1)}>
            {locale === "ar" ? (
              <ArrowLeft size={19} />
            ) : (
              <ArrowRight size={19} />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
