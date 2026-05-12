"use client";

import { useState } from "react";
import { abandonGame } from "@/lib/games/actions";

/**
 * Small × button on the profile's recent-games list — abandons an in-progress
 * game. Two-click confirm so it can't be hit accidentally. After the server
 * action resolves, the action revalidates `/profile` so the row updates.
 */
export function ProfileEndGameButton({ gameId }: { gameId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setPending(true);
    // Stay on the profile page after abandoning instead of bouncing home.
    void abandonGame(gameId, "/sudoku/profile").catch(() => {
      setPending(false);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="px-3 py-1.5 rounded-md text-xs font-medium border border-danger/40 bg-danger-soft text-danger transition-colors duration-75"
      >
        {pending ? "Ending…" : "Click to confirm"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abandon game"
      title="Abandon game"
      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-faint hover:text-danger hover:bg-danger-soft transition-colors duration-75"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
