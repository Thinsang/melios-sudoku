"use client";

import { useActionState } from "react";
import { joinByInviteCode, type JoinGameResult } from "@/lib/games/actions";

export function JoinByCodeForm() {
  const [state, action, pending] = useActionState<JoinGameResult | null, FormData>(
    joinByInviteCode,
    null
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-xl border border-edge bg-paper p-4"
    >
      <label className="text-sm text-ink-soft">Got an invite code?</label>
      <div className="flex gap-2">
        <input
          name="invite_code"
          required
          maxLength={8}
          placeholder="ABC123"
          className="flex-1 px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink uppercase tracking-[0.25em] font-mono text-center placeholder:text-ink-faint placeholder:tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
          autoComplete="off"
          autoCapitalize="characters"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-ink text-canvas hover:bg-ink/90 disabled:opacity-50 font-medium text-sm transition-colors duration-75"
        >
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}
