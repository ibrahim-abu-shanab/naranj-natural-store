import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export const sessionCookie =
  process.env.NODE_ENV === "production"
    ? "__Host-naranj-session"
    : "naranj-session";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function currentAdmin() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db().session.findUnique({
    where: { id: digest(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() && session.user.active
    ? session.user
    : null;
}
export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await db().session.create({ data: { id: digest(token), userId, expiresAt } });
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) await db().session.deleteMany({ where: { id: digest(token) } });
  jar.delete(sessionCookie);
}
export async function assertSameOrigin() {
  const h = await headers();
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  if (h.get("origin") !== expected) throw new Error("Invalid request origin");
}
export async function rateLimit(
  key: string,
  max = 5,
  windowMs = 15 * 60 * 1000,
) {
  const now = new Date();
  const reset = new Date(now.getTime() + windowMs);
  const rows = await db().$queryRaw<
    { count: number }[]
  >`INSERT INTO "LoginAttempt" ("key","count","resetAt") VALUES (${digest(key)},1,${reset}) ON CONFLICT ("key") DO UPDATE SET "count" = CASE WHEN "LoginAttempt"."resetAt" < ${now} THEN 1 ELSE "LoginAttempt"."count" + 1 END, "resetAt" = CASE WHEN "LoginAttempt"."resetAt" < ${now} THEN ${reset} ELSE "LoginAttempt"."resetAt" END RETURNING "count"`;
  return rows[0].count <= max;
}
