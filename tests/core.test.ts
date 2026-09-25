import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { cartSchema, orderMessage, whatsappUrl } from "../src/lib/order";
import { normalizeSearch, matchesSearch } from "../src/lib/search";
import { schemas, imageUrl, internalUrl } from "../src/lib/validation";
import { demoProducts } from "../src/lib/demo";
import {
  boundedBody,
  boundedJson,
  BodyTooLarge,
} from "../src/lib/request-body";

test("request limits count streamed bytes without trusting Content-Length", async () => {
  const request = (parts: string[], declared?: string) =>
    new Request("http://localhost/test", {
      method: "POST",
      headers: declared ? { "Content-Length": declared } : {},
      body: new ReadableStream({
        start(controller) {
          for (const part of parts)
            controller.enqueue(new TextEncoder().encode(part));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });
  assert.deepEqual(await boundedJson(request(['{"ok":', "true}"]), 11), {
    ok: true,
  });
  await assert.rejects(
    boundedBody(request(["123", "456"], "1"), 5),
    BodyTooLarge,
  );
  await assert.rejects(boundedBody(request(["123456"]), 5), BodyTooLarge);
  await assert.rejects(boundedBody(request(["a"], "100"), 5), BodyTooLarge);
});
test("password hashes have unique salts and reject incorrect credentials", async () => {
  const a = await hashPassword("Long-password-for-testing");
  const b = await hashPassword("Long-password-for-testing");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("Long-password-for-testing", a), true);
  assert.equal(await verifyPassword("incorrect", a), false);
  assert.equal(await verifyPassword("anything", "invalid"), false);
});
test("cart rejects fractional, zero, excessive and duplicated quantities", () => {
  for (const quantity of [0, -1, 100, 1.5])
    assert.equal(cartSchema.safeParse([{ id: "a", quantity }]).success, false);
  assert.equal(
    cartSchema.safeParse([
      { id: "a", quantity: 1 },
      { id: "a", quantity: 2 },
    ]).success,
    false,
  );
  assert.equal(cartSchema.safeParse([{ id: "a", quantity: 2 }]).success, true);
});
test("WhatsApp messages include every line and exact integer monetary totals in both languages", () => {
  const lines = [
    { nameTr: "Yağ & Gül", nameAr: "زيت & ورد", price: 12345, quantity: 3 },
    { nameTr: "Serum", nameAr: "سيروم", price: 5050, quantity: 2 },
  ];
  const tr = orderMessage(lines, "tr");
  const ar = orderMessage(lines, "ar");
  assert.match(tr, /Adet: 3/);
  assert.match(tr, /Birim fiyat: 123,45 TL/);
  assert.match(tr, /Toplam: 370,35 TL/);
  assert.match(ar, /الكمية: 3/);
  assert.match(ar, /المجموع:/);
  assert.ok(tr.includes("471,35"));
  const url = new URL(whatsappUrl("905550001122", ar));
  assert.equal(url.searchParams.get("text"), ar);
  assert.throws(() => whatsappUrl("+90 unsafe", tr));
});
test("search normalizes Turkish casing, accents and Arabic marks", () => {
  assert.equal(normalizeSearch("SAÇ İÇİN"), "sac icin");
  assert.equal(normalizeSearch("أَرْغَان"), "ارغان");
  assert.ok(matchesSearch(demoProducts[0], "ARGAN"));
  assert.ok(matchesSearch(demoProducts[0], "الأرغان"));
  assert.ok(matchesSearch(demoProducts[0], "saç"));
});
test("input validation rejects unsafe URLs and malformed settings", () => {
  assert.equal(imageUrl.safeParse("javascript:alert(1)").success, false);
  assert.equal(
    imageUrl.safeParse("https://attacker.test/a.png").success,
    false,
  );
  assert.equal(internalUrl.safeParse("//attacker.test").success, false);
  assert.equal(internalUrl.safeParse("/products/argan-yagi").success, true);
  assert.equal(
    schemas.tags.safeParse({
      slug: "../bad",
      nameTr: "Test",
      nameAr: "تجربة",
      sortOrder: 0,
      active: true,
    }).success,
    false,
  );
});
