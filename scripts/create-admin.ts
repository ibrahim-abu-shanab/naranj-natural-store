import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
async function hiddenPassword() {
  if (!stdin.isTTY)
    throw new Error("Use an interactive terminal or ADMIN_PASSWORD.");
  stdout.write("Password (minimum 14 characters): ");
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString()) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };
    stdin.on("data", onData);
  });
}
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = z
    .email()
    .parse(process.env.ADMIN_EMAIL || (await rl.question("Admin email: ")))
    .toLowerCase();
  rl.close();
  const password = z
    .string()
    .min(14)
    .max(128)
    .parse(process.env.ADMIN_PASSWORD || (await hiddenPassword()));
  if (await db().user.findUnique({ where: { email } }))
    throw new Error(
      "An admin with this email already exists; no password was changed.",
    );
  await db().user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  console.log("Admin created. Sign in at /admin/login.");
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.DATABASE_URL) await db().$disconnect();
  });
