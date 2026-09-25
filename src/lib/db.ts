import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required. See README.md.");
  if (!globalDb.prisma)
    globalDb.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 5,
      }),
    });
  return globalDb.prisma;
}
