// Explicit, idempotent category-only maintenance. Never run during build/start.
const fs = require("node:fs");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
const { parse } = require("dotenv");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/lib/home-categories.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const data = { exports: {} };
new Function("exports", "module", compiled)(data.exports, data);
const categories = data.exports.homeCategories;
const env = parse(fs.readFileSync(path.join(root, ".env")));
const client = new Client({
  connectionString: process.env.DATABASE_URL || env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
});

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query('LOCK TABLE "Category", "Product", "SlugRedirect" IN SHARE ROW EXCLUSIVE MODE');
    const before = (await client.query('SELECT count(*)::int AS count FROM "Product"')).rows[0].count;
    const ids = new Map();
    for (const [order, category] of categories.entries()) {
      const result = await client.query(`
        INSERT INTO "Category" (id, slug, "nameAr", "nameTr", "descriptionAr", "descriptionTr", image, "sortOrder", active, "parentId", "createdAt", "updatedAt")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NULL,NOW(),NOW())
        ON CONFLICT (slug) DO UPDATE SET
          "nameAr"=EXCLUDED."nameAr", "nameTr"=EXCLUDED."nameTr",
          "descriptionAr"=EXCLUDED."descriptionAr", "descriptionTr"=EXCLUDED."descriptionTr",
          image=EXCLUDED.image, "sortOrder"=EXCLUDED."sortOrder", active=true, "parentId"=NULL, "updatedAt"=NOW()
        RETURNING id`, [randomUUID(), category.slug, category.nameAr, category.nameTr, category.descriptionAr, category.descriptionTr, category.image, order]);
      ids.set(category.slug, result.rows[0].id);
    }
    const targetSlug = "sac-vucut-bakimi";
    const targetId = ids.get(targetSlug);
    const old = await client.query('SELECT id,slug FROM "Category" WHERE slug=$1 OR "nameAr"=$2 OR "nameTr"=$3',
      ["sac-serumlari", "سيرومات الشعر", "Saç Serumları"]);
    let moved = 0;
    for (const category of old.rows) {
      moved += (await client.query('UPDATE "Product" SET "categoryId"=$1,"updatedAt"=NOW() WHERE "categoryId"=$2', [targetId, category.id])).rowCount;
      await client.query('UPDATE "Category" SET "parentId"=$1,"updatedAt"=NOW() WHERE "parentId"=$2', [targetId, category.id]);
      await client.query('UPDATE "SlugRedirect" SET "newSlug"=$1 WHERE kind=$2 AND "newSlug"=$3', [targetSlug, "categories", category.slug]);
      await client.query(`INSERT INTO "SlugRedirect" (id,kind,"oldSlug","newSlug","createdAt")
        VALUES ($1,'categories',$2,$3,NOW()) ON CONFLICT (kind,"oldSlug") DO UPDATE SET "newSlug"=EXCLUDED."newSlug"`,
      [randomUUID(), category.slug, targetSlug]);
      await client.query('DELETE FROM "Category" WHERE id=$1', [category.id]);
    }
    const after = (await client.query('SELECT count(*)::int AS count FROM "Product"')).rows[0].count;
    if (before !== after) throw new Error("Product count changed");
    await client.query("COMMIT");
    console.log(JSON.stringify({ categories: categories.map((c) => c.slug), removedCategories: old.rowCount, reassignedProducts: moved, productsBefore: before, productsAfter: after }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
main().catch((error) => {
  console.error("Category integration failed:", error.code || error.name);
  process.exitCode = 1;
}).finally(() => client.end());
