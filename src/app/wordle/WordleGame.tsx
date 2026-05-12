"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MAX_GUESSES,
  WORD_LENGTH,
  hardModeViolation,
  isValidGuess,
  letterStates,
  scoreGuess,
  type LetterState,
  type ScoredLetter,
} from "@/lib/wordle";
import { useToast } from "@/components/toast/ToastProvider";
import { ShareButton } from "@/components/ShareButton";
import { recordWordleCompletion } from "@/lib/wordle/actions";

interface Persisted {
  date: string;
  guesses: string[];
  done: boolean;
  won: boolean;
}

const STORAGE_PREFIX = "melio_wordle_";
const STATS_KEY = "melio_wordle_stats_v1";
const HARD_MODE_KEY = "melio_wordle_hard_v1";
const COLORBLIND_KEY = "melio_wordle_cb_v1";

interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  /** Distribution: index 0 = solved in 1 guess … index 5 = in 6 guesses. */
  distribution: number[];
  lastPlayedDate: string | null;
  lastWonDate: string | null;
}

const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
  lastWonDate: null,
};

export function WordleGame({
  answer,
  date,
}: {
  answer: string;
  date: string;
}) {
  const { push } = useToast();
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [hydrated, setHydrated] = useState(false);
  const [shake, setShake] = useState(false);
  // Hard mode: revealed clues must be reused in every subsequent guess.
  // Locked once the user submits a guess — can't be toggled mid-game.
  const [hardMode, setHardMode] = useState(false);
  // High-contrast / colorblind palette (orange + blue instead of green +
  // yellow). Can be toggled at any time.
  const [colorblind, setColorblind] = useState(false);

  // Load persisted state on mount. localStorage isn't available during
  // SSR so we must read it post-mount — the "no setState in effect" rule
  // doesn't fit this case (there's no other way to gate on a client-only
  // value), and the cascade is one-shot.
  useEffect(() => {
    let loaded: Persisted | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + date);
      if (raw) loaded = JSON.parse(raw) as Persisted;
    } catch {
      // ignore parse errors
    }
    let loadedStats: Stats = EMPTY_STATS;
    try {
      const raw = window.localStorage.getItem(STATS_KEY);
      if (raw) loadedStats = { ...EMPTY_STATS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    if (loaded && loaded.date === date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuesses(loaded.guesses);
      setDone(loaded.done);
      setWon(loaded.won);
    }
    try {
      setHardMode(window.localStorage.getItem(HARD_MODE_KEY) === "1");
      setColorblind(window.localStorage.getItem(COLORBLIND_KEY) === "1");
    } catch {
      // ignore
    }
    setStats(loadedStats);
    setHydrated(true);
  }, [date]);

  // Persist game state when it changes.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_PREFIX + date,
        JSON.stringify({ date, guesses, done, won } satisfies Persisted),
      );
    } catch {
      // ignore
    }
  }, [date, guesses, done, won, hydrated]);

  const scoredHistory: ScoredLetter[][] = useMemo(
    () => guesses.map((g) => scoreGuess(answer, g)),
    [guesses, answer],
  );

  const kbStates = useMemo(() => letterStates(scoredHistory), [scoredHistory]);

  // Submit the current guess after validation.
  const submitGuess = useCallback(() => {
    if (done) return;
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      window.setTimeout(() => setShake(false), 300);
      push({
        title: "Not enough letters",
        variant: "warning",
        duration: 1500,
      });
      return;
    }
    if (!isValidGuess(current)) {
      setShake(true);
      window.setTimeout(() => setShake(false), 300);
      push({
        title: "Not in word list",
        description: `"${current.toUpperCase()}" isn't in our dictionary.`,
        variant: "warning",
        duration: 2200,
      });
      return;
    }
    if (hardMode) {
      const violation = hardModeViolation(scoredHistory, current);
      if (violation) {
        setShake(true);
        window.setTimeout(() => setShake(false), 300);
        push({
          title: "Hard mode",
          description: violation,
          variant: "warning",
          duration: 2500,
        });
        return;
      }
    }
    const nextGuesses = [...guesses, current];
    setGuesses(nextGuesses);
    setCurrent("");

    const isWin = current.toLowerCase() === answer.toLowerCase();
    const isLast = nextGuesses.length >= MAX_GUESSES;
    if (isWin || isLast) {
      setDone(true);
      setWon(isWin);
      // Fire-and-forget: persist to DB if signed in. Action is a no-op
      // for anonymous users.
      void recordWordleCompletion({
        date,
        guesses: nextGuesses.length,
        won: isWin,
      }).catch((err) => {
        console.warn("recordWordleCompletion failed:", err);
      });
      // Update stats — only count once per day.
      setStats((prev) => {
        if (prev.lastPlayedDate === date) return prev;
        const distribution = [...prev.distribution];
        if (isWin) distribution[nextGuesses.length - 1]++;
        const wonYesterday =
          prev.lastWonDate &&
          datesAreConsecutive(prev.lastWonDate, date);
        const currentStreak = isWin
          ? wonYesterday
            ? prev.currentStreak + 1
            : 1
          : 0;
        const next: Stats = {
          played: prev.played + 1,
          wins: prev.wins + (isWin ? 1 : 0),
          currentStreak,
          bestStreak: Math.max(prev.bestStreak, currentStreak),
          distribution,
          lastPlayedDate: date,
          lastWonDate: isWin ? date : prev.lastWonDate,
        };
        try {
          window.localStorage.setItem(STATS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, [done, current, guesses, answer, date, push, hardMode, scoredHistory]);

  // Physical keyboard input handler.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submitGuess();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setCurrent((c) => c.slice(0, -1));
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        setCurrent((c) =>
          c.length < WORD_LENGTH ? (c + e.key).toLowerCase() : c,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitGuess, done]);

  // Build the 6×5 grid: completed rows + current row + empty rows.
  const grid: Array<{
    cells: Array<{
      letter: string;
      state: LetterState | "empty" | "typing";
    }>;
    isCurrent: boolean;
  }> = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    if (r < guesses.length) {
      grid.push({
        cells: scoredHistory[r].map((c) => ({
          letter: c.letter.toUpperCase(),
          state: c.state,
        })),
        isCurrent: false,
      });
    } else if (r === guesses.length && !done) {
      const cells: Array<{ letter: string; state: "empty" | "typing" }> = [];
      for (let c = 0; c < WORD_LENGTH; c++) {
        if (c < current.length) {
          cells.push({ letter: current[c].toUpperCase(), state: "typing" });
        } else {
          cells.push({ letter: "", state: "empty" });
        }
      }
      grid.push({ cells, isCurrent: true });
    } else {
      grid.push({
        cells: Array.from({ length: WORD_LENGTH }, () => ({
          letter: "",
          state: "empty" as const,
        })),
        isCurrent: false,
      });
    }
  }

  const hardModeLocked = guesses.length > 0;

  function toggleHardMode() {
    if (hardModeLocked) {
      push({
        title: "Lock in early",
        description: "Hard mode can only be turned on before your first guess.",
        variant: "warning",
        duration: 2500,
      });
      return;
    }
    const next = !hardMode;
    setHardMode(next);
    try {
      window.localStorage.setItem(HARD_MODE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Played" value={stats.played} />
        <Stat
          label="Win %"
          value={
            stats.played === 0 ? "—" : Math.round((stats.wins / stats.played) * 100)
          }
        />
        <Stat label="Streak" value={stats.currentStreak} />
        <Stat label="Best" value={stats.bestStreak} />
      </div>

      {/* Mode toggles */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="text-ink-faint">
          {hardMode ? (
            <span className="text-warning font-medium">Hard mode on</span>
          ) : (
            "Standard mode"
          )}
          {hardMode && (
            <span className="text-ink-faint">
              {" "}· every clue must be used
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <ToggleChip
            label="High contrast"
            on={colorblind}
            onClick={() => {
              const next = !colorblind;
              setColorblind(next);
              try {
                window.localStorage.setItem(
                  COLORBLIND_KEY,
                  next ? "1" : "0",
                );
              } catch {
                // ignore
              }
            }}
          />
          <button
            type="button"
            onClick={toggleHardMode}
            aria-pressed={hardMode}
            className={
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors duration-75 " +
              (hardMode
                ? "border-warning bg-warning-soft text-warning"
                : "border-edge bg-paper text-ink-soft hover:text-ink hover:bg-paper-raised") +
              (hardModeLocked ? " opacity-60 cursor-not-allowed" : "")
            }
          >
            <span
              className={
                "w-7 h-3.5 rounded-full relative transition-colors duration-150 " +
                (hardMode ? "bg-warning" : "bg-edge-strong")
              }
            >
              <span
                className={
                  "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-paper transition-transform duration-150 " +
                  (hardMode ? "left-3.5" : "left-0.5")
                }
              />
            </span>
            Hard
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={
          "grid grid-rows-6 gap-1.5 mx-auto " + (shake ? "animate-shake" : "")
        }
      >
        {grid.map((row, ri) => (
          <div key={ri} className="grid grid-cols-5 gap-1.5">
            {row.cells.map((cell, ci) => (
              <Tile
                key={ci}
                letter={cell.letter}
                state={cell.state}
                animateDelayMs={row.isCurrent ? 0 : ci * 80}
                colorblind={colorblind}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Game-over banner */}
      {done && (
        <GameOverCard
          won={won}
          guesses={guesses.length}
          answer={answer}
          date={date}
          scoredHistory={scoredHistory}
        />
      )}

      {/* On-screen keyboard */}
      <Keyboard
        states={kbStates}
        onLetter={(l) =>
          setCurrent((c) =>
            c.length < WORD_LENGTH ? (c + l).toLowerCase() : c,
          )
        }
        onBackspace={() => setCurrent((c) => c.slice(0, -1))}
        onEnter={submitGuess}
        disabled={done}
        colorblind={colorblind}
      />
    </div>
  );
}

/**
 * End-game card with share button. Builds a colored-squares grid in
 * classic Wordle style and tries navigator.share() (mobile native sheet)
 * before falling back to the clipboard.
 */
function GameOverCard({
  won,
  guesses,
  answer,
  date,
  scoredHistory,
}: {
  won: boolean;
  guesses: number;
  answer: string;
  date: string;
  scoredHistory: ScoredLetter[][];
}) {
  const shareText = useMemo(() => {
    const score = won ? `${guesses}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
    const grid = scoredHistory
      .map((row) =>
        row
          .map((c) =>
            c.state === "correct" ? "🟩" : c.state === "present" ? "🟨" : "⬛",
          )
          .join(""),
      )
      .join("\n");
    return `Melio Wordle ${date} ${score}\n\n${grid}\n\nmeliogames.com/wordle`;
  }, [scoredHistory, won, guesses, date]);

  return (
    <div
      className={
        "rounded-xl border p-4 text-center " +
        (won
          ? "border-success/30 bg-success-soft"
          : "border-danger/30 bg-danger-soft")
      }
    >
      <div className="font-display text-xl text-ink">
        {won ? "Solved!" : "So close."}
      </div>
      <div className="text-sm text-ink-soft mt-1">
        {won
          ? `In ${guesses} ${guesses === 1 ? "guess" : "guesses"}.`
          : `The word was `}
        {!won && <strong className="text-ink uppercase">{answer}</strong>}
        {!won && "."}
      </div>
      <div className="text-xs text-ink-faint mt-2">
        Come back tomorrow for the next puzzle.
      </div>
      <div className="mt-3 flex justify-center gap-2 flex-wrap">
        <ShareButton
          title="Melio Wordle"
          label="Share"
          text={shareText}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-ink text-sm font-medium transition-colors duration-75"
        />
        <Link
          href="/sudoku/daily"
          className="px-3.5 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
        >
          Daily Sudoku
        </Link>
        <Link
          href="/"
          className="px-3.5 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors duration-75 " +
        (on
          ? "border-brand bg-brand-soft text-brand"
          : "border-edge bg-paper text-ink-soft hover:text-ink hover:bg-paper-raised")
      }
    >
      <span
        className={
          "w-7 h-3.5 rounded-full relative transition-colors duration-150 " +
          (on ? "bg-brand" : "bg-edge-strong")
        }
      >
        <span
          className={
            "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-paper transition-transform duration-150 " +
            (on ? "left-3.5" : "left-0.5")
          }
        />
      </span>
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-2 rounded-lg border border-edge bg-paper text-center">
      <div className="text-[9px] uppercase tracking-[0.12em] text-ink-faint font-medium">
        {label}
      </div>
      <div className="font-display text-lg text-ink tabular-nums">{value}</div>
    </div>
  );
}

function Tile({
  letter,
  state,
  animateDelayMs,
  colorblind,
}: {
  letter: string;
  state: LetterState | "empty" | "typing";
  animateDelayMs: number;
  colorblind?: boolean;
}) {
  // Colorblind palette swaps green/yellow for orange/blue — same pairing
  // NYT Wordle uses for its accessibility mode. Higher contrast against
  // both light and dark page backgrounds.
  const correctClass = colorblind
    ? "bg-[#f5793a] text-white border-[#f5793a]"
    : "bg-success text-canvas border-success";
  const presentClass = colorblind
    ? "bg-[#85c0f9] text-[#0a1325] border-[#85c0f9]"
    : "bg-warning text-canvas border-warning";
  const tone =
    state === "correct"
      ? correctClass
      : state === "present"
        ? presentClass
        : state === "absent"
          ? "bg-paper-raised text-ink-faint border-edge-strong"
          : state === "typing"
            ? "bg-paper text-ink border-edge-strong"
            : "bg-paper text-ink border-edge";
  const scored =
    state === "correct" || state === "present" || state === "absent";
  return (
    <div
      className={
        "w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-md border-2 font-display text-2xl sm:text-3xl font-bold uppercase tabular-nums select-none " +
        tone +
        " " +
        (scored ? "tile-flip" : "")
      }
      style={
        scored
          ? ({
              animationDelay: `${animateDelayMs}ms`,
            } as React.CSSProperties)
          : undefined
      }
    >
      {letter}
    </div>
  );
}

const KB_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "back"],
];

function Keyboard({
  states,
  onLetter,
  onBackspace,
  onEnter,
  disabled,
  colorblind,
}: {
  states: Record<string, LetterState>;
  onLetter: (l: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled: boolean;
  colorblind?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 select-none" aria-hidden={disabled}>
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1 sm:gap-1.5">
          {row.map((k) => {
            if (k === "enter") {
              return (
                <Key
                  key={k}
                  label="Enter"
                  wide
                  onClick={onEnter}
                  disabled={disabled}
                />
              );
            }
            if (k === "back") {
              return (
                <Key
                  key={k}
                  label="⌫"
                  wide
                  onClick={onBackspace}
                  disabled={disabled}
                />
              );
            }
            return (
              <Key
                key={k}
                label={k.toUpperCase()}
                state={states[k]}
                onClick={() => onLetter(k)}
                disabled={disabled}
                colorblind={colorblind}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Key({
  label,
  state,
  wide,
  onClick,
  disabled,
  colorblind,
}: {
  label: string;
  state?: LetterState;
  wide?: boolean;
  onClick: () => void;
  disabled?: boolean;
  colorblind?: boolean;
}) {
  const correctClass = colorblind
    ? "bg-[#f5793a] text-white"
    : "bg-success text-canvas";
  const presentClass = colorblind
    ? "bg-[#85c0f9] text-[#0a1325]"
    : "bg-warning text-canvas";
  const tone =
    state === "correct"
      ? correctClass
      : state === "present"
        ? presentClass
        : state === "absent"
          ? "bg-paper-raised text-ink-faint"
          : "bg-paper text-ink border border-edge";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md font-medium uppercase text-sm sm:text-base h-12 sm:h-14 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 " +
        tone +
        " " +
        (wide ? "px-3 sm:px-4 flex-[1.4]" : "flex-1 min-w-[1.6rem]")
      }
    >
      {label}
    </button>
  );
}

/** YYYY-MM-DD comparison: is `b` exactly one day after `a`? */
function datesAreConsecutive(a: string, b: string): boolean {
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return tb - ta === 86_400_000;
}
