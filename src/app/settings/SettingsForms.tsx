"use client";

import { useActionState } from "react";
import {
  sendPasswordReset,
  updateProfile,
  type AuthResult,
} from "@/lib/auth/actions";

export function SettingsForms({
  email,
  initialDisplayName,
}: {
  email: string;
  initialDisplayName: string;
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    AuthResult | null,
    FormData
  >(updateProfile, null);
  const [resetState, resetAction, resetPending] = useActionState<
    AuthResult | null,
    FormData
  >(sendPasswordReset, null);

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-ink">Display name</h2>
        <form
          action={profileAction}
          className="flex flex-col gap-3 rounded-xl border border-edge bg-paper p-4"
        >
          <input
            name="display_name"
            defaultValue={initialDisplayName}
            maxLength={40}
            required
            className="px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
          />
          {profileState?.error && (
            <p className="text-sm text-danger">{profileState.error}</p>
          )}
          {profileState?.ok && (
            <p className="text-sm text-success">Saved.</p>
          )}
          <button
            type="submit"
            disabled={profilePending}
            className="self-start px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium text-sm transition-colors duration-75"
          >
            {profilePending ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-ink">Password</h2>
        <form
          action={resetAction}
          className="flex flex-col gap-3 rounded-xl border border-edge bg-paper p-4"
        >
          <input type="hidden" name="email" value={email} />
          <p className="text-sm text-ink-soft">
            We&rsquo;ll email a password reset link to{" "}
            <strong className="text-ink">{email}</strong>.
          </p>
          {resetState?.error && (
            <p className="text-sm text-danger">{resetState.error}</p>
          )}
          {resetState?.ok && (
            <p className="text-sm text-success">Reset email sent.</p>
          )}
          <button
            type="submit"
            disabled={resetPending || !email}
            className="self-start px-4 py-2 rounded-lg border border-edge bg-paper hover:bg-paper-raised text-ink font-medium text-sm transition-colors duration-75"
          >
            {resetPending ? "Sending…" : "Send reset email"}
          </button>
        </form>
      </section>
    </>
  );
}
