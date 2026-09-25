import Link from "next/link";
import {
  Package,
  CircleCheck,
  FolderTree,
  PackageX,
  Images,
  BookOpen,
  Plus,
  ArrowUpLeft,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export default async function Dashboard() {
  await requireAdmin();
  const [products, active, categories, lowStock, slides, articles, settings] =
    await Promise.all([
      db().product.count(),
      db().product.count({ where: { active: true, archived: false } }),
      db().category.count(),
      db().product.count({
        where: { active: true, archived: false, stock: { lte: 5 } },
      }),
      db().heroSlide.count({ where: { active: true } }),
      db().article.count(),
      db().siteSettings.findUnique({ where: { id: "main" } }),
    ]);
  const stats = [
    {
      label: "إجمالي المنتجات",
      value: products,
      icon: Package,
      path: "products",
    },
    {
      label: "المنتجات النشطة",
      value: active,
      icon: CircleCheck,
      path: "products",
    },
    {
      label: "التصنيفات",
      value: categories,
      icon: FolderTree,
      path: "categories",
    },
    {
      label: "المنتجات منخفضة المخزون",
      value: lowStock,
      icon: PackageX,
      path: "products",
      note: "٥ قطع أو أقل من المنتجات النشطة",
    },
    { label: "الشرائح النشطة", value: slides, icon: Images, path: "slides" },
    { label: "المقالات", value: articles, icon: BookOpen, path: "articles" },
  ];
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>نظرة عامة</h1>
          <p>تابع منتجاتك ومحتوى متجرك من مكان واحد.</p>
        </div>
        <Link className="button" href="/admin/products/new">
          <Plus size={18} />
          إضافة منتج
        </Link>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, path, note }) => (
          <Link className="stat-card" key={label} href={`/admin/${path}`}>
            <div className="stat-heading">
              <span>{label}</span>
              <Icon size={21} />
            </div>
            <strong>{value.toLocaleString("ar")}</strong>
            <small>{note || "عرض السجلات وإدارتها"}</small>
          </Link>
        ))}
      </div>
      {process.env.DEMO_MODE === "true" && (
        <div className="alert">
          وضع المعاينة مفعل؛ عطّله لعرض تغييرات الإدارة في المتجر.
        </div>
      )}
      {!settings?.whatsapp && (
        <div className="alert">
          رقم واتساب غير محدد.{" "}
          <Link href="/admin/settings">
            أكمل إعدادات الموقع لتفعيل الطلبات.
          </Link>
        </div>
      )}
      <section className="admin-panel">
        <h2>إجراءات سريعة</h2>
        <div className="admin-quick-actions">
          {[
            ["products", "إضافة منتج", "أضف تفاصيل المنتج وصوره وأسعاره"],
            ["categories", "إضافة تصنيف", "نظّم المنتجات في تصنيفات واضحة"],
            ["slides", "إضافة شريحة", "حدّث محتوى الصفحة الرئيسية"],
          ].map(([key, title, text]) => (
            <Link key={key} href={`/admin/${key}/new`}>
              <Plus size={21} />
              <span>
                <b>{title}</b>
                <small>{text}</small>
              </span>
              <ArrowUpLeft size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
