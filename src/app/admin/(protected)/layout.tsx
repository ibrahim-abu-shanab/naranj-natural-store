import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/navigation";
import { logout } from "../actions";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="logo">
          NARANJ
        </Link>
        <p className="admin-brand-caption">إدارة المتجر والمحتوى</p>
        <AdminNavigation />
        <form action={logout}>
          <button type="submit">
            <LogOut size={17} />
            تسجيل الخروج
          </button>
        </form>
      </aside>
      <main className="admin-main">
        <div className="admin-top admin-account">
          <p>
            <ShieldCheck size={18} />
            لوحة إدارة نارنج
          </p>
          <p dir="ltr">{admin.email}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
