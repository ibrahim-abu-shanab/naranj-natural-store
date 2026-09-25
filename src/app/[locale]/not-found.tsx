import Link from "next/link";
import { headers } from "next/headers";
export default async function NotFound() {
  const locale =
    (await headers()).get("x-naranj-locale") === "ar" ? "ar" : "tr";
  return (
    <div className="empty-state container">
      <h1>404 · NARANJ</h1>
      <p>{locale === "ar" ? "الصفحة غير موجودة" : "Sayfa bulunamadı"}</p>
      <Link className="button" href={`/${locale}`}>
        {locale === "ar" ? "العودة إلى الرئيسية" : "Ana sayfaya dön"}
      </Link>
    </div>
  );
}
