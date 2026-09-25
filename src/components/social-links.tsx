import { Facebook, Instagram } from "lucide-react";
import type { Locale } from "@/lib/i18n";

function WhatsAppIcon({
  "aria-hidden": ariaHidden,
}: {
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <svg aria-hidden={ariaHidden} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2a9.84 9.84 0 0 0-8.48 14.8L2 22l5.34-1.53A9.9 9.9 0 1 0 12.04 2Zm0 17.78a7.83 7.83 0 0 1-4-1.1l-.29-.17-3.17.91.93-3.08-.19-.3a7.77 7.77 0 1 1 6.72 3.74Zm4.3-5.82c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.9-1.18a7.1 7.1 0 0 1-1.31-1.63c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.4-.58 1.6-1.13.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function SocialLinks({
  locale,
  instagram,
  facebook,
  whatsapp,
  large = false,
}: {
  locale: Locale;
  instagram: string;
  facebook: string;
  whatsapp: string;
  large?: boolean;
}) {
  const links = [
    {
      platform: "whatsapp",
      href: whatsapp ? `https://wa.me/${whatsapp}` : "",
      name: locale === "ar" ? "واتساب" : "WhatsApp",
      label:
        locale === "ar"
          ? "محادثة نارنج عبر واتساب"
          : "NARANJ ile WhatsApp üzerinden konuş",
      icon: WhatsAppIcon,
    },
    {
      platform: "facebook",
      href: facebook,
      name: locale === "ar" ? "فيسبوك" : "Facebook",
      label:
        locale === "ar"
          ? "فيسبوك نارنج، يفتح في نافذة جديدة"
          : "NARANJ Facebook, yeni sekmede açılır",
      icon: Facebook,
    },
    {
      platform: "instagram",
      href: instagram,
      name: locale === "ar" ? "إنستغرام" : "Instagram",
      label:
        locale === "ar"
          ? "إنستغرام نارنج، يفتح في نافذة جديدة"
          : "NARANJ Instagram, yeni sekmede açılır",
      icon: Instagram,
    },
  ].filter(({ href }) => href);

  return (
    <div
      className={`social-icon-links${large ? " social-icon-links-large" : ""}`}
    >
      {links.map(({ platform, href, label, name, icon: Icon }) => (
        <a
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          aria-label={label}
          title={label}
          key={href}
          data-platform={platform}
        >
          {large && <span className="social-platform-name">{name}</span>}
          <Icon aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
