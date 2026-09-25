import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(
    /^\/(tr|ar)\/(products|categories|guide)\/([a-z0-9-]+)$/,
  );
  if (match && process.env.DEMO_MODE !== "true") {
    const kind = match[2] === "guide" ? "articles" : match[2];
    const redirect = await db().slugRedirect.findUnique({
      where: { kind_oldSlug: { kind, oldSlug: match[3] } },
    });
    if (redirect) {
      const destination = request.nextUrl.clone();
      destination.pathname = `/${match[1]}/${match[2]}/${redirect.newSlug}`;
      return NextResponse.redirect(destination, 308);
    }
  }
  const headers = new Headers(request.headers);
  headers.set(
    "x-naranj-locale",
    request.nextUrl.pathname.split("/")[1] === "ar" ? "ar" : "tr",
  );
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|uploads|favicon.svg).*)"],
};
