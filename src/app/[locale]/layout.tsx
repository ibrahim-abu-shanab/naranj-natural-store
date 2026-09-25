import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store";
import { getSettings, getCategories, isDemo } from "@/lib/catalog";
import { dictionary, isLocale, localized } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export const metadata = {
  robots:
    process.env.DEMO_MODE === "true"
      ? { index: false, follow: false }
      : undefined,
};
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);
  return (
    <StoreProvider>
      <Suspense>
        <Header
          locale={locale}
          announcement={localized(settings, "announcement", locale)}
          categories={categories.map(
            ({ id, slug, nameTr, nameAr, parentId }) => ({
              id,
              slug,
              nameTr,
              nameAr,
              parentId,
            }),
          )}
        />
      </Suspense>
      {isDemo() && <div className="demo-banner">{dictionary[locale].demo}</div>}
      <main id="main">{children}</main>
      <Footer
        locale={locale}
        instagram={settings.instagram}
        facebook={settings.facebook}
        whatsapp={settings.whatsapp}
      />
    </StoreProvider>
  );
}
