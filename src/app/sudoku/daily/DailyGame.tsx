"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Board,
  CellValue,
  DIFFICULTY_LABEL,
  Difficulty,
  Puzzle,
  cloneBoard,
} from "@/lib/sudoku";
import { MAX_HINTS, useSudokuGame } from "@/lib/sudoku/useSudokuGame";
import { recordDailyCompletion } from "@/lib/daily";
import { useBoardTheme } from "@/components/BoardThemeProvider";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { NumberPad } from "@/components/sudoku/NumberPad";
import { BoardDecoration } from "@/components/sudoku/BoardDecoration";

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${m}:${pad(sec)}`;
}

interface ExistingScore {
  score: number;
  elapsed_ms: number;
  mistakes: number;
  hints_used: number;
  created_at: string;
}

/**
 * Daily game UI. If the user has already finished today, we show a recap
 * card with the option to "Replay for a better score". Otherwise the full
 * board + number pad UX (which matches SoloGame).
 */
export function DailyGame({
  given,
  solution,
  difficulty,
  date,
  existingScore,
  isAuthed,
}: {
  given: Board;
  solution: Board;
  difficulty: Difficulty;
  date: string;
  existingScore: ExistingScore | null;
  isAuthed: boolean;
}) {
  const [replaying, setReplaying] = useState(false);

  if (existingScore && !replaying) {
    return (
      <CompletedRecap
        score={existingScore}
        difficulty={difficulty}
        onReplay={() => setReplaying(true)}
      />
    );
  }

  return (
    <ActiveDaily
      given={given}
      solution={solution}
      difficulty={difficulty}
      date={date}
      existingScore={existingScore}
      isAuthed={isAuthed}
    />
  );
}

function CompletedRecap({
  score,
  difficulty,
  onReplay,
}: {
  score: ExistingScore;
  difficulty: Difficulty;
  onReplay: () => void;
}) {
  return (
    <div className="rounded-2xl border border-success/30 bg-success-soft p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-faint font-medium">
            Today done · {DIFFICULTY_LABEL[difficulty]}
          </div>
          <div className="font-display text-4xl sm:text-5xl text-ink mt-1 tabular-nums">
            {score.score.toLocaleString()}{" "}
            <span className="text-sm font-sans text-ink-soft font-normal">
              points
            </span>
          </div>
          <div className="text-sm text-ink-soft mt-1.5">
            {fmtTime(score.elapsed_ms)} · {score.mistakes} mistake
            {score.mistakes === 1 ? "" : "s"}
            {score.hints_used > 0 && ` · ${score.hints_used} hint${score.hints_used === 1 ? "" : "s"}`}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onReplay}
              className="px-4 py-2 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
            >
              Replay for a better score
            </button>
            <Link
              href="/sudoku"
              className="px-4 py-2 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
            >
              Free play
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveDaily({
  given,
  solution,
  difficulty,
  date,
  existingScore,
  isAuthed,
}: {
  given: Board;
  solution: Board;
  difficulty: Difficulty;
  date: string;
  existingScore: ExistingScore | null;
  isAuthed: boolean;
}) {
  // Build a Puzzle for useSudokuGame from the (already-decoded) given +
  // solution. Reuses the exact same hook that powers SoloGame.
  const puzzle: Puzzle = {
    difficulty,
    given: cloneBoard(given),
    solution: cloneBoard(solution),
  };

  const [noteMode, setNoteMode] = useState(false);
  const game = useSudokuGame(puzzle);
  const notStarted = !game.state.started;
  const { theme: boardTheme } = useBoardTheme();

  // Record completion the moment the board is solved.
  const [recordResult, setRecordResult] = useState<{
    score: number;
    saved: boolean;
    improved: boolean;
  } | null>(null);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!game.complete || recordedRef.current) return;
    recordedRef.current = true;
    void recordDailyCompletion({
      date,
      difficulty,
      elapsedMs: game.state.elapsedMs,
      mistakes: game.state.mistakes,
      hintsUsed: game.state.hintsUsed,
    })
      .then(setRecordResult)
      .catch((err) => console.warn("recordDailyCompletion failed:", err));
  }, [
    game.complete,
    date,
    difficulty,
    game.state.elapsedMs,
    game.state.mistakes,
    game.state.hintsUsed,
  ]);

  return (
    <div className="w-full max-w-[min(94vw,560px)] mx-auto flex flex-col gap-5">
      {existingScore && !game.complete && (
        <div className="text-xs text-ink-faint border border-edge bg-paper-raised rounded-md px-3 py-2">
          You already finished today. This run only counts if it beats your
          best of{" "}
          <strong className="text-ink">
            {existingScore.score.toLocaleString()}
          </strong>
          .
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="font-display text-base text-ink">
          {DIFFICULTY_LABEL[difficulty]}
        </span>
        <div className="flex items-center gap-3 sm:gap-4 text-ink-soft">
          <span>
            <span className="text-ink-faint">Mistakes</span>{" "}
            <span className="font-medium text-ink tabular-nums">
              {game.state.mistakes}
            </span>
          </span>
          <span className="font-mono tabular-nums text-ink">
            {fmtTime(game.state.elapsedMs)}
          </span>
          <button
            type="button"
            onClick={game.togglePause}
            disabled={notStarted}
            className="px-2.5 py-1 rounded-md border border-edge bg-paper text-ink-soft hover:text-ink hover:bg-paper-raised disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors duration-75"
          >
            {game.state.paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="relative isolate">
        <BoardDecoration theme={boardTheme} />
        <SudokuBoard
          given={game.state.given}
          current={game.state.current}
          solution={game.state.solution}
          notes={game.state.notes}
          selected={game.state.selected}
          conflicts={game.conflicts}
          onSelect={game.select}
        />
        {notStarted && (
          <button
            type="button"
            onClick={game.start}
            className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/90 backdrop-blur-sm rounded-xl cursor-pointer group focus:outline-none"
            aria-label="Begin daily puzzle"
          >
            <div className="text-center px-6 max-w-xs">
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium mb-1">
                Daily challenge
              </div>
              <div className="font-display text-3xl sm:text-4xl text-ink mb-2">
                {DIFFICULTY_LABEL[difficulty]}
              </div>
              <div className="text-sm text-ink-soft mb-5">
                {MAX_HINTS} hints. Timer starts when you begin.
                <br />
                <span className="text-ink-faint">
                  Counts toward your streak.
                </span>
              </div>
              <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand text-brand-ink font-medium shadow-[var(--shadow-soft)] group-hover:bg-brand-hover group-active:scale-[0.98] transition-all duration-75">
                Begin
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </button>
        )}
        {game.state.paused && !notStarted && !game.complete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/85 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <div className="font-display text-2xl text-ink mb-3">Paused</div>
              <button
                type="button"
                onClick={game.togglePause}
                className="px-5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      <NumberPad
        current={game.state.current}
        noteMode={noteMode}
        onInput={game.input as (v: CellValue) => void}
        onToggleNote={game.toggleNote}
        onClear={game.clear}
        onToggleNoteMode={() => setNoteMode((n) => !n)}
        onUndo={game.undo}
        onHint={game.hint}
        hintsLeft={game.hintsLeft}
        disabled={notStarted}
      />

      {game.complete && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-paper border border-edge rounded-2xl p-7 sm:p-8 max-w-md w-full text-center shadow-[var(--shadow-lifted)]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-soft text-warning flex items-center justify-center text-xl">
              🔥
            </div>
            <h2 className="font-display text-2xl text-ink mb-1">
              Daily done!
            </h2>
            <div className="font-display text-5xl sm:text-6xl text-brand my-3 tabular-nums">
              {(recordResult?.score ?? "—").toLocaleString()}
            </div>
            {!isAuthed && (
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium mb-3">
                Sign in to save your streak
              </div>
            )}
            {recordResult?.improved && existingScore && (
              <div className="text-[11px] uppercase tracking-[0.18em] text-success font-medium mb-3">
                New personal best for today
              </div>
            )}
            {recordResult?.saved && !recordResult.improved && existingScore && (
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium mb-3">
                Best stays at {existingScore.score.toLocaleString()}
              </div>
            )}
            <div className="text-sm text-ink-soft mb-6">
              {DIFFICULTY_LABEL[difficulty]} · {fmtTime(game.state.elapsedMs)}{" "}
              · {game.state.mistakes} mistake
              {game.state.mistakes === 1 ? "" : "s"}
              {game.state.hintsUsed > 0 && (
                <>
                  {" "}· {game.state.hintsUsed} hint
                  {game.state.hintsUsed === 1 ? "" : "s"}
                </>
              )}
            </div>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <Link
                href="/sudoku"
                className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
              >
                Free play
              </Link>
              <Link
                href="/sudoku/leaderboard"
                className="px-5 py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
