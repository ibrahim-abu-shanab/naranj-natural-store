"use client";
export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="admin-panel" lang="ar" dir="rtl">
      <h1>تعذر تحميل لوحة الإدارة</h1>
      <p>حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.</p>
      <button className="button" onClick={retry}>
        إعادة المحاولة
      </button>
    </div>
  );
}
