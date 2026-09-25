"use client";
import { adminError, arabicValidation, clearValidation } from "./messages";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form
      action={action}
      onInvalid={arabicValidation}
      onInput={clearValidation}
    >
      <label>
        البريد الإلكتروني
        <input
          type="email"
          dir="ltr"
          name="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label>
        كلمة المرور
        <input
          type="password"
          dir="ltr"
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      {state.error && (
        <p role="alert" className="form-message">
          {adminError(state.error)}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
