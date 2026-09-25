import Link from "next/link";
export default function AdminNotFound() {
  return (
    <div className="admin-panel" lang="ar" dir="rtl">
      <h1>٤٠٤ · الصفحة غير موجودة</h1>
      <p>قد يكون السجل قد حُذف أو أن الرابط غير صحيح.</p>
      <Link className="button" href="/admin">
        العودة إلى لوحة الإدارة
      </Link>
    </div>
  );
}
