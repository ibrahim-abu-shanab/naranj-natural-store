import "dotenv/config";
import { Client } from "pg";
import { chromium } from "@playwright/test";
import { randomBytes, scryptSync } from "node:crypto";
import assert from "node:assert/strict";
const client = new Client({ connectionString: process.env.DATABASE_URL });
assert.ok(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL).hostname,
  ),
  "Admin UI checks require a local database.",
);
await client.connect();
const id = "ui-check-" + randomBytes(8).toString("hex"),
  email = id + "@example.invalid",
  password = randomBytes(24).toString("hex"),
  salt = randomBytes(16).toString("hex");
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
let browser;
try {
  await client.query(
    'INSERT INTO "User" (id,email,"passwordHash",active,"createdAt","updatedAt") VALUES ($1,$2,$3,true,NOW(),NOW())',
    [id, email, hash],
  );
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3000/admin/login");
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=password]").fill(password);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.locator(".stat-card").first().waitFor();
  assert.equal(await page.locator(".stat-card").count(), 6);
  assert.equal(await page.locator(".admin-body").getAttribute("dir"), "rtl");
  await page.screenshot({
    path: "artifacts/admin-ar-dashboard.png",
    fullPage: true,
  });
  for (const resource of [
    "products",
    "categories",
    "tags",
    "collections",
    "slides",
    "articles",
    "pages",
    "settings",
  ]) {
    await page.goto("http://localhost:3000/admin/" + resource);
    assert.equal(await page.locator(".admin-main h1").count(), 1);
    const labels = await page
      .locator(".admin-sidebar, .admin-top, label, th, legend, button")
      .allTextContents();
    assert.ok(
      !labels.some((t) => /[çğıİşü]|Varsayılan|Türkçe|Yalnızca/.test(t)),
      resource,
    );
  }
  await page.goto("http://localhost:3000/admin/products");
  await page
    .getByRole("textbox", { name: "البحث في السجلات" })
    .fill("no-such-product-987");
  await page.getByRole("heading", { name: "لا توجد نتائج مطابقة" }).waitFor();
  await page.getByRole("button", { name: "مسح التصفية" }).click();
  await page.screenshot({
    path: "artifacts/admin-ar-products.png",
    fullPage: true,
  });
  const product = (await client.query('SELECT id FROM "Product" LIMIT 1'))
    .rows[0];
  await page.goto("http://localhost:3000/admin/products/" + product.id);
  assert.ok((await page.locator(".admin-form-section").count()) >= 7);
  assert.equal(await page.locator("[name=nameTr]").getAttribute("dir"), "ltr");
  assert.equal(await page.locator("[name=nameAr]").getAttribute("dir"), "rtl");
  await page.screenshot({
    path: "artifacts/admin-ar-editor.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "artifacts/admin-ar-mobile.png",
    fullPage: true,
  });
  await page.goto("http://localhost:3000/admin/tags/new");
  await page.locator("[name=nameTr]").fill("Arayüz testi");
  await page.locator("[name=nameAr]").fill("اختبار واجهة الإدارة");
  await page.locator("[name=slug]").fill(id);
  await page.locator("[name=active]").check();
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/tags");
  await page
    .getByRole("textbox", { name: "البحث في السجلات" })
    .fill("اختبار واجهة الإدارة");
  page.once("dialog", async (dialog) => {
    assert.ok(dialog.message().startsWith("هل تريد حذف"));
    await dialog.dismiss();
  });
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  assert.equal(
    (
      await client.query('SELECT count(*)::int AS n FROM "Tag" WHERE slug=$1', [
        id,
      ])
    ).rows[0].n,
    1,
  );
  page.once("dialog", async (dialog) => await dialog.accept());
  await page.getByRole("button", { name: "حذف", exact: true }).click();
  await page.getByRole("heading", { name: "لا توجد نتائج مطابقة" }).waitFor();
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await page.waitForURL("**/admin/login");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Arabic RTL Admin, real counts, all lists, search/empty states, grouped bilingual fields, mobile layout, create/delete confirmation, login/logout",
  );
} finally {
  if (browser) await browser.close();
  await client.query('DELETE FROM "Tag" WHERE slug=$1', [id]);
  await client.query('DELETE FROM "Session" WHERE "userId"=$1', [id]);
  await client.query('DELETE FROM "User" WHERE id=$1', [id]);
  await client.end();
}
