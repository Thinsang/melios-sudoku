"use client";

import { useRouter } from "next/navigation";

/**
 * Back link for the settings page. Settings is a "modal-style" destination —
 * users land here from games, profile, friends, anywhere. Hard-coding the
 * back target was sending everyone to /sudoku regardless of where they came
 * from (so e.g. backing out of settings mid-game would yank them out of the
 * game). Now we ask the browser to go back one step in history, falling back
 * to /sudoku if there's no history to pop (e.g. direct deep-link in a new
 * tab).
 */
export function SettingsBackLink() {
  const router = useRouter();

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/sudoku");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
    >
      ← Back
    </button>
  );
}
