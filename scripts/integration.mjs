import "dotenv/config";
import EmbeddedPostgres from "embedded-postgres";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { createServer } from "node:net";
const portProbe = createServer();
await new Promise(resolve => portProbe.listen(0, "127.0.0.1", resolve));
const databasePort = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
import assert from "node:assert/strict";
const root = process.cwd();
const databaseDir = path.resolve(root, ".test-db", `run-${Date.now()}`);
assert.ok(databaseDir.startsWith(path.resolve(root, ".test-db") + path.sep));
const password = randomBytes(24).toString("hex");
const adminPassword = randomBytes(24).toString("hex");
const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin;
assert.ok(new URL(origin).protocol === "http:" && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Integration requires a local HTTP build origin.");
let occupied = false;
try { await fetch(origin); occupied = true; } catch {}
assert.ok(!occupied, "Stop the local storefront before integration checks; no existing server may be used.");
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "naranj_test",
  password,
  port: databasePort,
  persistent: false,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
  onError: () => {},
});
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://naranj_test:${password}@localhost:${databasePort}/naranj_test`,
  DIRECT_DATABASE_URL: `postgresql://naranj_test:${password}@localhost:${databasePort}/naranj_test`,
  NEXT_PUBLIC_SITE_URL: origin,
  DEMO_MODE: "false",
  STORAGE_DRIVER: "local",
  ADMIN_EMAIL: "test@example.invalid",
  ADMIN_PASSWORD: adminPassword,
};
function run(file, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      cwd: root,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let log = "";
    child.stdout.on("data", (chunk) => (log += chunk));
    child.stderr.on("data", (chunk) => (log += chunk));
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve(log) : reject(new Error(log)),
    );
  });
}
let server, browser, client;
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("naranj_test");
  console.log("PASS: isolated PostgreSQL started");
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
  await run("node_modules/tsx/dist/cli.mjs", ["scripts/create-admin.ts"]);
  console.log("PASS: migrations, idempotent seed and admin creation");
  client = pg.getPgClient("naranj_test");
  await client.connect();
  await client.query('UPDATE "Product" SET active=true');
  await client.query('UPDATE "HeroSlide" SET active=true');
  await client.query('UPDATE "Article" SET active=true');
  await client.query('UPDATE "SiteSettings" SET whatsapp=$1 WHERE id=$2', [
    "905340606911",
    "main",
  ]);
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", new URL(origin).port || "80"],
    { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  let serverLog = "";
  server.stdout.on("data", (b) => (serverLog += b));
  server.stderr.on("data", (b) => (serverLog += b));
  let ready = false;
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(origin + "/tr");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.ok(ready, serverLog);
  browser = await chromium.launch({ headless: true, channel: "msedge", args: ['--remote-debugging-port=9228'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push({url:page.url(),message:e.message}));
  await mkdir(path.join(root, "artifacts"), { recursive: true });
  await page.goto(origin + "/tr");
  await page.locator("main h1").filter({visible:true}).waitFor();
  await page.getByRole("button", {name:"Slaytı duraklat",exact:true}).click(); await page.getByRole("button", {name:"Slaytı oynat",exact:true}).waitFor(); await page.screenshot({ path: "artifacts/home-desktop-viewport.png" });
  assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
  const logo = page.locator(".storefront-logo > img");
  await logo.evaluate(img => img.decode());
  assert.ok((await logo.getAttribute("src")).includes("naranj-logo"));
  assert.ok(await logo.evaluate(img => img.naturalWidth > 0 && Math.abs(img.getBoundingClientRect().width / img.getBoundingClientRect().height - img.naturalWidth / img.naturalHeight) < 0.02));
  const homeSchemas = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  assert.ok(homeSchemas.some(s => s["@type"] === "Organization" && s.logo.endsWith("/images/naranj-logo.png")));
  assert.ok(homeSchemas.some(s => s["@type"] === "WebSite"));
  await page.getByRole("combobox").fill("argan");
  await page.getByRole("option").first().waitFor();
  await page.getByRole("combobox").press("Escape");
  await page.getByRole("combobox").fill("");
  const accessibility = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await writeFile('artifacts/accessibility.json', JSON.stringify(accessibility.violations, null, 2));
  console.log('Accessibility violations:', accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  assert.equal(await page.locator("html").getAttribute("lang"), "tr");
  assert.equal(await page.locator("main h1").filter({visible:true}).count(), 1);
  assert.ok(
    (await page.locator('link[rel="canonical"]').getAttribute("href")) ===
      origin + "/tr",
  );
  await page
    .locator(".product-card")
    .filter({ has: page.locator('a[href="/tr/products/argan-bakim-yagi"]') })
    .first()
    .getByRole("button", { name: "Listeye ekle", exact: true })
    .click();
  await page.goto(origin + "/tr/cart");
  await page.locator(".cart-line").waitFor();
  await page.getByRole("button", { name: "Adet +", exact: true }).click();
  await page.reload();
  assert.equal(await page.locator("output").innerText(), "2");
  const order = await page.request.post(origin + "/api/order", {
    headers: { Origin: origin },
    data: {
      locale: "tr",
      items: [{ id: "argan", quantity: 2 }],
      expectedTotal: 69800,
    },
  });
  assert.equal(order.status(), 200);
  assert.ok((await order.json()).url.startsWith("https://wa.me/"));
  // Exercise the actual order button, intercepting WhatsApp before any network request.
  for (const locale of ["tr", "ar"]) {
    await page.goto(origin + `/${locale}/cart`);
    await page.getByRole("button", { name: locale === "tr" ? "Adet −" : "الكمية −", exact: true }).click();
    await page.getByRole("button", { name: locale === "tr" ? "Adet +" : "الكمية +", exact: true }).click();
    const outbound = new Promise(resolve => page.route("https://wa.me/**", async route => {
      resolve(new URL(route.request().url()));
      await route.abort();
    }));
    await page.locator(".order-summary > button").click();
    const url = await outbound;
    assert.equal(url.pathname, "/905340606911");
    const message = url.searchParams.get("text");
    assert.match(message, locale === "tr" ? /Argan/ : /الأرغان/);
    assert.ok(message.includes(locale === "tr" ? "Adet: 2" : "الكمية: 2"));
    assert.ok(message.includes(locale === "tr" ? "Birim fiyat:" : "سعر الوحدة:"));
    assert.ok(message.includes(locale === "tr" ? "Toplam ürün adedi: 2" : "إجمالي عدد القطع: 2"));
    const currency = value => new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "ar-TR", {style: "currency", currency: "TRY"}).format(value);
    assert.ok(message.includes(currency(349)) && message.includes(currency(698)));
    await page.unroute("https://wa.me/**");
  }
  const stale = await page.request.post(origin + "/api/order", {
    headers: { Origin: origin },
    data: {
      locale: "ar",
      items: [{ id: "argan", quantity: 2 }],
      expectedTotal: 1,
    },
  });
  assert.equal(stale.status(), 409);
  await page.goto(origin + "/tr/products?q=ARGAN");
  assert.ok((await page.locator(".product-card").count()) > 0);
  assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
  await page.goto(origin + "/ar/products?q=" + encodeURIComponent("الأرغان"));
  assert.ok((await page.locator(".product-card").count()) > 0);
  await page.goto(origin + "/ar");
  assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
  await page.screenshot({ path: "artifacts/home-arabic.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/home-mobile-ar.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.getByRole("button", { name: "القائمة", exact: true }).click();
  await page
    .locator("#main-nav")
    .getByRole("link", { name: "المنتجات", exact: true })
    .click();
  await page.waitForURL("**/ar/products");
  await page.goto(origin + "/tr/products/argan-bakim-yagi");
  await page.locator("main h1").filter({visible:true}).waitFor();
  const schema = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  assert.ok(schema.some((t) => t.includes('"price":"349.00"')));
  await page.locator(".gallery-thumbs button").nth(1).click();
  assert.ok(
    (await page.locator(".gallery-main img").getAttribute("src")).includes(
      "oil-detail",
    ),
  );
  await page.locator(".detail-actions .favorite").click();
  await page.goto(origin + "/tr/favorites");
  await page.locator(".product-card").waitFor();
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.goto(origin + "/tr/missing-page");
  assert.ok((await page.textContent("body")).includes("404"));
  console.log(
    "PASS: SSR metadata/schema, TR/AR search, mobile RTL, gallery, favorites, cart persistence and WhatsApp totals",
  );
  const unauthorized = await page.request.put(origin + "/api/admin/tags/new", {
    headers: { Origin: origin },
    data: {},
  });
  assert.equal(unauthorized.status(), 401);
  await page.goto(origin + "/admin");
  await page.waitForURL("**/admin/login");
  await page.locator("input[name=email]").fill("test@example.invalid");
  await page.locator("input[name=password]").fill(adminPassword);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await page.waitForURL("**/admin");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "artifacts/admin-dashboard.png",
    fullPage: true,
  });
  // Localized category/article SEO is editable and persists through the real form/API.
  // Create real content through Admin, then follow that exact product to checkout.
  let parentId;
  for (const [slug, nameTr, nameAr] of [
    ["flow-category", "Deneme Kategorisi", "تصنيف تجريبي"],
    ["flow-subcategory", "Deneme Alt Kategori", "تصنيف فرعي تجريبي"],
  ]) {
    await page.goto(origin + "/admin/categories/new");
    for (const [key, value] of Object.entries({ slug, nameTr, nameAr, image: "/images/oil.webp" }))
      await page.locator(`[name="${key}"]`).fill(value);
    if (parentId) await page.locator('[name="parentId"]').selectOption(parentId);
    await page.locator('[name="active"]').check();
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await page.waitForURL("**/admin/categories");
    parentId = (await client.query('SELECT id FROM "Category" WHERE slug=$1', [slug])).rows[0].id;
  }
  await page.goto(origin + "/admin/products/new");
  const productFields = {
    slug: "flow-test-product", sku: "FLOW-TEST", nameTr: "Deneme Bakım Ürünü", nameAr: "منتج العناية التجريبي",
    shortTr: "Deneme açıklaması", shortAr: "وصف تجريبي قصير", descriptionTr: "Yerel akış testi için ürün.", descriptionAr: "منتج لاختبار المتجر المحلي.",
    ingredientsTr: "Test içeriği", ingredientsAr: "مكونات تجريبية", usageTr: "Test kullanımı", usageAr: "تعليمات تجريبية",
    warningsTr: "Satış için değildir", warningsAr: "غير مخصص للبيع", size: "100 ml", price: "125.50", oldPrice: "150", stock: "10",
  };
  for (const [key, value] of Object.entries(productFields)) await page.locator(`[name="${key}"]`).fill(value);
  await page.locator('[name="categoryId"]').selectOption(parentId);
  for (const key of ["featured", "isNew", "active"]) await page.locator(`[name="${key}"]`).check();
  for (let i = 0; i < 2; i++) {
    const uploadResponse = page.waitForResponse(r => r.url().endsWith("/api/admin/upload") && r.request().method() === "POST");
    await page.locator('input[type="file"]').setInputFiles(i ? "public/images/oil-detail.webp" : "public/images/oil.webp");
    const uploadedResponse = await uploadResponse;
    assert.equal(uploadedResponse.status(), 201, await uploadedResponse.text());
    await page.locator(".image-editor").nth(i).waitFor();
    await page.locator(".image-editor").nth(i).locator("input").nth(0).fill(`Deneme görseli ${i + 1}`);
    await page.locator(".image-editor").nth(i).locator("input").nth(1).fill(`صورة تجريبية ${i + 1}`);
  }
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/products");
  for (const locale of ["tr", "ar"]) {
    await page.goto(origin + `/${locale}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.ok(await page.locator(`a[href="/${locale}/products/flow-test-product"]`).count());
    assert.equal(await page.locator('a[href^="/admin"]').count(), 0);
    const search = page.getByRole("combobox").filter({ visible: true }).first();
    await search.fill(locale === "tr" ? productFields.nameTr : productFields.nameAr);
    await page.getByRole("option").filter({ hasText: locale === "tr" ? productFields.nameTr : productFields.nameAr }).getByRole("button").click();
    await page.waitForURL(`**/${locale}/products/flow-test-product`);
    await page.locator(".gallery-thumbs button").nth(1).waitFor();
    assert.equal(await page.locator(".gallery-thumbs button").count(), 2);
    const controls = page.locator(".product-controls");
    await controls.getByRole("button", { name: locale === "tr" ? "Adet +" : "الكمية +", exact: true }).click();
    await controls.getByRole("button", { name: locale === "tr" ? "Adet −" : "الكمية −", exact: true }).click();
    await controls.getByRole("button", { name: locale === "tr" ? "Adet +" : "الكمية +", exact: true }).click();
    await controls.locator(".add-button").click();
    await page.goto(origin + `/${locale}/cart`);
    assert.equal(await page.locator(".cart-line output").innerText(), "2");
    const outbound = new Promise(resolve => page.route("https://wa.me/**", async route => {
      resolve(new URL(route.request().url()));
      await route.abort();
    }));
    await page.locator(".order-summary > button").click();
    const url = await outbound;
    assert.equal(url.pathname, "/905340606911");
    const message = url.searchParams.get("text");
    assert.ok(message.includes(locale === "tr" ? productFields.nameTr : productFields.nameAr));
    assert.ok(message.includes(locale === "tr" ? "Toplam ürün adedi: 2" : "إجمالي عدد القطع: 2"));
    for (const amount of [125.50, 251]) assert.ok(message.includes(new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "ar-TR", { style: "currency", currency: "TRY" }).format(amount)));
    await page.unroute("https://wa.me/**");
  }
  console.log("PASS: Admin category/subcategory/product creation, two UI uploads, bilingual live search/detail/quantity/cart/WhatsApp flow");
  const seoTargets = [
    { resource: "categories", table: "Category", id: "hair", title: "name", description: "description", path: "categories" },
    { resource: "articles", table: "Article", id: (await client.query('SELECT id FROM "Article" ORDER BY id LIMIT 1')).rows[0].id, title: "title", description: "excerpt", path: "guide" },
  ];
  for (const target of seoTargets) {
    const record = (await client.query(`SELECT * FROM "${target.table}" WHERE id=$1`, [target.id])).rows[0];
    await page.goto(origin + `/admin/${target.resource}/${target.id}`);
    await page.locator('[name="seoTitleTr"]').fill("Özel SEO başlığı");
    await page.locator('[name="seoTitleAr"]').fill("عنوان مخصص لمحركات البحث");
    await page.locator('[name="seoDescriptionTr"]').fill("Özel Türkçe açıklama");
    await page.locator('[name="seoDescriptionAr"]').fill("وصف عربي مخصص");
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await page.waitForURL(`**/admin/${target.resource}`);
    for (const locale of ["tr", "ar"]) {
      await page.goto(origin + `/${locale}/${target.path}/${record.slug}`);
      assert.ok((await page.title()).includes(locale === "tr" ? "Özel SEO başlığı" : "عنوان مخصص لمحركات البحث"));
      assert.equal(await page.locator('meta[name="description"]').getAttribute("content"), locale === "tr" ? "Özel Türkçe açıklama" : "وصف عربي مخصص");
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), origin + `/${locale}/${target.path}/${record.slug}`);
      assert.equal(await page.locator('link[hreflang="ar"]').count(), 1);
      assert.equal(await page.locator('link[hreflang="tr-TR"]').count(), 1);
      if (target.resource === "articles") assert.equal(await page.locator('meta[property="og:type"]').getAttribute("content"), "article");
    }
    await page.goto(origin + `/admin/${target.resource}/${target.id}`);
    for (const field of ["seoTitleTr", "seoTitleAr", "seoDescriptionTr", "seoDescriptionAr"]) await page.locator(`[name="${field}"]`).fill("");
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await page.waitForURL(`**/admin/${target.resource}`);
    for (const locale of ["tr", "ar"]) {
      const suffix = locale === "tr" ? "Tr" : "Ar";
      await page.goto(origin + `/${locale}/${target.path}/${record.slug}`);
      assert.ok((await page.title()).includes(record[target.title + suffix]));
      assert.equal(await page.locator('meta[name="description"]').getAttribute("content"), record[target.description + suffix]);
    }
  }
  for (const resource of ["products", "categories", "tags", "collections", "slides", "articles", "settings", "pages"]) {
    await page.goto(origin + `/admin/${resource}`);
    assert.equal(await page.locator(".admin-main").count(), 1);
  }
  await page.goto(origin + "/admin/tags/new");
  await page.locator("input[name=nameTr]").fill("Test İhtiyacı");
  await page.locator("input[name=nameAr]").fill("احتياج تجريبي");
  await page.locator("input[name=slug]").fill("test-need");
  await page.locator("input[name=active]").check();
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/tags");
  assert.ok((await page.textContent("body")).includes("احتياج تجريبي"));
  const forbidden = await page.request.put(origin + "/api/admin/tags/new", {
    headers: { Origin: "https://wrong.invalid" },
    data: {},
  });
  assert.equal(forbidden.status(), 400);
  const tag = await client.query('SELECT id FROM "Tag" WHERE slug=$1', [
    "test-need",
  ]);
  assert.equal(tag.rowCount, 1);
  const deleted = await page.request.delete(
    origin + "/api/admin/tags/" + tag.rows[0].id,
    { headers: { Origin: origin } },
  );
  assert.equal(deleted.status(), 200);
  const xssLabel = '<script data-audit-xss>globalThis.__auditXss=1</script>';
  const xssTag = await page.request.put(origin + "/api/admin/tags/new", {
    headers: { Origin: origin },
    data: { slug: "audit-xss", nameTr: xssLabel, nameAr: xssLabel, active: true },
  });
  assert.equal(xssTag.status(), 200, await xssTag.text());
  const xssId = (await xssTag.json()).id;
  await page.goto(origin + "/tr/needs");
  assert.equal(await page.locator("script[data-audit-xss]").count(), 0);
  assert.equal(await page.evaluate(() => globalThis.__auditXss), undefined);
  assert.ok((await page.locator("main").innerText()).includes(xssLabel));
  assert.equal((await page.request.delete(origin + `/api/admin/tags/${xssId}`, { headers: { Origin: origin } })).status(), 200);
  assert.equal((await page.request.delete(origin + "/api/admin/tags/nonexistent-audit-id", { headers: { Origin: origin } })).status(), 404);
  const safeDelete = await page.request.delete(
    origin + "/api/admin/products/argan",
    { headers: { Origin: origin } },
  );
  assert.equal(safeDelete.status(), 400);
  await page.goto(origin + "/admin/products/argan");
  await page.locator("input[name=slug]").fill("argan-updated");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/products");
  const moved = await fetch(origin + "/tr/products/argan-bakim-yagi", {
    redirect: "manual",
  });
  assert.equal(moved.status, 308);
  assert.equal(new URL(moved.headers.get("location"), origin).pathname, "/tr/products/argan-updated");
  const image = await page.request.post(origin + "/api/admin/upload", {
    headers: { Origin: origin },
    multipart: {
      file: {
        name: "test.webp",
        mimeType: "image/webp",
        buffer: await (
          await import("node:fs/promises")
        ).readFile("public/images/oil.webp"),
      },
    },
  });
  assert.equal(image.status(), 201, serverLog);
  const uploaded = (await image.json()).url;
  assert.equal((await page.request.get(origin + uploaded)).status(), 200);
  const rejectedImage = await page.request.post(origin + "/api/admin/upload", {
    headers: { Origin: origin },
    multipart: {
      file: {
        name: "test.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      },
    },
  });
  assert.equal(rejectedImage.status(), 422);
  const oversizedImage = await page.request.post(origin + "/api/admin/upload", {
    headers: { Origin: origin },
    multipart: {
      file: {
        name: "oversized.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
      },
    },
  });
  assert.equal(oversizedImage.status(), 422);
  const robots = await (await fetch(origin + "/robots.txt")).text();
  assert.ok(robots.includes("Disallow: /admin") && robots.includes("Sitemap:"));
  assert.ok(!robots.includes("Disallow: /*?*"));
  await page.goto(origin + "/admin/settings");
  assert.equal(await page.locator('[name="whatsapp"]').inputValue(), "905340606911");
  const settingsSaved = page.waitForResponse(r => r.url().endsWith("/api/admin/settings/main") && r.request().method() === "PUT");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  assert.equal((await settingsSaved).status(), 200);
  assert.equal((await client.query('SELECT whatsapp FROM "SiteSettings" WHERE id=$1', ["main"])).rows[0].whatsapp, "905340606911");
  await page.goto(origin + "/admin/products/argan");
  assert.ok((await page.locator(".image-editor").count()) >= 2);
  for (const key of ["nameTr", "nameAr", "descriptionTr", "descriptionAr", "price", "oldPrice", "size", "stock", "ingredientsTr", "ingredientsAr", "usageTr", "usageAr", "warningsTr", "warningsAr", "featured", "isNew", "bestSeller", "active", "archived", "categoryId", "tagIds", "collectionIds", "seoTitleTr", "seoTitleAr"]) {
    assert.ok(await page.locator(`[name="${key}"]`).count(), key);
  }
  const sitemap = await (await fetch(origin + "/sitemap.xml")).text();
  assert.ok(sitemap.includes("/tr/products/argan-updated"));
  assert.ok(sitemap.includes("/ar/guide/"));
  assert.equal((await fetch(origin + "/ar/categories/sac-bakimi")).status, 200);
  for (const section of [
    "about",
    "contact",
    "shipping",
    "returns",
    "privacy",
    "terms",
    "faq",
    "guide",
    "categories",
    "needs",
  ])
    assert.equal((await fetch(origin + "/ar/" + section)).status, 200, section);
  // Verify remaining resource CRUD without touching persistent local content.
  for (const [resource, table] of [["collections", "Collection"], ["slides", "HeroSlide"], ["articles", "Article"]]) {
    const source = (await client.query(`SELECT * FROM "${table}" LIMIT 1`)).rows[0];
    const data = { ...source, ...(source.slug ? { slug: `audit-${resource}` } : {}), active: false };
    const created = await page.request.put(`${origin}/api/admin/${resource}/new`, { headers: { Origin: origin }, data });
    assert.equal(created.status(), 200, await created.text());
    const { id } = await created.json();
    const updated = { ...data, ...(source.nameAr ? { nameAr: "محتوى تم تحديثه" } : { titleAr: "محتوى تم تحديثه" }) };
    assert.equal((await page.request.put(`${origin}/api/admin/${resource}/${id}`, { headers: { Origin: origin }, data: updated })).status(), 200);
    const stored = (await client.query(`SELECT * FROM "${table}" WHERE id=$1`, [id])).rows[0];
    assert.equal(stored.nameAr || stored.titleAr, "محتوى تم تحديثه");
    assert.equal((await page.request.delete(`${origin}/api/admin/${resource}/${id}`, { headers: { Origin: origin } })).status(), 200);
    assert.equal((await client.query(`SELECT id FROM "${table}" WHERE id=$1`, [id])).rowCount, 0);
  }
  const contentPage = (await client.query('SELECT * FROM "Page" LIMIT 1')).rows[0];
  assert.equal((await page.request.put(`${origin}/api/admin/pages/${contentPage.id}`, { headers: { Origin: origin }, data: {...contentPage, bodyAr: "نص تجريبي محدّث"} })).status(), 200);
  assert.equal((await client.query('SELECT "bodyAr" FROM "Page" WHERE id=$1', [contentPage.id])).rows[0].bodyAr, "نص تجريبي محدّث");
  assert.equal((await page.request.put(`${origin}/api/admin/pages/${contentPage.id}`, { headers: { Origin: origin }, data: contentPage })).status(), 200);
  // Real edit, out-of-stock and archive behavior on the product created above.
  const flowProduct = (await client.query('SELECT * FROM "Product" WHERE slug=$1', ["flow-test-product"])).rows[0];
  await page.goto(`${origin}/admin/products/${flowProduct.id}`);
  await page.locator('[name="stock"]').fill("0");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/products");
  for (const locale of ["ar", "tr"]) {
    await page.goto(`${origin}/${locale}/products/flow-test-product`);
    await page.locator(".product-controls .add-button").waitFor();
    assert.equal(await page.locator(".product-controls .add-button").isDisabled(), true);
    assert.ok((await page.locator('script[type="application/ld+json"]').allTextContents()).some(t => t.includes("OutOfStock")));
    await page.goto(`${origin}/${locale}/missing-page`);
    assert.ok((await page.locator("main").innerText()).includes(locale === "ar" ? "الصفحة غير موجودة" : "Sayfa bulunamadı"));
  }
  await page.goto(`${origin}/admin/products/${flowProduct.id}`);
  await page.locator('[name="active"]').uncheck();
  await page.locator('[name="archived"]').check();
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();
  await page.waitForURL("**/admin/products");
  assert.equal((await page.request.delete(`${origin}/api/admin/products/${flowProduct.id}`, { headers: { Origin: origin } })).status(), 200);
  for (const slug of ["flow-subcategory", "flow-category"]) {
    const category = (await client.query('SELECT * FROM "Category" WHERE slug=$1', [slug])).rows[0];
    assert.equal((await page.request.put(`${origin}/api/admin/categories/${category.id}`, { headers: { Origin: origin }, data: {...category, descriptionAr: "تصنيف محدّث"} })).status(), 200);
    assert.equal((await page.request.delete(`${origin}/api/admin/categories/${category.id}`, { headers: { Origin: origin } })).status(), 200);
  }
  const badImage = await page.request.post(origin + "/api/admin/upload", { headers: {Origin: origin}, multipart: {file: {name:"fake.png",mimeType:"image/png",buffer:Buffer.from("not an image")}} });
  assert.equal(badImage.status(), 400);
  const tooLarge = await page.request.put(origin + "/api/admin/tags/new", { headers: {Origin: origin}, data: {nameAr:"x".repeat(200001)} });
  assert.equal(tooLarge.status(), 413);
  await page.goto(origin + "/admin");
  assert.equal(await page.locator('.admin-body').getAttribute('dir'), 'rtl');
  assert.equal(await page.locator('.stat-card').count(), 6);
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await page.waitForURL("**/admin/login");
  assert.equal((await page.request.post(origin + "/api/admin/upload", { headers: {Origin: origin}, data: {} })).status(), 401);
  assert.equal(
    (
      await page.request.put(origin + "/api/admin/tags/new", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
    401,
  );
  assert.equal(
    (await page.request.delete(origin + "/api/admin/tags/nonexistent-audit-id", { headers: { Origin: origin } })).status(),
    401,
  );
  const cookieName = "__Host-naranj-session";
  await context.addCookies([{ name: cookieName, value: "f".repeat(64), url: origin, httpOnly: true, secure: true, sameSite: "Strict" }]);
  await page.goto(origin + "/admin");
  await page.waitForURL("**/admin/login");
  await context.clearCookies();
  const expiredToken = randomBytes(32).toString("hex");
  const expiredId = createHash("sha256").update(expiredToken).digest("hex");
  const adminId = (await client.query('SELECT id FROM "User" WHERE email=$1', ["test@example.invalid"])).rows[0].id;
  await client.query('INSERT INTO "Session" (id,"userId","expiresAt") VALUES ($1,$2,$3)', [expiredId, adminId, new Date(Date.now() - 60_000)]);
  await context.addCookies([{ name: cookieName, value: expiredToken, url: origin, httpOnly: true, secure: true, sameSite: "Strict" }]);
  await page.goto(origin + "/admin");
  await page.waitForURL("**/admin/login");
  await context.clearCookies();
  await client.query('DELETE FROM "Session" WHERE id=$1', [expiredId]);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: admin login/logout, CRUD, authorization, origin checks, safe deletion, upload validation, slug redirects, sitemap and every informational route",
  );
  const report = await lighthouse(origin+'/tr', {port:9228,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']});
  await writeFile('artifacts/lighthouse.json', report.report);
  console.log('Lighthouse mobile:',Object.fromEntries(Object.entries(report.lhr.categories).map(([key,value])=>[key, Math.round(value.score*100)])));
  console.log("ALL INTEGRATION CHECKS PASSED. Screenshots: artifacts/.");
} finally {
  if (browser) await browser.close();
  if (server) {
    server.kill();
    await new Promise((r) => server.once("exit", r));
  }
  if (client) await client.end();
  await pg.stop();
}



