import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Heart,
  Info,
  Leaf,
  MapPin,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Truck,
  UserRound,
} from "lucide-react";

const pageIcons = {
  about: [Leaf, Sparkles, MessageCircle],
  shipping: [ClipboardCheck, Truck, PackageCheck, MapPin],
  returns: [RotateCcw, PackageCheck, TriangleAlert, ShieldCheck],
  privacy: [UserRound, Heart, MessageCircle, ShieldCheck],
  terms: [ShoppingBag, MessageCircle, ClipboardCheck, Truck],
};

function pairs(parts: string[]) {
  return Array.from({ length: Math.ceil(parts.length / 2) }, (_, index) => ({
    title: parts[index * 2],
    text: parts[index * 2 + 1] ?? "",
  }));
}

export function InformationalPage({
  slug,
  title,
  body,
}: {
  slug: "about" | "shipping" | "returns" | "faq" | "privacy" | "terms";
  title: string;
  body: string;
}) {
  const parts = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (slug === "faq")
    return (
      <article className="container info-page faq-page">
        <header className="info-page-heading">
          <CircleHelp aria-hidden="true" />
          <h1>{title}</h1>
        </header>
        <div className="faq-list">
          {pairs(parts).map((item, index) => (
            <details name="naranj-faq" key={item.title} open={index === 0}>
              <summary>
                <span>{item.title}</span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>{item.text}</p>
            </details>
          ))}
        </div>
      </article>
    );

  const isAbout = slug === "about";
  const isPolicy = slug === "privacy" || slug === "terms";
  const note = slug === "shipping" || isPolicy ? (parts.at(-1) ?? "") : "";
  const intro = isPolicy ? parts[0] : "";
  const content = isAbout
    ? parts.slice(2)
    : isPolicy
      ? parts.slice(1, -1)
      : note
        ? parts.slice(0, -1)
        : parts;
  const icons = pageIcons[slug];

  if (slug === "shipping" || isPolicy)
    return (
      <article
        className={`container info-page shipping-page ${isPolicy ? `policy-page ${slug}-page` : ""}`}
      >
        <header className="info-page-heading">
          <h1>{title}</h1>
          {intro && (
            <div className="info-page-intro">
              <p>{intro}</p>
            </div>
          )}
        </header>
        <div className={`shipping-journey ${slug}-process`}>
          {pairs(content).map((item, index, items) => {
            const Icon = icons[index] || PackageCheck;
            return (
              <div className="shipping-stage-wrap" key={item.title}>
                <section className="shipping-stage">
                  <span className="info-card-icon">
                    <Icon
                      aria-hidden="true"
                      className={
                        Icon === Truck ? "shipping-truck-icon" : undefined
                      }
                    />
                  </span>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </section>
                {slug !== "privacy" && index < items.length - 1 && (
                  <span className="shipping-connector" aria-hidden="true">
                    <ArrowRight />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {note && (
          <aside className="info-note">
            {slug === "privacy" ? (
              <ShieldCheck aria-hidden="true" />
            ) : (
              <Info aria-hidden="true" />
            )}
            <p>{note}</p>
          </aside>
        )}
      </article>
    );

  return (
    <article
      className={`container info-page ${isAbout ? "about-page" : "returns-page"}`}
    >
      <header className="info-page-heading">
        <h1>{title}</h1>
        {isAbout && (
          <div className="info-page-intro">
            <p>{parts[0]}</p>
            <p>{parts[1]}</p>
          </div>
        )}
      </header>
      <div className="info-card-grid">
        {pairs(content).map((item, index) => {
          const Icon = icons[index] || Info;
          return (
            <section className="info-card" key={item.title}>
              <span className="info-card-icon">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </section>
          );
        })}
      </div>
      {note && (
        <aside className="info-note">
          <Info aria-hidden="true" />
          <p>{note}</p>
        </aside>
      )}
    </article>
  );
}
