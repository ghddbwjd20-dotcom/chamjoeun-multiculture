"use client";
import { useActionState } from "react";
export type FormState = { error?: string; success?: string; preview?: string };
export function ActionForm({
  action,
  children,
  label = "확인",
  className = "",
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className={`form ${className}`}>
      {children}
      {state.error && (
        <p className="alert error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="alert" role="status">
          {state.success}
        </p>
      )}
      {state.preview && (
        <p className="alert">
          <a href={state.preview}>개발 환경 이메일 확인하기 →</a>
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "처리 중…" : label}
      </button>
    </form>
  );
}
