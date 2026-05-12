"use client";

import { useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";

/**
 * Generic share button. Prefers navigator.share() (native sheet on
 * mobile) and falls back to navigator.clipboard.writeText() with a
 * confirmation toast. Used by Wordle and the daily sudoku end-game
 * modal so the experience is consistent.
 *
 * Pass `text` as the share payload. `title` is only used by the
 * native sheet (mobile share UI). If neither share nor clipboard is
 * available the button shows an error toast.
 */
export function ShareButton({
  text,
  title = "Melio Games",
  label = "Share",
  className,
}: {
  text: string;
  title?: string;
  label?: string;
  className?: string;
}) {
  const { push } = useToast();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share({ title, text });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(text);
        push({
          title: "Copied to clipboard",
          description: "Paste it anywhere to share.",
          variant: "success",
          duration: 2500,
        });
      } else {
        push({
          title: "Couldn't copy",
          description: "Your browser blocked clipboard access.",
          variant: "danger",
        });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink text-sm font-medium transition-colors duration-75"
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {pending ? "Sharing…" : label}
    </button>
  );
}
