import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";
import { parse } from "dotenv";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

// Persistent development PostgreSQL. No system service or production changes.
const root = process.cwd();
const directory = path.join(root, ".local-db");
const configPath = path.join(directory, "connection.json");
const envPath = path.join(root, ".env");
let envText = await readFile(existsSync(envPath) ? envPath : ".env.example", "utf8");
const previous = parse(envText);
if (previous.DATABASE_URL && !previous.DATABASE_URL.includes("CHANGE_ME") && !existsSync(configPath)) {
  throw new Error("An existing database is configured. Use npm run db:migrate; it was not changed.");
}
await mkdir(directory, { recursive: true });
const config = existsSync(configPath)
  ? JSON.parse(await readFile(configPath, "utf8"))
  : { user: "naranj_local", password: randomBytes(32).toString("hex"), port: 55440 };
const connectionString = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/naranj_local`;
if (previous.DATABASE_URL && !previous.DATABASE_URL.includes("CHANGE_ME") && previous.DATABASE_URL !== connectionString) {
  throw new Error("The configured database differs from the local database. Nothing was changed.");
}
await writeFile(configPath, JSON.stringify(config), { mode: 0o600 });
const pg = new EmbeddedPostgres({
  databaseDir: path.join(directory, "data"),
  ...config,
  persistent: true,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
  onLog: () => {},
  onError: () => {},
});
let started = false;
const probe = new Client({ connectionString, connectionTimeoutMillis: 1500 });
try {
  await probe.connect();
} catch (error) {
  if (!["ECONNREFUSED", "3D000"].includes(error.code)) throw error;
  if (error.code === "ECONNREFUSED") {
    if (!existsSync(path.join(directory, "data", "PG_VERSION"))) await pg.initialise();
    await pg.start();
    started = true;
  }
  const admin = pg.getPgClient("postgres");
  await admin.connect();
  try {
    if (!(await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", ["naranj_local"])).rowCount) {
      await admin.query('CREATE DATABASE "naranj_local"');
    }
  } finally { await admin.end(); }
} finally { await probe.end(); }
for (const [key, value] of Object.entries({ DATABASE_URL: connectionString, DIRECT_DATABASE_URL: connectionString, DEMO_MODE: "false" })) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  envText = pattern.test(envText) ? envText.replace(pattern, `${key}=${value}`) : `${envText}\n${key}=${value}\n`;
}
await writeFile(envPath, envText, { mode: 0o600 });
const env = { ...process.env, ...parse(envText) };
async function run(file, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], { cwd: root, env, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`Setup command failed (${code}).`)));
  });
}
await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
const client = new Client({ connectionString });
await client.connect();
try {
  if (!existsSync(path.join(directory, "initialized"))) {
    // Preserve the previous sample storefront for local editing and testing only.
    await client.query('UPDATE "Product" SET active=true');
    await client.query('UPDATE "HeroSlide" SET active=true');
    await client.query('UPDATE "Article" SET active=true');
    await client.query('UPDATE "SiteSettings" SET whatsapp=$1 WHERE id=$2', ["905340606911", "main"]);
    await writeFile(path.join(directory, "initialized"), "Local sample content initialized.\n");
  }
} finally { await client.end(); }
console.log("Local database ready. Settings and content persist in .local-db/. Create your admin with npm run admin:create.");
if (started) {
  console.log("Keep this terminal open. Ctrl+C stops PostgreSQL without deleting data.");
  await new Promise(resolve => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  await pg.stop();
}
