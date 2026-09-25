import { demoPages } from "./demo";

const restoredSlugs = new Set([
  "about",
  "contact",
  "shipping",
  "returns",
  "faq",
]);

// Keep saved administrator content; use the backup text only for missing pages.
export function withRestoredPages<T extends { slug: string }>(pages: T[]) {
  const existing = new Set(pages.map((page) => page.slug));
  return [
    ...pages,
    ...demoPages.filter(
      (page) => restoredSlugs.has(page.slug) && !existing.has(page.slug),
    ),
  ];
}
