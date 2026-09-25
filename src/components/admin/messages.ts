import type { FormEvent } from "react";
import { fields } from "@/lib/admin-fields";

// Translate presentation only; server validation and mutation rules stay unchanged.
export function adminError(value: unknown): string {
  const text = typeof value === "string" ? value : "";
  const exact: Record<string, string> = {
    Unauthorized: "انتهت الجلسة أو لا تملك صلاحية الوصول. سجّل الدخول مجددًا.",
    "Not allowed": "هذا الإجراء غير مسموح.",
    "Not found": "السجل غير موجود.",
    "Payload too large": "حجم البيانات أكبر من الحد المسموح.",
    "Upload limit reached.": "وصلت إلى الحد المسموح لرفع الصور. حاول لاحقًا.",
    "Maximum image size: 8 MB.": "الحد الأقصى لحجم الصورة هو ٨ ميغابايت.",
    "Kategori bulunamadı.": "التصنيف غير موجود. اختر تصنيفًا صالحًا.",
    "Kategori kendisine bağlanamaz.": "لا يمكن ربط التصنيف بنفسه.",
    "Alt kategorileri olan bir kategori taşınamaz.":
      "لا يمكن نقل تصنيف يحتوي على تصنيفات فرعية.",
  };
  if (exact[text]) return exact[text];
  if (text.includes(" / ")) {
    const ar = text.split(" / ").find((part) => /[\u0600-\u06ff]/.test(part));
    if (ar) return ar.replace("SKU", "رمز المنتج");
  }
  if (/^[\u0600-\u06ff]/.test(text)) return text;
  const allFields = Object.values(fields).flat();
  if (text.includes(": "))
    return text
      .split("\n")
      .map((line) => {
        const [path, ...rest] = line.split(": ");
        const detail = rest.join(": ");
        const key = path.split(".")[0];
        const label =
          allFields.find((f) => f.key === key)?.label ||
          (key === "images" ? "صور المنتج" : "البيانات");
        let reason = "تحقق من القيمة المدخلة.";
        if (/^[\u0600-\u06ff]/.test(detail)) reason = detail;
        else if (detail.includes("Old price"))
          reason = "يجب أن يكون السعر السابق أكبر من السعر الحالي.";
        else if (detail.includes("lowercase"))
          reason = "استخدم أحرفًا لاتينية صغيرة وأرقامًا وشرطات دون مسافات.";
        else if (detail.includes("internal path"))
          reason = "أدخل مسارًا داخليًا صالحًا يبدأ بشرطة مائلة.";
        else if (detail.includes("uploaded image"))
          reason = "اختر صورة مرفوعة أو صورة من مكتبة الموقع.";
        else if (detail.includes("Too small"))
          reason =
            key === "images"
              ? "أضف صورة واحدة على الأقل."
              : "أدخل قيمة لا تقل عن الحد الأدنى المطلوب.";
        else if (detail.includes("Too big"))
          reason = "تجاوزت القيمة الحد الأقصى المسموح.";
        else if (detail.includes("email"))
          reason = "أدخل بريدًا إلكترونيًا صالحًا.";
        return `${label}: ${reason}`;
      })
      .join("\n");
  return "تعذر إكمال العملية. تحقق من البيانات والاتصال ثم حاول مجددًا.";
}
export function arabicValidation(event: FormEvent<HTMLFormElement>) {
  const input = event.target;
  if (!(
    input instanceof HTMLInputElement ||
    input instanceof HTMLSelectElement ||
    input instanceof HTMLTextAreaElement
  ))
    return;
  const v = input.validity;
  input.setCustomValidity(
    v.valueMissing
      ? "يرجى تعبئة هذا الحقل."
      : v.typeMismatch
        ? "يرجى إدخال قيمة صحيحة لهذا الحقل."
        : v.rangeUnderflow
          ? `يجب ألا تقل القيمة عن ${(input as HTMLInputElement).min}.`
          : v.rangeOverflow
            ? `يجب ألا تزيد القيمة عن ${(input as HTMLInputElement).max}.`
            : v.stepMismatch
              ? "يرجى إدخال رقم بالتدرج المسموح."
              : "يرجى التحقق من القيمة المدخلة.",
  );
}
export function clearValidation(event: FormEvent<HTMLFormElement>) {
  const input = event.target;
  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLSelectElement ||
    input instanceof HTMLTextAreaElement
  )
    input.setCustomValidity("");
}
