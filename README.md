# NARANJ

Bilingual Turkish/Arabic natural-care catalog, with an authenticated content manager and a WhatsApp order list. No card payments, customer accounts, fabricated reviews, or tracking are included.

## Quick start

Requirements: **Node.js 22.12+ or 24 LTS**, npm, PostgreSQL 16+ for real content. Dependencies are reproducibly recorded in `package-lock.json`.

```sh
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

PowerShell: replace the copy command with `Copy-Item .env.example .env`.

Visit `http://localhost:3000/tr` or `/ar`. `DEMO_MODE=true` enables a **read-only preview** without a database. It does not enable admin access or WhatsApp checkout. Preview products and prices are explicitly labeled; search engines are blocked. The actual seed and demo share four sample products, ten main categories, one subcategory, two articles and two slides.

## PostgreSQL and migrations

### Ready-to-use local database

Run `npm run db:local` in one terminal and keep it open. This uses the existing PostgreSQL development package, binds only to `127.0.0.1:55440`, creates random local credentials, applies migrations, and persists data in ignored `.local-db/`. It switches `.env` out of demo mode. On the first local initialization only, it activates the sample catalog for editing/testing and sets WhatsApp to `905340606911`. Later runs preserve content and settings. These sample records are not verified merchandise.

In a second terminal, run `npm run admin:create`, enter your email and a password of at least 14 characters, then run `npm run dev`. Open `http://localhost:3000/admin` directly to sign in. There is no public Admin link or default account. Storefronts are `http://localhost:3000/tr` and `/ar`. Change the WhatsApp number in **Admin → Site Settings**.

After restarting the computer, repeat `npm run db:local` and `npm run dev`; do not recreate the administrator. Ctrl+C stops the local database without deleting its data. Do not delete `.local-db/` if you want to keep your changes. This launcher refuses to overwrite an unrelated configured database.

Create a PostgreSQL database and a least-privileged application user. Set `DATABASE_URL` to the application connection string. For hosted providers, use their pooled URL for the application and a direct URL for `DIRECT_DATABASE_URL`. Follow the provider's TLS instructions; do not disable certificate verification.

```sh
npm run db:migrate
npm run db:seed
npm run admin:create
```

`admin:create` asks for an email and a hidden password of at least 14 characters. There are **no default credentials**, no public registration endpoint, and seed never creates an administrator. For CI, pass `ADMIN_EMAIL` and `ADMIN_PASSWORD` as temporary secret environment variables; remove them afterward. An existing user's password is never silently overwritten.

Set `DEMO_MODE=false`, restart the server, and open `/admin`. Seed is idempotent and preserves edited records. Sample products, slides and articles are initially **unpublished**, so real content can be checked before publishing. Populate settings, replace sample content/images, and activate the desired records. Categories can have one level of subcategories; product assignments use the leaf or main category.

To change the schema locally:

```sh
npm run db:dev -- --name describe_change
```

Commit the generated migration and schema together. In production use `npm run db:migrate`, never `db push` or a development reset. Back up the database before migrations.

## Scripts

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run dev`          | Local development                                                       |
| `npm run build`        | Generate Prisma client, type-check and produce Next.js production build |
| `npm start`            | Serve production build                                                  |
| `npm run lint`         | ESLint including Next.js and React rules                                |
| `npm run typecheck`    | Strict TypeScript check                                                 |
| `npm test`             | Password, order totals, input validation and bilingual search tests     |
| `npm run db:generate`  | Regenerate typed database client                                        |
| `npm run db:migrate`   | Apply committed production migrations                                   |
| `npm run db:seed`      | Add initial content without overwriting existing records                |
| `npm run admin:create` | Create an administrator securely                                        |

## Environment variables

| Variable                    | Use                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL application URL; required outside demo mode and for admin                                       |
| `DIRECT_DATABASE_URL`       | Direct connection for migration tooling; falls back to `DATABASE_URL`                                      |
| `NEXT_PUBLIC_SITE_URL`      | Exact origin, including scheme and development port; used by canonical URLs, JSON-LD and origin validation |
| `DEMO_MODE`                 | `true` for read-only example catalog; **false for a live store**                                           |
| `STORAGE_DRIVER`            | `local` or `s3`                                                                                            |
| `STORAGE_ENDPOINT`          | S3-compatible endpoint, e.g. R2, MinIO or a provider endpoint                                              |
| `STORAGE_REGION`            | S3 region, defaults to `auto`                                                                              |
| `STORAGE_BUCKET`            | Image bucket                                                                                               |
| `STORAGE_ACCESS_KEY_ID`     | Server-only storage access key                                                                             |
| `STORAGE_SECRET_ACCESS_KEY` | Server-only storage secret                                                                                 |
| `STORAGE_PUBLIC_URL`        | HTTPS public base URL for uploaded images; also configures the Next/Image allowlist                        |
| `GOOGLE_SITE_VERIFICATION`  | Optional actual Search Console verification token                                                          |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Reserved, empty GA4 configuration; analytics stays inactive until a real ID and consent integration are supplied |

Set the site origin consistently at build and runtime. Never commit `.env`, credentials, database dumps, or upload access keys. No analytics ID is configured or sent. The reserved GA4 variable alone does not activate tracking; introduce the applicable consent mechanism when implementing analytics. Product schema provides a starting point for a future Merchant Center feed, but no feed is currently submitted.

## Content management

The dashboard manages products, categories/subcategories, needs, collections, slides, articles, settings and informational pages. Each relevant content field is independently editable in Turkish and Arabic. Prices are entered in TRY in the editor and stored as **integer kuruş**, avoiding floating-point order totals. Product photos support bilingual alt text and reordering.

Products, categories and articles have optional SEO title and meta-description fields in both languages. Empty fields fall back to the localized product/category name and description or article title and excerpt. Existing safe slug redirects remain supported.

Featured/new/bestseller selections are product flags. Custom collections are separate many-to-many product groups, selected in the product editor. Active, nonempty collections populate the existing homepage collection section in their configured order. Needs/tags are independent of categories. Sliders accept an internal destination such as `/products`, `/products/product-slug`, `/categories/category-slug`, or `/products?collection=collection-slug`.

Renaming a product, category or article slug creates a permanent 308 redirect. Earlier redirects are flattened to the latest slug; reserved previous slugs cannot be reused. Product delete requires an inactive, archived product, with collection and hero references removed. Foreign keys prevent deleting categories still used by products or subcategories. Archive is the normal product removal flow.

Articles and informational pages use plain text with paragraphs. User-provided HTML is not rendered. The initial shipping, return, privacy and terms pages are explicitly **draft content**: replace them with the actual store identity, policies, delivery regions and conditions before public launch. No unverified legal commitments or medical claims are invented.

## Images and storage

`src/lib/storage.ts` exposes the `ImageStorage` interface. All upload processing calls this interface; frontend components only receive image URLs.

- **Local:** files are stored under `public/uploads` and served by a constrained `/uploads/[filename]` route. Mount a persistent volume and include it in backups. Local storage is refused on Vercel.
- **S3 compatible:** use a durable bucket and its HTTPS public origin/CDN URL. The app needs object-write access only to the intended image bucket/prefix. Images contain no application secrets. Restart/rebuild after changing the image CDN hostname.

Authenticated uploads allow JPEG/PNG/WebP/AVIF up to 8 MB, verify them with Sharp, limit decoded pixel count, remove metadata through re-encoding, cap dimensions and store UUID-named WebP files. SVG and executable content are rejected. Next/Image supplies responsive dimensions, lazy loading, AVIF/WebP optimization and image sizing. The first hero image uses responsive art direction and eager/high-priority loading; offscreen content is lazy loaded. Images are never deleted automatically when editing a product, to avoid breaking reused references.

The supplied transparent `public/images/naranj-logo.png` is connected to the public header at its original aspect ratio. Replace the bundled sample photos with real product photography before activating products. Image sources and usage notes: `docs/ASSETS.md`.

## Architecture

```text
src/app/[locale]/        Public server-rendered TR/AR pages
src/app/admin/           Login and protected admin routes
src/app/api/admin/       Authenticated content and image mutations
src/app/api/order/       Validated WhatsApp quotation URL
src/components/         Storefront interactions and reusable UI
src/components/admin/   Content editors
src/lib/catalog.ts      Server-only catalog repository / explicit demo mode
src/lib/i18n.ts          Typed interface dictionaries and currency formatting
src/lib/auth.ts          Sessions, origin checks and database rate limiting
src/lib/validation.ts    Authoritative server validation
src/lib/storage.ts       Replaceable image storage drivers
prisma/                 Relational schema, migrations and seed
tests/                  Core invariant tests
scripts/                Admin provisioning and integration verification
```

All public route segments are consistently shared across languages (`/tr/products/...`, `/ar/products/...`). Slugs are readable, unique and language-neutral record identifiers; neither language is redirected to the other's content. The language switch preserves the current route/query and loads a new document so the root HTML language and direction are correct. Arabic uses logical layout properties and full RTL.

The product content, ingredients, warnings and article bodies are rendered on the server. Browser code is limited to slider controls, mobile navigation, galleries, local cart/favorites and admin forms. Search normalizes Turkish accents/dotted-I and Arabic diacritics, and matches product fields, category/parent category and needs. Search currently filters a server-fetched catalog and paginates the rendered result (12 items/page), suitable for a small-to-medium brand catalog. For a very large catalog, replace this repository search with indexed PostgreSQL full-text/trigram queries while keeping the public interface.

SEO includes unique metadata, canonical URLs, language alternates, Open Graph/X fields, sitemap, robots, breadcrumbs and Organization/WebSite/Product/ItemList/Article structured data. No ratings or reviews are manufactured. Search/filter/cart/favorites pages are not indexed. Image caching is immutable for uploads; request-level data deduplication avoids redundant Prisma reads. Product data is live per request so admin edits and stock updates do not wait for an ISR cache expiry.

## Storefront design

The compact storefront uses white and light-gray surfaces, saturated NARANJ green, locally hosted Manrope and Noto Sans Arabic fonts, responsive product carousels and quantity controls. Desktop navigation and its subcategory mega-menu come from active Admin/database categories ordered by their sort value; the first seven main categories are always visible. Live search uses the same catalog normalization as full search. Homepage selections use existing product flags, categories, collections and slides. Arabic uses RTL and Turkish LTR.

## Order flow

Only IDs and quantities are stored in browser localStorage. Current products and prices are loaded from the server. Before returning a WhatsApp URL, the server validates item IDs, unique lines, integer quantities (1–99), active products, stock and expected total. If prices or stock change, checkout requests a cart refresh. The WhatsApp number comes from the database settings. The URL contains localized product names, quantities, unit prices, piece count and total.

Sending a message is initiated by the customer. The site never sends one automatically, reserves inventory, stores an order, or claims that a sale is confirmed. Shipping and stock are confirmed with the store. There is no online payment.

## Security and operations

Passwords use salted scrypt. Session cookies contain a random token; only its SHA-256 digest is stored in PostgreSQL. Sessions expire after eight hours; logout deletes the session, and disabling a user revokes access at the next server check. Cookies are HttpOnly, SameSite=Strict, and Secure with a `__Host-` name in production. Every protected page and mutation checks the active user server-side; access does not depend on hiding a URL.

Login rate limits are shared through PostgreSQL and updated atomically, including an email limit and an overall login ceiling. Uploads are rate-limited per administrator. Mutations enforce the configured exact Origin, use server validation and relational transactions, and never evaluate user HTML. Security headers include frame blocking, MIME sniffing prevention, a baseline CSP, permissions policy and production HSTS. The baseline CSP permits Next.js inline scripts; user content remains escaped and uploads are re-encoded. Put a body-size limit and abuse protection at the host/proxy for public endpoints.

Expire operational rows periodically with your provider's scheduler:

```sql
DELETE FROM "Session" WHERE "expiresAt" < NOW();
DELETE FROM "LoginAttempt" WHERE "resetAt" < NOW() - INTERVAL '1 day';
```

To revoke an administrator, set `User.active=false` and delete their sessions using a trusted database administration channel. No password-reset-by-email service is assumed. Keep database backups, storage backups, TLS, dependency security updates and application error monitoring in the deployment runbook.

## Production deployment

### Vercel

1. Provision PostgreSQL and an S3-compatible image bucket/CDN.
2. Import the repository as a Next.js project. Use Node 22/24, `npm ci` and `npm run build`.
3. Set all environment variables, `DEMO_MODE=false`, `STORAGE_DRIVER=s3`, and the final HTTPS `NEXT_PUBLIC_SITE_URL`.
4. Apply `npm run db:migrate` in a controlled release step with the direct database connection. Run seed only if initial drafts are wanted.
5. Create an administrator through a trusted terminal, upload real content, set WhatsApp and contact details, and review store policies.
6. Verify both languages, image uploads, login, canonical/hreflang, sitemap and order messaging on the deployed HTTPS domain. Add `/sitemap.xml` in Search Console after verification.

### Node host / container

Use a maintained Node runtime, `npm ci`, `npm run build`, and `npm start` behind an HTTPS reverse proxy. Configure the exact public origin, a managed PostgreSQL database and either object storage or a persistent uploads volume. Run migrations before switching traffic. Do not expose the database publicly.

The build does not need a live database because catalog routes are dynamically rendered. A successful build does **not** prove that deployment credentials, storage permissions or database connectivity have been configured. Those must be verified against the target environment.

## Verification

Core checks are `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. `scripts/integration.mjs` exercises a temporary PostgreSQL database and a headless browser: migrations, seed twice, admin provisioning, SSR metadata/schema, TR/AR search, RTL/mobile layout, local cart persistence, WhatsApp totals, CRUD, permissions, CSRF-origin rejection, image validation, redirects and logout. It never opens WhatsApp or sends a real message. It writes screenshots under ignored `artifacts/` and shuts down its temporary server/database.

Stop the storefront before running integration checks: the isolated test server uses the same localhost origin as the build so canonical URLs and origin protection can be tested accurately. The script refuses to use an already-running server. Integration uses the existing PostgreSQL development launcher and Microsoft Edge on Windows; it never uses the persistent `.local-db/` database. The local database launcher is a development convenience, not a deployment dependency. See `docs/VERIFICATION.md` for actual run results and limitations; do not treat localhost Lighthouse results as field Core Web Vitals.
