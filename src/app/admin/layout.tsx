import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-arabic";
import "./admin.css";
export const metadata: Metadata = {
  title: "لوحة إدارة نارنج",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-body" lang="ar" dir="rtl">
      {children}
    </div>
  );
}
