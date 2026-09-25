import Link from "next/link";
import { Search } from "lucide-react";
import {
  getCategories,
  getTags,
  getCollections,
  type CatalogProduct,
} from "@/lib/catalog";
import { dictionary, localized, type Locale } from "@/lib/i18n";
import { matchesSearch } from "@/lib/search";
import { ProductCard } from "./product-card";
import { JsonLd } from "./json-ld";
import { siteUrl } from "@/lib/seo";
export type SearchValues = Record<string, string | string[] | undefined>;
export async function CatalogView({
  locale,
  products,
  search,
  basePath,
}: {
  locale: Locale;
  products: CatalogProduct[];
  search: SearchValues;
  basePath: string;
}) {
  const d = dictionary[locale];
  const [categories, tags, collections] = await Promise.all([
    getCategories(),
    getTags(),
    getCollections(),
  ]);
  const value = (key: string) =>
    typeof search[key] === "string"
      ? (search[key] as string).slice(0, 150)
      : "";
  const query = value("q"),
    category = value("category"),
    need = value("need"),
    collection = value("collection"),
    sort = value("sort");
  let filtered = products.filter(
    (p) =>
      matchesSearch(
        p,
        query,
        categories.find((c) => c.id === p.category.parentId),
      ) &&
      (!category ||
        p.category.slug === category ||
        categories.some(
          (c) => c.slug === category && p.category.parentId === c.id,
        )) &&
      (!need || p.tags.some((t) => t.slug === need && t.active)) &&
      (!collection ||
        p.collections.some((c) => c.slug === collection && c.active)) &&
      (!value("featured") || p.featured) &&
      (!value("best") || p.bestSeller) &&
      (!value("new") || p.isNew),
  );
  if (sort === "price-asc")
    filtered = filtered.toSorted((a, b) => a.price - b.price);
  else if (sort === "price-desc")
    filtered = filtered.toSorted((a, b) => b.price - a.price);
  else if (sort === "newest")
    filtered = filtered.toSorted(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(
    pages,
    Math.max(1, Number.parseInt(value("page")) || 1),
  );
  const visible = filtered.slice((page - 1) * 12, page * 12);
  return (
    <div className="catalog-layout">
      <form className="filters" action={basePath}>
        <h2>{d.filter}</h2>
        <label>
          {d.searchButton}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={d.search}
            maxLength={150}
          />
        </label>
        <label>
          {d.categories}
          <select name="category" defaultValue={category}>
            <option value="">{d.all}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.parentId ? "— " : ""}
                {localized(c, "name", locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {d.needs}
          <select name="need" defaultValue={need}>
            <option value="">{d.all}</option>
            {tags.map((t) => (
              <option key={t.id} value={t.slug}>
                {localized(t, "name", locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {d.discover}
          <select name="collection" defaultValue={collection}>
            <option value="">{d.all}</option>
            {collections.map((c) => (
              <option key={c.id} value={c.slug}>
                {localized(c, "name", locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {d.sort}
          <select name="sort" defaultValue={sort}>
            <option value="">{d.recommended}</option>
            <option value="price-asc">{d.priceAsc}</option>
            <option value="price-desc">{d.priceDesc}</option>
            <option value="newest">{d.newest}</option>
          </select>
        </label>
        {["featured", "best", "new"].map((k) =>
          value(k) ? <input key={k} type="hidden" name={k} value="1" /> : null,
        )}
        <button className="button" type="submit">
          {d.filter}
        </button>
        <Link className="text-link" href={basePath}>
          {d.reset}
        </Link>
      </form>
      <div>
        <div className="catalog-toolbar">
          <span>
            {total} {d.count}
          </span>
          {query && <span>“{query}”</span>}
        </div>
        {visible.length ? (
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard product={p} locale={locale} key={p.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={45} />
            <h2>{query ? d.emptySearch : d.empty}</h2>
            <Link className="text-link" href={`/${locale}/products`}>
              {d.reset}
            </Link>
          </div>
        )}
        {pages > 1 && (
          <nav className="pagination" aria-label={d.next}>
            {Array.from({ length: pages }, (_, i) => {
              const q = new URLSearchParams();
              Object.entries(search).forEach(([k, v]) => {
                if (typeof v === "string") q.set(k, v);
              });
              q.set("page", String(i + 1));
              return (
                <Link
                  key={i}
                  aria-current={page === i + 1 ? "page" : undefined}
                  href={`${basePath}?${q}`}
                >
                  {i + 1}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: visible.map((p, i) => ({
            "@type": "ListItem",
            position: (page - 1) * 12 + i + 1,
            url: `${siteUrl()}/${locale}/products/${p.slug}`,
            name: localized(p, "name", locale),
          })),
        }}
      />
    </div>
  );
}
