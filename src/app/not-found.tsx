import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>404 · NARANJ</h1>
      <p>Sayfa bulunamadı · الصفحة غير موجودة</p>
      <Link className="button" href="/tr">
        Ana Sayfa
      </Link>{" "}
      <Link className="button" href="/ar">
        الرئيسية
      </Link>
    </div>
  );
}
