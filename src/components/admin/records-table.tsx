"use client";
import Image from "@/components/catalog-image";
import Link from "next/link";
import { useState } from "react";
import { Search, Pencil, PackageOpen } from "lucide-react";
import { DeleteButton } from "./delete-button";
import { normalizeSearch } from "@/lib/search";
type Row = {
  id: string;
  nameAr?: string;
  nameTr?: string;
  titleAr?: string;
  titleTr?: string;
  slug?: string;
  sku?: string;
  categoryId?: string;
  parentId?: string;
  price?: number;
  stock?: number;
  active?: boolean;
  archived?: boolean;
  images?: { url: string }[];
  image?: string;
  desktopImage?: string;
};
export function RecordsTable({
  resource,
  records,
  categories,
}: {
  resource: string;
  records: Row[];
  categories: { id: string; label: string }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const rows = records.filter(
    (r) =>
      normalizeSearch(
        [
          r.nameAr,
          r.nameTr,
          r.titleAr,
          r.titleTr,
          r.slug,
          r.sku,
          categories.find((c) => c.id === r.categoryId)?.label,
        ].join(" "),
      ).includes(normalizeSearch(query)) &&
      (status === "all" ||
        (status === "archived"
          ? r.archived
          : status === "active"
            ? r.active !== false && !r.archived
            : r.active === false && !r.archived)),
  );
  const products = resource === "products";
  const withImage = ["products", "categories", "articles", "slides"].includes(
    resource,
  );
  return (
    <section className="admin-panel admin-list-panel">
      <div className="admin-list-tools">
        <label className="admin-search">
          <Search size={18} />
          <input
            aria-label="البحث في السجلات"
            placeholder="ابحث بالاسم أو الرابط أو رمز المنتج…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {resource !== "pages" && (
          <select
            aria-label="تصفية حسب الحالة"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="draft">غير نشط</option>
            {products && <option value="archived">مؤرشف</option>}
          </select>
        )}
        <span className="admin-record-count">
          {rows.length.toLocaleString("ar")} سجل
        </span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {withImage && <th>الصورة</th>}
              <th>{products ? "المنتج" : "الاسم"}</th>
              {products ? (
                <>
                  <th>التصنيف</th>
                  <th>السعر</th>
                  <th>المخزون</th>
                </>
              ) : (
                <th>
                  {resource === "categories"
                    ? "التصنيف الرئيسي"
                    : "الرابط المختصر"}
                </th>
              )}
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const image = r.images?.[0]?.url || r.image || r.desktopImage;
              return (
                <tr key={r.id}>
                  {withImage && (
                    <td>
                      {image ? (
                        <Image
                          className="admin-thumbnail"
                          src={image}
                          alt={r.nameAr || r.titleAr || "صورة السجل"}
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="admin-image-placeholder">
                          <PackageOpen size={22} />
                        </span>
                      )}
                    </td>
                  )}
                  <td>
                    <Link
                      className="admin-record-name"
                      href={`/admin/${resource}/${r.id}`}
                    >
                      {r.nameAr || r.titleAr || "بلا عنوان"}
                    </Link>
                    <small className="admin-record-slug" dir="ltr">
                      {r.sku || r.slug}
                    </small>
                  </td>
                  {products ? (
                    <>
                      <td>
                        {categories.find((c) => c.id === r.categoryId)?.label ||
                          "—"}
                      </td>
                      <td>
                        {new Intl.NumberFormat("ar-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format((r.price || 0) / 100)}
                      </td>
                      <td>
                        <span
                          className={
                            (r.stock || 0) <= 5 ? "admin-stock-low" : ""
                          }
                        >
                          {(r.stock || 0).toLocaleString("ar")}
                        </span>
                      </td>
                    </>
                  ) : (
                    <td>
                      {resource === "categories" ? (
                        categories.find((c) => c.id === r.parentId)?.label ||
                        "تصنيف رئيسي"
                      ) : (
                        <bdi>{r.slug || "—"}</bdi>
                      )}
                    </td>
                  )}
                  <td>
                    <span
                      className={`admin-badge ${r.archived ? "archived" : r.active === false ? "draft" : "active"}`}
                    >
                      {r.archived
                        ? "مؤرشف"
                        : r.active === false
                          ? "غير نشط"
                          : "نشط"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link
                        href={`/admin/${resource}/${r.id}`}
                        aria-label={`تعديل ${r.nameAr || r.titleAr || "السجل"}`}
                      >
                        <Pencil size={15} />
                        تعديل
                      </Link>
                      {resource !== "pages" && (
                        <DeleteButton resource={resource} id={r.id} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="admin-empty">
          <PackageOpen size={34} />
          <h2>
            {records.length ? "لا توجد نتائج مطابقة" : "لا توجد سجلات بعد"}
          </h2>
          <p>
            {records.length
              ? "جرّب كلمة بحث أخرى أو غيّر تصفية الحالة."
              : "أضف أول سجل لبدء تنظيم محتوى متجرك."}
          </p>
          {records.length > 0 ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              مسح التصفية
            </button>
          ) : (
            resource !== "pages" && (
              <Link className="button" href={`/admin/${resource}/new`}>
                إضافة سجل
              </Link>
            )
          )}
        </div>
      )}
    </section>
  );
}
