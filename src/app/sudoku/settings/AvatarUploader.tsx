"use client";

import { useActionState, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import {
  removeAvatar,
  uploadAvatar,
  type AuthResult,
} from "@/lib/auth/actions";

export function AvatarUploader({
  initialUrl,
  name,
}: {
  initialUrl: string | null;
  name: string;
}) {
  const [state, action, pending] = useActionState<AuthResult | null, FormData>(
    uploadAvatar,
    null,
  );
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleRemove() {
    setRemoving(true);
    setRemoveMsg(null);
    try {
      const res = await removeAvatar();
      setRemoveMsg(res.error ?? "Removed.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg text-ink">Avatar</h2>
      <div className="rounded-xl border border-edge bg-paper p-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Avatar src={initialUrl} name={name} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink">
              {initialUrl ? "Update your avatar" : "Add an avatar"}
            </div>
            <div className="text-xs text-ink-soft">
              PNG, JPEG, WebP, or GIF. 2 MB max.
            </div>
          </div>
        </div>
        <form
          ref={formRef}
          action={action}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp,image/gif"
            required
            onChange={() => formRef.current?.requestSubmit()}
            className="text-sm text-ink-soft file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border file:border-edge file:bg-paper file:text-ink file:font-medium file:cursor-pointer hover:file:bg-paper-raised"
          />
          {pending && <span className="text-xs text-ink-soft">Uploading…</span>}
          {initialUrl && !pending && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="px-3 py-1.5 rounded-md border border-edge bg-paper hover:bg-paper-raised text-ink-soft hover:text-ink text-xs font-medium transition-colors duration-75 disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          )}
        </form>
        {state?.error && (
          <p className="text-sm text-danger">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-success">Saved.</p>
        )}
        {removeMsg && (
          <p
            className={
              "text-sm " +
              (removeMsg === "Removed." ? "text-success" : "text-danger")
            }
          >
            {removeMsg}
          </p>
        )}
      </div>
    </section>
  );
}
