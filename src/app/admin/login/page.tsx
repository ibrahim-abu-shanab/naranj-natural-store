import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
export default function Login() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <Link href="/ar" className="logo">
          NARANJ
        </Link>
        <h1>تسجيل الدخول إلى لوحة الإدارة</h1>
        <LoginForm />
        <p>للمسؤولين المصرّح لهم فقط.</p>
      </div>
    </div>
  );
}
