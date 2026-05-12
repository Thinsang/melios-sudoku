"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import { createGame, type CreateGameResult } from "@/lib/games/actions";
import { DIFFICULTIES, DIFFICULTY_LABEL, Difficulty } from "@/lib/sudoku";

const MODES: Array<{
  id: "solo" | "coop" | "race";
  label: string;
  desc: string;
}> = [
  { id: "race", label: "Race", desc: "Same puzzle, separate boards. Fastest wins." },
  { id: "coop", label: "Co-op", desc: "One shared board. Solve it together." },
  { id: "solo", label: "Solo (saved)", desc: "Just you, but progress syncs to your account." },
];

const DIFFICULTY_TOKEN: Record<Difficulty, string> = {
  easy: "diff-easy",
  medium: "diff-medium",
  hard: "diff-hard",
  expert: "diff-expert",
  extreme: "diff-extreme",
};

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
}

export function NewGameForm({
  initialMode,
  friends,
  initialInvited,
}: {
  initialMode: "solo" | "coop" | "race";
  friends: Friend[];
  initialInvited: string[];
}) {
  const [mode, setMode] = useState<"solo" | "coop" | "race">(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [invited, setInvited] = useState<Set<string>>(new Set(initialInvited));
  const [state, action, pending] = useActionState<CreateGameResult | null, FormData>(
    createGame,
    null
  );

  const toggleInvited = (id: string) => {
    setInvited((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <form action={action} className="flex flex-col gap-6 rounded-2xl border border-edge bg-paper p-6 shadow-[var(--shadow-soft)]">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="difficulty" value={difficulty} />
      {Array.from(invited).map((id) => (
        <input key={id} type="hidden" name="invite_user_id" value={id} />
      ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink-soft mb-1">Mode</legend>
        <div className="grid gap-2">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMode(m.id)}
              className={clsx(
                "text-left p-3.5 rounded-xl border transition-colors duration-75",
                mode === m.id
                  ? "border-brand bg-brand-soft"
                  : "border-edge bg-paper hover:border-edge-strong"
              )}
            >
              <div className="font-display text-base text-ink">{m.label}</div>
              <div className="text-sm text-ink-soft mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink-soft mb-1">Difficulty</legend>
        <div className="grid grid-cols-4 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDifficulty(d)}
              className={clsx(
                "relative py-2.5 rounded-lg border text-sm font-medium transition-colors duration-75 overflow-hidden",
                difficulty === d
                  ? "border-brand bg-brand-soft text-ink"
                  : "border-edge bg-paper text-ink hover:border-edge-strong"
              )}
            >
              <span
                className="absolute left-0 top-0 h-full w-0.5"
                style={{ backgroundColor: `var(--${DIFFICULTY_TOKEN[d]})` }}
              />
              {DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </fieldset>

      {mode !== "solo" && friends.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink-soft mb-1">
            Invite friends <span className="text-ink-faint">(optional)</span>
          </legend>
          <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
            {friends.map((f) => {
              const checked = invited.has(f.id);
              return (
                <label
                  key={f.id}
                  className={clsx(
                    "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors duration-75",
                    checked
                      ? "border-brand bg-brand-soft"
                      : "border-edge bg-paper hover:border-edge-strong"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInvited(f.id)}
                    className="accent-[var(--brand)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-ink">
                      {f.display_name ?? f.username}
                    </span>
                    {f.display_name && (
                      <span className="text-xs text-ink-faint">@{f.username}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink font-medium transition-colors duration-75"
      >
        {pending ? "Generating puzzle…" : "Create game"}
      </button>
    </form>
  );
}
