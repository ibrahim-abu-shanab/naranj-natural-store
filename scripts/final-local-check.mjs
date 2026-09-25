import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const origin='http://localhost:3000';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
const page=await browser.newPage();
for(const locale of ['ar','tr']) {
for(const width of [390,1440]) {
await page.setViewportSize({width,height:900});
await page.goto(`${origin}/${locale}`);
await page.locator('header .logo img').waitFor();
assert.equal(await page.locator('html').getAttribute('dir'),locale==='ar'?'rtl':'ltr');
assert.equal(await page.locator('a[href^="/admin"]').count(),0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:`artifacts/final-${locale}-${width}.png`});
}
}
const productHref=await page.locator('.product-card h3 a').first().getAttribute('href');
const ssr=await browser.newContext({javaScriptEnabled:false});
const staticPage=await ssr.newPage();
await staticPage.goto(origin+productHref);
assert.equal(await staticPage.locator('h1').count(),1);
assert.ok((await staticPage.locator('script[type="application/ld+json"]').allTextContents()).some(t=>t.includes('"Product"') && t.includes('"BreadcrumbList"')));
assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'),origin+productHref);
assert.equal(await staticPage.locator('link[hreflang="ar"]').count(),1);
assert.equal(await staticPage.locator('link[hreflang="tr-TR"]').count(),1);
await ssr.close();
await page.route('**/_next/image?**',async route=>route.fulfill({status:404,body:''}));
await page.goto(origin+productHref);
await page.waitForFunction(()=>document.querySelector('.gallery-main img')?.getAttribute('src')==='/images/image-placeholder.svg');
assert.ok(await page.locator('.gallery-main img[src="/images/image-placeholder.svg"]').first().evaluate(img=>img.complete && img.naturalWidth>0));
await page.unroute('**/_next/image?**');
for(const locale of ['tr','ar']) {
await page.goto(`${origin}/${locale}/cart`);
assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
await page.goto(`${origin}/${locale}/products?q=no-such-product-987`);
assert.equal(await page.locator('.product-card').count(),0);
assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
}
console.log('PASS: desktop/mobile AR/TR, SSR without JavaScript, canonical/hreflang/schema, missing-image fallback, private/search noindex and empty results');
} finally {await browser.close();}

