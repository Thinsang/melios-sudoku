"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinGame, type JoinGameResult } from "@/lib/games/actions";
import { DIFFICULTY_LABEL } from "@/lib/sudoku";

const MODE_LABEL: Record<string, string> = {
  solo: "Solo",
  coop: "Co-op",
  race: "Race",
};

export function JoinForm({
  gameId,
  mode,
  difficulty,
  inviteCode,
  authed,
  defaultGuestName,
  existingPlayers,
}: {
  gameId: string;
  mode: string;
  difficulty: string;
  inviteCode: string | null;
  authed: boolean;
  defaultGuestName: string;
  existingPlayers: Array<{ id: string; display_name: string }>;
}) {
  const [state, action, pending] = useActionState<JoinGameResult | null, FormData>(
    joinGame,
    null
  );

  return (
    <form
      action={action}
      className="w-full max-w-md flex flex-col gap-4 p-6 rounded-2xl border border-edge bg-paper shadow-[var(--shadow-soft)]"
    >
      <input type="hidden" name="game_id" value={gameId} />
      <div>
        <h1 className="font-display text-2xl text-ink">Join the game</h1>
        <p className="text-sm text-ink-soft mt-1">
          {MODE_LABEL[mode] ?? mode} ·{" "}
          {DIFFICULTY_LABEL[difficulty as keyof typeof DIFFICULTY_LABEL] ?? difficulty}
          {inviteCode && (
            <>
              {" "}·{" "}
              <span className="font-mono tracking-widest text-ink">{inviteCode}</span>
            </>
          )}
        </p>
      </div>

      {existingPlayers.length > 0 && (
        <div className="text-sm text-ink-soft border border-edge bg-paper-raised rounded-lg p-3">
          <span className="text-ink-faint">Already in: </span>
          <span className="text-ink">
            {existingPlayers.map((p) => p.display_name).join(", ")}
          </span>
        </div>
      )}

      {!authed && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-soft">Display name</span>
          <input
            name="guest_name"
            required
            maxLength={30}
            defaultValue={defaultGuestName}
            placeholder="What should we call you?"
            className="px-3 py-2 rounded-lg border border-edge bg-paper-sunken text-ink focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors duration-75"
          />
          <span className="text-xs text-ink-faint">
            Or{" "}
            <Link
              href={`/sudoku/auth/sign-in?next=/sudoku/play/${gameId}`}
              className="text-brand hover:underline"
            >
              sign in
            </Link>{" "}
            to save progress.
          </span>
        </label>
      )}

      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium transition-colors duration-75"
      >
        {pending ? "Joining…" : "Join game"}
      </button>
    </form>
  );
}
