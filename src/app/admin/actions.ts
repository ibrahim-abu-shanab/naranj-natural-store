"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  assertSameOrigin,
  createSession,
  destroySession,
  rateLimit,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
export async function login(_prev: { error: string }, form: FormData) {
  try {
    await assertSameOrigin();
    const values = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(128),
      })
      .safeParse(Object.fromEntries(form));
    if (!values.success)
      return { error: "Bilgileri kontrol edin. / تحقق من البيانات." };
    const email = values.data.email.toLowerCase();
    if (
      !(await rateLimit(`login:${email}`)) ||
      !(await rateLimit("login:global", 100))
    )
      return {
        error:
          "Çok fazla deneme. 15 dakika sonra tekrar deneyin. / محاولات كثيرة، حاول بعد 15 دقيقة.",
      };
    const user = await db().user.findUnique({ where: { email } });
    const dummy = "scrypt:00000000000000000000000000000000:" + "00".repeat(64);
    const valid = await verifyPassword(
      values.data.password,
      user?.passwordHash || dummy,
    );
    if (!user?.active || !valid)
      return {
        error: "E-posta veya parola hatalı. / البريد أو كلمة المرور غير صحيحة.",
      };
    await createSession(user.id);
  } catch {
    return {
      error:
        "Giriş şu anda kullanılamıyor. Veritabanı bağlantısını kontrol edin. / الدخول غير متاح، تحقق من اتصال قاعدة البيانات.",
    };
  }
  redirect("/admin");
}
export async function logout() {
  await assertSameOrigin();
  await destroySession();
  redirect("/admin/login");
}
