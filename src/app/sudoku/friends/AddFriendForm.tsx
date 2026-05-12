"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  sendFriendRequest,
  type ActionResult,
} from "@/lib/friends/actions";

export function AddFriendForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    sendFriendRequest,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="username"
          required
          maxLength={20}
          placeholder="username"
          className="flex-1 px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium transition-colors duration-75"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-success">Request sent.</p>
      )}
    </form>
  );
}
