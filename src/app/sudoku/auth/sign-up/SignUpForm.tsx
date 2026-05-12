"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthResult } from "@/lib/auth/actions";

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    signUp,
    null
  );

  // If sign-up succeeded but no session was created, the user needs to confirm
  // via email before they can sign in. Show a clear message instead of the form.
  if (state?.ok && state.message) {
    return (
      <div className="flex flex-col gap-4 p-6 rounded-2xl border border-success/30 bg-success-soft">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-success/15 text-success flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-lg text-ink">Check your email</h2>
            <p className="text-sm text-ink-soft mt-1">{state.message}</p>
            <p className="text-xs text-ink-faint mt-3">
              Didn&rsquo;t get it? Check spam, or wait a minute and{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-brand hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        </div>
        <Link
          href="/sudoku/auth/sign-in"
          className="self-start text-sm text-brand hover:underline"
        >
          → Already confirmed? Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 p-6 rounded-2xl border border-edge bg-paper shadow-[var(--shadow-soft)]"
    >
      <input type="hidden" name="next" value={next} />
      <div>
        <h1 className="font-display text-2xl text-ink">Create your account</h1>
        <p className="text-sm text-ink-soft mt-1">
          Saves your progress and lets you challenge friends.
        </p>
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        hint="We&rsquo;ll only use it for sign-in and password resets."
      />
      <Field
        label="Username"
        name="username"
        required
        minLength={3}
        maxLength={20}
        pattern="[a-zA-Z0-9_]+"
        autoComplete="username"
        hint="3-20 letters, numbers, or underscores. Your unique handle (@username)."
      />
      <Field
        label="Display name"
        name="display_name"
        maxLength={40}
        autoComplete="nickname"
        hint="Shown to other players. Defaults to your username if blank."
      />
      <Field
        label="Password"
        name="password"
        type="password"
        minLength={6}
        required
        autoComplete="new-password"
        hint="At least 6 characters."
      />
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium transition-colors duration-75"
      >
        {pending ? "Creating account…" : "Sign up"}
      </button>
      <p className="text-xs text-ink-faint">
        If your project has email confirmation enabled, you&rsquo;ll need to click a link in your inbox before signing in.
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        {...props}
        className="px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
      />
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
