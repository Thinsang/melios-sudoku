"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetTutorial } from "@/components/sudoku/FirstTimeTutorial";

/**
 * Settings affordance to re-show the tutorial. Clears the localStorage
 * flag and bounces the user to /sudoku where the tutorial mounts.
 */
export function ReplayTutorialButton() {
  const router = useRouter();
  const [doing, setDoing] = useState(false);

  function onClick() {
    setDoing(true);
    resetTutorial();
    router.push("/sudoku");
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg text-ink">Tutorial</h2>
      <div className="rounded-xl border border-edge bg-paper p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-ink-soft">
          Replay the first-time walkthrough.
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={doing}
          className="px-3.5 py-1.5 rounded-md border border-edge bg-paper hover:bg-paper-raised text-ink text-sm font-medium transition-colors duration-75 disabled:opacity-50"
        >
          {doing ? "Opening…" : "Replay"}
        </button>
      </div>
    </section>
  );
}
