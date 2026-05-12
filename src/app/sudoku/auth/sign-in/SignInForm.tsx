"use client";

import { useActionState } from "react";
import { signIn, type AuthResult } from "@/lib/auth/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    signIn,
    null
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-4 p-6 rounded-2xl border border-edge bg-paper shadow-[var(--shadow-soft)]"
    >
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="font-display text-2xl text-ink">Sign in</h1>
        <p className="text-sm text-ink-soft mt-1">Welcome back.</p>
      </div>
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium transition-colors duration-75"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        {...props}
        className="px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
      />
    </label>
  );
}
