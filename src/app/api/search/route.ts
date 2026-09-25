import { NextResponse } from "next/server";
import { getProducts, getCategories } from "@/lib/catalog";
import { matchesSearch } from "@/lib/search";
export async function GET(request: Request) {
  const query =
    new URL(request.url).searchParams.get("q")?.trim().slice(0, 150) || "";
  if (query.length < 2) return NextResponse.json({ products: [] });
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const matches = products.filter((p) =>
    matchesSearch(
      p,
      query,
      categories.find((c) => c.id === p.category.parentId),
    ),
  );
  return NextResponse.json(
    {
      products: matches
        .slice(0, 6)
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          nameTr: p.nameTr,
          nameAr: p.nameAr,
          price: p.price,
          size: p.size,
          image: p.images[0]?.url || "/images/image-placeholder.svg",
        })),
      total: matches.length,
    },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}
