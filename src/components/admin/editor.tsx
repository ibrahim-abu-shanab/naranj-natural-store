"use client";
import Image from "@/components/catalog-image";
import Link from "next/link";
import { adminError, arabicValidation, clearValidation } from "./messages";
import { formSections } from "./form-sections";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fields } from "@/lib/admin-fields";
import type { Resource } from "@/lib/validation";
type Option = { id: string; label: string; parentId?: string | null };
type Options = { categories: Option[]; tags: Option[]; collections: Option[] };
type ProductImage = { url: string; altTr: string; altAr: string };
function Upload({
  onUpload,
  multiple = false,
  label,
}: {
  onUpload: (url: string) => void;
  multiple?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="upload-control">
      <label>
        {label || (multiple ? "رفع صور المنتج" : "رفع صورة")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          disabled={busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            setBusy(true);
            setError("");
            try {
              for (const file of files) {
                const body = new FormData();
                body.set("file", file);
                const response = await fetch("/api/admin/upload", {
                  method: "POST",
                  body,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                onUpload(data.url);
              }
            } catch (e) {
              setError(adminError(e instanceof Error ? e.message : ""));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <span role="status">جارٍ رفع الصورة…</span>}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
export function Editor({
  resource,
  id,
  initial,
  options,
}: {
  resource: Resource;
  id: string;
  initial: Record<string, unknown>;
  options: Options;
}) {
  const [images, setImages] = useState<ProductImage[]>(
    (initial.images as ProductImage[]) || [],
  );
  const [imageValues, setImageValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields[resource]
        .filter((f) => f.type === "image")
        .map((f) => [f.key, String(initial[f.key] || "")]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    for (const f of fields[resource]) {
      if (f.type === "checkbox") data[f.key] = form.has(f.key);
      else if (f.type === "money")
        data[f.key] = form.get(f.key)
          ? Math.round(Number(form.get(f.key)) * 100)
          : null;
      else if (f.type === "number") data[f.key] = Number(form.get(f.key) || 0);
      else if (f.type === "tags" || f.type === "collections")
        data[f.key] = form.getAll(f.key);
      else if (f.type === "parent") data[f.key] = form.get(f.key) || null;
      else data[f.key] = String(form.get(f.key) || "");
    }
    if (resource === "products")
      data.images = images.map(({ url, altTr, altAr }) => ({
        url,
        altTr,
        altAr,
      }));
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/${resource}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("تم حفظ التغييرات بنجاح.");
      router.push(`/admin/${resource}`);
      router.refresh();
    } catch (e) {
      setMessage(adminError(e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="editor-form"
      onSubmit={submit}
      onInvalid={arabicValidation}
      onInput={clearValidation}
    >
      {resource === "products" && (
        <fieldset className="wide admin-form-section admin-images-section">
          <legend>صور المنتج</legend>
          <p className="admin-field-hint">
            الصورة الأولى هي الصورة الرئيسية. يمكنك رفع حتى ١٢ صورة.
          </p>
          {images.map((img, i) => (
            <div className="image-editor product-image-simple" key={i}>
              <Image src={img.url} alt="" width={90} height={90} />
              <span>{i === 0 ? "الصورة الرئيسية" : `صورة ${i + 1}`}</span>
              <button
                type="button"
                className="link-button"
                onClick={() => setImages((v) => v.filter((_, n) => i !== n))}
              >
                إزالة
              </button>
              <button
                type="button"
                disabled={i === 0}
                className="link-button"
                onClick={() =>
                  setImages((v) => {
                    const next = [...v];
                    const [selected] = next.splice(i, 1);
                    next.unshift(selected);
                    return next;
                  })
                }
              >
                جعلها الرئيسية
              </button>
            </div>
          ))}
          {images.length < 12 && (
            <Upload
              multiple
              onUpload={(url) =>
                setImages((v) =>
                  v.length < 12 ? [...v, { url, altTr: "", altAr: "" }] : v,
                )
              }
            />
          )}
        </fieldset>
      )}
      {formSections(resource).map((section) => (
        <details
          className={
            section.advanced ? "admin-advanced" : "admin-standard-section"
          }
          key={section.title}
          open={!section.advanced}
        >
          <summary>
            {section.advanced ? "خيارات متقدمة" : section.title}
          </summary>
          <section className="admin-form-section">
            <h2>{section.title}</h2>
            <div className="admin-field-grid">
              {section.fields.map((f) => {
                const value = initial[f.key];
                if (f.type === "checkbox")
                  return (
                    <label className="check-field" key={f.key}>
                      <input
                        type="checkbox"
                        name={f.key}
                        defaultChecked={Boolean(value)}
                      />
                      {f.label}
                    </label>
                  );
                if (f.type === "tags" || f.type === "collections") {
                  const selected = ((f.type === "tags"
                    ? initial.tags
                    : initial.collections) || []) as { id: string }[];
                  return (
                    <fieldset key={f.key}>
                      <legend>{f.label}</legend>
                      {options[f.type].length === 0 && (
                        <p className="admin-field-hint">
                          لا توجد خيارات بعد. يمكنك إضافتها من القائمة الجانبية.
                        </p>
                      )}
                      {options[f.type].map((o) => (
                        <label key={o.id}>
                          <input
                            type="checkbox"
                            name={f.key}
                            value={o.id}
                            defaultChecked={selected.some((v) => v.id === o.id)}
                          />
                          {o.label}
                        </label>
                      ))}
                    </fieldset>
                  );
                }
                if (f.type === "image")
                  return (
                    <div className="admin-single-image" key={f.key}>
                      <h3>{f.label}</h3>
                      <input
                        type="hidden"
                        name={f.key}
                        value={imageValues[f.key] || ""}
                        required={f.required}
                      />
                      <div
                        className={`admin-image-preview ${resource === "categories" ? "category-image-preview" : ""}`}
                      >
                        {imageValues[f.key] ? (
                          <Image
                            src={imageValues[f.key]}
                            alt="معاينة الصورة"
                            width={320}
                            height={180}
                          />
                        ) : (
                          <span>معاينة الصورة</span>
                        )}
                      </div>
                      <Upload
                        label={
                          imageValues[f.key]
                            ? "رفع / تغيير الصورة"
                            : "رفع الصورة"
                        }
                        onUpload={(url) =>
                          setImageValues((v) => ({ ...v, [f.key]: url }))
                        }
                      />
                      {imageValues[f.key] && (
                        <button
                          type="button"
                          className="admin-remove-image"
                          onClick={() =>
                            setImageValues((v) => ({ ...v, [f.key]: "" }))
                          }
                        >
                          حذف الصورة
                        </button>
                      )}
                      <p className="admin-field-hint">
                        {resource === "slides"
                          ? "المقاس الموصى به: 1600 × 900 بكسل (نسبة 16:9)."
                          : resource === "categories"
                            ? "المقاس الموصى به: 800 × 800 بكسل (مربع)."
                            : "استخدم صورة واضحة وعالية الجودة."}
                      </p>
                    </div>
                  );
                return (
                  <label
                    key={f.key}
                    className={
                      f.type === "textarea" &&
                      !/^(ingredients|usage|warnings|seoDescription)/.test(
                        f.key,
                      )
                        ? "wide"
                        : ""
                    }
                  >
                    {f.label}
                    {f.type === "textarea" ? (
                      <textarea
                        name={f.key}
                        defaultValue={String(value || "")}
                        required={f.required}
                        dir={
                          f.key.endsWith("Tr") ||
                          [
                            "slug",
                            "sku",
                            "url",
                            "email",
                            "whatsapp",
                            "phone",
                            "instagram",
                            "facebook",
                          ].includes(f.key)
                            ? "ltr"
                            : "rtl"
                        }
                      />
                    ) : f.type === "category" || f.type === "parent" ? (
                      <select
                        name={f.key}
                        required={f.required}
                        defaultValue={String(value || "")}
                      >
                        <option value="">
                          {f.type === "parent"
                            ? "بدون تصنيف رئيسي"
                            : "اختر التصنيف"}
                        </option>
                        {options.categories
                          .filter(
                            (o) =>
                              f.type !== "parent" ||
                              (!o.parentId && o.id !== id),
                          )
                          .map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.parentId ? "— " : ""}
                              {o.label}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        name={f.key}
                        type={
                          f.type === "money" || f.type === "number"
                            ? "number"
                            : "text"
                        }
                        step={
                          f.type === "money"
                            ? "0.01"
                            : f.type === "number"
                              ? "1"
                              : undefined
                        }
                        min={
                          f.type === "money"
                            ? "0.01"
                            : f.type === "number"
                              ? "0"
                              : undefined
                        }
                        defaultValue={
                          f.type === "money"
                            ? typeof value === "number"
                              ? value / 100
                              : ""
                            : String(value ?? (f.type === "number" ? 0 : ""))
                        }
                        required={f.required}
                        readOnly={
                          resource === "pages" &&
                          f.key === "slug" &&
                          id !== "new"
                        }
                        dir={
                          f.key.endsWith("Tr") ||
                          [
                            "slug",
                            "sku",
                            "url",
                            "email",
                            "whatsapp",
                            "phone",
                            "instagram",
                            "facebook",
                          ].includes(f.key)
                            ? "ltr"
                            : "rtl"
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>
            {section.advanced &&
              resource === "products" &&
              images.length > 0 && (
                <fieldset className="advanced-image-alt">
                  <legend>النص البديل للصور</legend>
                  <p className="admin-field-hint">
                    يُنشأ تلقائيًا من اسم المنتج، ويمكن تخصيصه هنا.
                  </p>
                  {images.map((img, i) => (
                    <div className="admin-field-grid" key={`${img.url}-${i}`}>
                      <label>
                        الصورة {i + 1} — العربية
                        <input
                          dir="rtl"
                          value={img.altAr}
                          onChange={(e) =>
                            setImages((v) =>
                              v.map((im, n) =>
                                n === i ? { ...im, altAr: e.target.value } : im,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        الصورة {i + 1} — التركية
                        <input
                          dir="ltr"
                          value={img.altTr}
                          onChange={(e) =>
                            setImages((v) =>
                              v.map((im, n) =>
                                n === i ? { ...im, altTr: e.target.value } : im,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                </fieldset>
              )}
          </section>
        </details>
      ))}
      {message && (
        <div className="wide form-message" role="status">
          {message}
        </div>
      )}
      <div className="wide admin-form-actions">
        <button disabled={busy} type="submit" className="button">
          {busy
            ? "جارٍ الحفظ…"
            : resource === "products"
              ? "حفظ المنتج"
              : "حفظ التغييرات"}
        </button>
        <Link className="admin-cancel" href={`/admin/${resource}`}>
          العودة إلى القائمة
        </Link>
      </div>
    </form>
  );
}
