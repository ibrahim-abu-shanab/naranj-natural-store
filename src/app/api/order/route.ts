import { NextResponse } from "next/server";
import { z } from "zod";
import { getProducts, getSettings, isDemo } from "@/lib/catalog";
import { cartSchema, orderMessage, whatsappUrl } from "@/lib/order";
import { assertSameOrigin } from "@/lib/auth";
import { boundedJson, BodyTooLarge } from "@/lib/request-body";
export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    if (Number(request.headers.get("content-length") || 0) > 30000)
      return NextResponse.json({ code: "INVALID" }, { status: 413 });
    const payload = z
      .object({
        locale: z.enum(["tr", "ar"]),
        items: cartSchema.refine((v) => v.length > 0),
        expectedTotal: z.number().int().min(1),
      })
      .safeParse(await boundedJson(request, 30000));
    if (!payload.success)
      return NextResponse.json({ code: "INVALID" }, { status: 400 });
    const { locale, items, expectedTotal } = payload.data;
    const settings = await getSettings();
    if (isDemo() || !settings.whatsapp)
      return NextResponse.json({ code: "NOT_CONFIGURED" }, { status: 503 });
    const products = await getProducts();
    const lines = [];
    for (const item of items) {
      const p = products.find((p) => p.id === item.id);
      if (!p || p.stock < item.quantity)
        return NextResponse.json({ code: "STALE_CART" }, { status: 409 });
      lines.push({ ...p, quantity: item.quantity });
    }
    if (lines.reduce((n, p) => n + p.price * p.quantity, 0) !== expectedTotal)
      return NextResponse.json({ code: "STALE_CART" }, { status: 409 });
    return NextResponse.json(
      { url: whatsappUrl(settings.whatsapp, orderMessage(lines, locale)) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BodyTooLarge)
      return NextResponse.json({ code: "INVALID" }, { status: 413 });
    return NextResponse.json({ code: "INVALID" }, { status: 400 });
  }
}
