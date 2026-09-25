import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { assertSameOrigin, currentAdmin, rateLimit } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { boundedBody, BodyTooLarge } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const admin = await currentAdmin();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await rateLimit(`upload:${admin.id}`, 60, 60 * 60 * 1000)))
      return NextResponse.json(
        { error: "Upload limit reached." },
        { status: 429 },
      );
    if (Number(request.headers.get("content-length") || 0) > 9 * 1024 * 1024)
      return NextResponse.json(
        { error: "Maximum image size: 8 MB." },
        { status: 413 },
      );
    const bytesIn = await boundedBody(request, 9 * 1024 * 1024);
    const form = await new Response(Buffer.from(bytesIn), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
        file.type,
      ) ||
      file.size > 8 * 1024 * 1024
    )
      return NextResponse.json(
        {
          error: "JPEG, PNG, WebP, AVIF · en fazla 8 MB / بحد أقصى 8 ميغابايت",
        },
        { status: 422 },
      );
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width < 100 ||
      metadata.height < 100
    )
      throw new Error("Invalid dimensions");
    const bytes = await image
      .rotate()
      .resize({
        width: 2000,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const url = await storage().put(`${randomUUID()}.webp`, bytes);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof BodyTooLarge)
      return NextResponse.json(
        { error: "Maximum image size: 8 MB." },
        { status: 413 },
      );
    return NextResponse.json(
      {
        error:
          "Görsel yüklenemedi. Biçimi ve depolama ayarlarını kontrol edin. / تعذر رفع الصورة، تحقق من الصيغة وإعدادات التخزين.",
      },
      { status: 400 },
    );
  }
}
