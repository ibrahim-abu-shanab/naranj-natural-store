import { z } from "zod";
import { localized, type Locale } from "./i18n";
export const cartSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .max(100)
  .refine(
    (items) => new Set(items.map((i) => i.id)).size === items.length,
    "Duplicate product.",
  );
export type CartItem = z.infer<typeof cartSchema>[number];
export function orderMessage(
  lines: { nameTr: string; nameAr: string; price: number; quantity: number }[],
  locale: Locale,
) {
  const greeting =
    locale === "ar"
      ? "مرحباً، أود تأكيد الطلب التالي:"
      : "Merhaba, aşağıdaki siparişi vermek istiyorum:";
  const quantity = locale === "ar" ? "الكمية" : "Adet";
  const unitPrice = locale === "ar" ? "سعر الوحدة" : "Birim fiyat";
  const subtotal = locale === "ar" ? "المجموع" : "Toplam";
  const totalLabel = locale === "ar" ? "إجمالي الطلب" : "Sipariş toplamı";
  const closing =
    locale === "ar"
      ? "أرجو تأكيد توفر المنتجات وتفاصيل الشحن."
      : "Ürünlerin stok durumunu ve kargo detaylarını teyit eder misiniz?";
  const price = (value: number) =>
    `${new Intl.NumberFormat(locale === "ar" ? "ar-TR" : "tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)} TL`;
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return `${greeting}\n\n${lines
    .map(
      (line, index) =>
        `${index + 1}. ${localized(line, "name", locale)}\n   ${quantity}: ${line.quantity}\n   ${unitPrice}: ${price(line.price)}\n   ${subtotal}: ${price(line.price * line.quantity)}`,
    )
    .join("\n\n")}\n\n${totalLabel}: ${price(total)}\n\n${closing}`;
}
export function whatsappUrl(phone: string, message: string) {
  if (!/^[1-9][0-9]{7,14}$/.test(phone))
    throw new Error("Invalid WhatsApp number");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
