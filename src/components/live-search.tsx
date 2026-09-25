"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "@/components/catalog-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, LoaderCircle, X } from "lucide-react";
import { dictionary, localized, money, type Locale } from "@/lib/i18n";
type Result = {
  id: string;
  slug: string;
  nameTr: string;
  nameAr: string;
  price: number;
  size: string;
  image: string;
};
export function LiveSearch({ locale }: { locale: Locale }) {
  const d = dictionary[locale],
    router = useRouter(),
    id = useId();
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [results, setResults] = useState<Result[]>([]),
    [loading, setLoading] = useState(false),
    [selected, setSelected] = useState(-1),
    [error, setError] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.products);
        setSelected(-1);
      } catch (e) {
        if (!(e instanceof Error && e.name === "AbortError")) {
          setResults([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const show = open && query.trim().length >= 2;
  return (
    <div className="live-search" ref={root}>
      <form
        role="search"
        action={`/${locale}/products`}
        onSubmit={(e) => {
          if (selected >= 0 && results[selected]) {
            e.preventDefault();
            router.push(`/${locale}/products/${results[selected].slug}`);
          }
          setOpen(false);
        }}
      >
        <label className="sr-only" htmlFor={id}>
          {d.search}
        </label>
        <input
          id={id}
          name="q"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={show ? `${id}-results` : undefined}
          aria-activedescendant={
            show && selected >= 0 ? `${id}-result-${selected}` : undefined
          }
          autoComplete="off"
          placeholder={d.search}
          maxLength={150}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setLoading(e.target.value.trim().length >= 2);
            setResults([]);
            setError(false);
            setOpen(true);
            setSelected(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setSelected((n) => Math.min(results.length - 1, n + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((n) => Math.max(-1, n - 1));
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label={d.clear}
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
          >
            <X size={15} />
          </button>
        )}
        <button
          type="submit"
          className="search-submit"
          aria-label={d.searchButton}
        >
          <Search size={22} />
        </button>
      </form>
      {show && (
        <div className="search-dropdown">
          <div className="search-result-heading">
            {d.searchResults}
            {loading && <LoaderCircle size={16} className="spin" />}
          </div>
          <ul id={`${id}-results`} role="listbox" aria-label={d.searchResults}>
            {results.map((p, i) => (
              <li
                key={p.id}
                id={`${id}-result-${i}`}
                role="option"
                aria-selected={selected === i}
                onMouseEnter={() => setSelected(i)}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/${locale}/products/${p.slug}`);
                  }}
                >
                  <Image src={p.image} alt="" width={48} height={48} />
                  <span>
                    <strong>{localized(p, "name", locale)}</strong>
                    <small>{p.size}</small>
                  </span>
                  <b>{money(p.price, locale)}</b>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !results.length && (
            <p className="search-empty">{error ? d.error : d.emptySearch}</p>
          )}
          <Link
            className="search-see-all"
            href={`/${locale}/products?q=${encodeURIComponent(query)}`}
            onClick={() => setOpen(false)}
          >
            {d.all}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
