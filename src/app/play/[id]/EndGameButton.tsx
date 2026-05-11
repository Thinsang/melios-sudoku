"use client";

import { useState } from "react";
import { abandonGame } from "@/lib/games/actions";

/**
 * Two-click "End game" button. First click switches to "Click again to confirm"
 * for ~3 seconds; second click within that window calls the server action,
 * which marks the game abandoned and redirects home.
 */
export function EndGameButton({
  gameId,
  label = "End game",
  variant = "ghost",
}: {
  gameId: string;
  label?: string;
  variant?: "ghost" | "danger";
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  function onClick() {
    if (pending) return;
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setPending(true);
    // Server action handles the redirect on success.
    void abandonGame(gameId).catch(() => setPending(false));
  }

  const base =
    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-75";
  const cls = confirming
    ? `${base} bg-danger-soft text-danger border border-danger/40`
    : variant === "danger"
      ? `${base} text-danger hover:bg-danger-soft border border-edge`
      : `${base} text-ink-soft hover:text-ink hover:bg-paper-raised border border-edge bg-paper`;

  return (
    <button type="button" onClick={onClick} disabled={pending} className={cls}>
      {pending ? "Ending…" : confirming ? "Click again to confirm" : label}
    </button>
  );
}
