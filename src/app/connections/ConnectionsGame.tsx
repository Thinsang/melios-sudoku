"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConnectionsPuzzle } from "@/lib/connections/puzzles";
import { useToast } from "@/components/toast/ToastProvider";
import { ShareButton } from "@/components/ShareButton";

const MAX_MISTAKES = 4;
const STORAGE_PREFIX = "melio_connections_";

interface Persisted {
  date: string;
  solvedDifficulties: number[];
  mistakes: number;
  /** Each guess as a list of difficulty markers — used to rebuild the
   *  share text and the mistake-grid history. */
  attempts: number[][];
}

type Status = "playing" | "won" | "lost";

const DIFFICULTY_TONE: Record<number, { bg: string; ink: string }> = {
  0: { bg: "#f5d97a", ink: "#3a2308" }, // yellow
  1: { bg: "#a0c878", ink: "#1b2a14" }, // green
  2: { bg: "#85c0f9", ink: "#0a1325" }, // blue
  3: { bg: "#c4a8ea", ink: "#26174a" }, // purple
};

const DIFFICULTY_EMOJI = ["🟨", "🟩", "🟦", "🟪"];

export function ConnectionsGame({
  puzzle,
  startOrder,
  date,
}: {
  puzzle: ConnectionsPuzzle;
  startOrder: string[];
  date: string;
}) {
  const { push } = useToast();
  // Lookup table: word → its group difficulty (0..3).
  const wordToDifficulty = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of puzzle.groups) {
      for (const w of g.words) m.set(w, g.difficulty);
    }
    return m;
  }, [puzzle]);

  const [order, setOrder] = useState<string[]>(startOrder);
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedDifficulties, setSolvedDifficulties] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [attempts, setAttempts] = useState<number[][]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Load persisted state for this date.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + date);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (p.date === date) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSolvedDifficulties(p.solvedDifficulties);
          setMistakes(p.mistakes);
          setAttempts(p.attempts);
          // Move solved groups to the top of the order.
          const solvedWords = new Set<string>();
          for (const d of p.solvedDifficulties) {
            for (const g of puzzle.groups) {
              if (g.difficulty === d) {
                for (const w of g.words) solvedWords.add(w);
              }
            }
          }
          const head = startOrder.filter((w) => solvedWords.has(w));
          const tail = startOrder.filter((w) => !solvedWords.has(w));
          setOrder([...head, ...tail]);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [date, puzzle, startOrder]);

  // Persist on every meaningful change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const persist: Persisted = {
        date,
        solvedDifficulties,
        mistakes,
        attempts,
      };
      window.localStorage.setItem(
        STORAGE_PREFIX + date,
        JSON.stringify(persist),
      );
    } catch {
      // ignore
    }
  }, [date, solvedDifficulties, mistakes, attempts, hydrated]);

  const status: Status =
    solvedDifficulties.length === 4
      ? "won"
      : mistakes >= MAX_MISTAKES
        ? "lost"
        : "playing";

  function toggle(word: string) {
    if (status !== "playing") return;
    const solvedWords = solvedWordSet();
    if (solvedWords.has(word)) return;
    setSelected((sel) => {
      if (sel.includes(word)) return sel.filter((w) => w !== word);
      if (sel.length >= 4) return sel;
      return [...sel, word];
    });
  }

  function solvedWordSet(): Set<string> {
    const s = new Set<string>();
    for (const d of solvedDifficulties) {
      for (const g of puzzle.groups) {
        if (g.difficulty === d) for (const w of g.words) s.add(w);
      }
    }
    return s;
  }

  const shuffle = useCallback(() => {
    if (status !== "playing") return;
    setOrder((cur) => {
      // Compute the solved set inline so the closure doesn't capture stale
      // state when the user spams the button.
      const solved = new Set<string>();
      for (const d of solvedDifficulties) {
        for (const g of puzzle.groups) {
          if (g.difficulty === d) for (const w of g.words) solved.add(w);
        }
      }
      const head = cur.filter((w) => solved.has(w));
      const tail = [...cur.filter((w) => !solved.has(w))];
      // Fisher-Yates with Math.random — the date-deterministic shuffle
      // already happened server-side, so this user-driven reshuffle can
      // be truly random.
      for (let i = tail.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tail[i], tail[j]] = [tail[j], tail[i]];
      }
      return [...head, ...tail];
    });
  }, [status, puzzle, solvedDifficulties]);

  function deselect() {
    setSelected([]);
  }

  function submit() {
    if (status !== "playing") return;
    if (selected.length !== 4) return;

    const diffs = selected.map((w) => wordToDifficulty.get(w) ?? -1);
    const allSame = diffs.every((d) => d === diffs[0]) && diffs[0] !== -1;

    // Record the attempt as a 4-difficulty fingerprint for the share grid.
    const fingerprint = diffs.slice().sort((a, b) => a - b);
    setAttempts((a) => [...a, fingerprint]);

    if (allSame) {
      const solvedDiff = diffs[0];
      setSolvedDifficulties((s) => [...s, solvedDiff]);
      // Move solved words to the top while preserving their relative order.
      const solvedWords = new Set(selected);
      const head = order.filter(
        (w) => solvedWordSet().has(w) || solvedWords.has(w),
      );
      const tail = order.filter(
        (w) => !solvedWordSet().has(w) && !solvedWords.has(w),
      );
      setOrder([...head, ...tail]);
      setSelected([]);
      // Win-check happens via the derived `status` on next render.
    } else {
      // Count how many fell into the most-common difficulty.
      const counts: Record<number, number> = {};
      for (const d of diffs) counts[d] = (counts[d] ?? 0) + 1;
      const max = Math.max(...Object.values(counts));
      const closeMiss = max === 3;
      setMistakes((m) => m + 1);
      setSelected([]);
      setShaking(true);
      window.setTimeout(() => setShaking(false), 350);
      push({
        title: closeMiss ? "One away…" : "Not quite",
        description: closeMiss
          ? "Three of those share a theme. One doesn't fit."
          : "Try a different combination.",
        variant: closeMiss ? "warning" : "danger",
        duration: 2200,
      });
    }
  }

  // Build display rows: solved groups first, then remaining words.
  const solved = solvedWordSet();
  const remaining = order.filter((w) => !solved.has(w));
  const solvedGroups = solvedDifficulties.map((d) =>
    puzzle.groups.find((g) => g.difficulty === d)!,
  );

  // Share text
  const shareText = useMemo(() => {
    const grid = attempts
      .map((row) => row.map((d) => DIFFICULTY_EMOJI[d]).join(""))
      .join("\n");
    const result =
      status === "won"
        ? `${attempts.length}/${attempts.length} ✓`
        : status === "lost"
          ? `X/${MAX_MISTAKES + 4}`
          : `${attempts.length} so far`;
    return `Melio Connections ${date} ${result}\n\n${grid}\n\nmeliogames.com/connections`;
  }, [attempts, date, status]);

  return (
    <div className="flex flex-col gap-4">
      {/* Solved group rows, stacked */}
      {solvedGroups.map((g) => (
        <SolvedGroupBanner key={g.difficulty} group={g} />
      ))}

      {/* Active grid */}
      {remaining.length > 0 && status !== "won" && (
        <div
          className={
            "grid grid-cols-4 gap-1.5 sm:gap-2 " +
            (shaking ? "animate-shake" : "")
          }
        >
          {remaining.map((word) => {
            const isSelected = selected.includes(word);
            return (
              <button
                key={word}
                type="button"
                onClick={() => toggle(word)}
                disabled={status !== "playing"}
                className={
                  "aspect-[1.6] sm:aspect-[1.7] flex items-center justify-center rounded-md px-1.5 sm:px-2 text-center font-display font-semibold text-[11px] sm:text-sm uppercase tabular-nums select-none transition-all duration-100 " +
                  (isSelected
                    ? "bg-ink text-canvas shadow-[var(--shadow-soft)] scale-[0.97]"
                    : "bg-paper-raised text-ink hover:bg-paper-raised/80 active:scale-[0.97]")
                }
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {/* Mistakes ribbon */}
      <div className="flex items-center justify-center gap-2 text-xs text-ink-soft">
        Mistakes remaining:
        <span className="inline-flex gap-1">
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <span
              key={i}
              className={
                "w-2 h-2 rounded-full " +
                (i < MAX_MISTAKES - mistakes ? "bg-ink" : "bg-edge-strong")
              }
              aria-hidden
            />
          ))}
        </span>
      </div>

      {/* Action row */}
      {status === "playing" && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={shuffle}
            className="px-4 py-1.5 rounded-full border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={deselect}
            disabled={selected.length === 0}
            className="px-4 py-1.5 rounded-full border border-edge bg-paper text-ink hover:bg-paper-raised disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-75"
          >
            Deselect all
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={selected.length !== 4}
            className="px-5 py-1.5 rounded-full bg-ink hover:bg-ink/90 disabled:opacity-30 disabled:cursor-not-allowed text-canvas text-sm font-medium transition-colors duration-75"
          >
            Submit
          </button>
        </div>
      )}

      {/* Game-over banner */}
      {(status === "won" || status === "lost") && (
        <div
          className={
            "rounded-xl border p-4 text-center " +
            (status === "won"
              ? "border-success/30 bg-success-soft"
              : "border-danger/30 bg-danger-soft")
          }
        >
          <div className="font-display text-xl text-ink">
            {status === "won" ? "Nicely done." : "So close."}
          </div>
          <div className="text-sm text-ink-soft mt-1">
            {status === "won"
              ? `Solved in ${attempts.length} ${
                  attempts.length === 1 ? "attempt" : "attempts"
                }.`
              : "Out of mistakes. The unsolved groups are revealed above."}
          </div>
          {/* Show all groups on loss so the user learns the answers. */}
          {status === "lost" &&
            puzzle.groups
              .filter((g) => !solvedDifficulties.includes(g.difficulty))
              .map((g) => (
                <div key={g.difficulty} className="mt-2">
                  <SolvedGroupBanner group={g} />
                </div>
              ))}
          <div className="text-xs text-ink-faint mt-2">
            Come back tomorrow for the next puzzle.
          </div>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <ShareButton
              title="Melio Connections"
              label="Share"
              text={shareText}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink text-sm font-medium transition-colors duration-75"
            />
            <Link
              href="/wordle"
              className="px-3.5 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
            >
              Daily Wordle
            </Link>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
            >
              Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SolvedGroupBanner({ group }: { group: ConnectionsPuzzle["groups"][0] }) {
  const tone = DIFFICULTY_TONE[group.difficulty];
  return (
    <div
      className="rounded-md px-3 py-2 text-center"
      style={{ backgroundColor: tone.bg, color: tone.ink }}
    >
      <div className="font-display text-sm uppercase tracking-[0.06em] font-semibold">
        {group.theme}
      </div>
      <div className="text-xs font-medium opacity-90 mt-0.5">
        {group.words.join(", ")}
      </div>
    </div>
  );
}
