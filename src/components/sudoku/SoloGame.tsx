"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  DIFFICULTY_LABEL,
  Difficulty,
  Puzzle,
  generatePuzzle,
  scoreBreakdown,
} from "@/lib/sudoku";
import { MAX_HINTS, useSudokuGame } from "@/lib/sudoku/useSudokuGame";
import { recordSoloScore, type SoloScoreResult } from "@/lib/games/actions";
import { useBoardTheme } from "@/components/BoardThemeProvider";
import { SudokuBoard } from "./SudokuBoard";
import { NumberPad } from "./NumberPad";
import { BoardDecoration } from "./BoardDecoration";

/**
 * Compact breakdown of how the score was computed. Shows the per-factor
 * multipliers so it's obvious that time, mistakes, AND hints each move the
 * number.
 */
function ScoreBreakdownStrip({
  difficulty,
  elapsedMs,
  mistakes,
  hintsUsed,
}: {
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
}) {
  const bd = scoreBreakdown(difficulty, elapsedMs, mistakes, hintsUsed);
  const fmt = (n: number) => n.toFixed(2);
  return (
    <div className="grid grid-cols-4 gap-2 text-xs">
      <Factor label="Base" value={bd.base.toString()} dim />
      <Factor
        label="Time"
        value={`×${fmt(bd.timeFactor)}`}
        good={bd.timeFactor >= 1}
      />
      <Factor
        label="Mistakes"
        value={`×${fmt(bd.mistakeFactor)}`}
        good={bd.mistakeFactor === 1}
        warn={bd.mistakeFactor < 1}
      />
      <Factor
        label="Hints"
        value={`×${fmt(bd.hintFactor)}`}
        good={bd.hintFactor === 1}
        warn={bd.hintFactor < 1}
      />
    </div>
  );
}

function Factor({
  label,
  value,
  good,
  warn,
  dim,
}: {
  label: string;
  value: string;
  good?: boolean;
  warn?: boolean;
  dim?: boolean;
}) {
  const tone = warn
    ? "text-danger"
    : good
      ? "text-success"
      : dim
        ? "text-ink"
        : "text-ink";
  return (
    <div className="rounded-lg border border-edge bg-paper-raised px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.1em] text-ink-faint font-medium">
        {label}
      </div>
      <div className={`mt-0.5 font-mono tabular-nums text-sm ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "A relaxing warm-up.",
  medium: "Balanced and steady.",
  hard: "Real chains and pairs.",
  expert: "For the truly fearless.",
  extreme: "The hardest sudoku math allows.",
};

export function SoloGame({ difficulty }: { difficulty: Difficulty }) {
  const [seed, setSeed] = useState(0);
  return (
    <SoloGameInner
      key={`${difficulty}-${seed}`}
      difficulty={difficulty}
      onNewGame={() => setSeed((s) => s + 1)}
    />
  );
}

function SoloGameInner({
  difficulty,
  onNewGame,
}: {
  difficulty: Difficulty;
  onNewGame: () => void;
}) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const p = generatePuzzle(difficulty);
      if (!cancelled) setPuzzle(p);
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [difficulty]);

  if (!puzzle) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="font-display text-lg text-ink-soft">
          Generating {DIFFICULTY_LABEL[difficulty]} puzzle…
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-paper-raised">
          <div className="h-full w-1/3 animate-pulse bg-brand" />
        </div>
      </div>
    );
  }

  return <GameInner puzzle={puzzle} onNewGame={onNewGame} />;
}

function GameInner({ puzzle, onNewGame }: { puzzle: Puzzle; onNewGame: () => void }) {
  const [noteMode, setNoteMode] = useState(false);
  const game = useSudokuGame(puzzle);
  const notStarted = !game.state.started;
  const { theme: boardTheme } = useBoardTheme();

  const [scoreResult, setScoreResult] = useState<SoloScoreResult | null>(null);
  const scoreRecordedRef = useRef(false);

  useEffect(() => {
    if (!game.complete || scoreRecordedRef.current) return;
    scoreRecordedRef.current = true;
    void recordSoloScore({
      difficulty: puzzle.difficulty,
      elapsedMs: game.state.elapsedMs,
      mistakes: game.state.mistakes,
      hintsUsed: game.state.hintsUsed,
    })
      .then(setScoreResult)
      .catch((err) => {
        console.warn("recordSoloScore failed:", err);
      });
  }, [game.complete, puzzle.difficulty, game.state.elapsedMs, game.state.mistakes, game.state.hintsUsed]);

  return (
    <div className="w-full max-w-[min(94vw,560px)] mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/sudoku"
            className="text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Sudoku
          </Link>
          <span className="text-ink-faint">·</span>
          <span className="font-display text-base text-ink">
            {DIFFICULTY_LABEL[puzzle.difficulty]}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-sm text-ink-soft">
          <span className="hidden xs:inline">
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
            aria-label="Begin puzzle"
          >
            <div className="text-center px-6 max-w-xs">
              <div className="font-display text-3xl sm:text-4xl text-ink mb-2">
                {DIFFICULTY_LABEL[puzzle.difficulty]}
              </div>
              <div className="text-sm text-ink-soft mb-6">
                {DIFFICULTY_BLURB[puzzle.difficulty]}
                <br />
                <span className="text-ink-faint">
                  {MAX_HINTS} hints · timer starts on begin
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
        {game.state.paused && !notStarted && (
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
        onInput={game.input}
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
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-soft text-success flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-ink mb-1">Solved</h2>
            {scoreResult ? (
              <>
                <div className="font-display text-5xl sm:text-6xl text-brand my-3 tabular-nums">
                  {scoreResult.score.toLocaleString()}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium mb-3">
                  {scoreResult.saved ? "Saved to leaderboard" : "Sign in to save"}
                </div>
              </>
            ) : (
              <div className="text-xs text-ink-faint my-3">Calculating score…</div>
            )}
            <ScoreBreakdownStrip
              difficulty={puzzle.difficulty}
              elapsedMs={game.state.elapsedMs}
              mistakes={game.state.mistakes}
              hintsUsed={game.state.hintsUsed}
            />
            <div className="text-sm text-ink-soft mb-6 mt-4">
              {DIFFICULTY_LABEL[puzzle.difficulty]} · {fmtTime(game.state.elapsedMs)} ·{" "}
              {game.state.mistakes} mistake{game.state.mistakes === 1 ? "" : "s"}
              {game.state.hintsUsed > 0 && (
                <>
                  {" "}· {game.state.hintsUsed} hint
                  {game.state.hintsUsed === 1 ? "" : "s"}
                </>
              )}
            </div>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                type="button"
                onClick={onNewGame}
                className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
              >
                Play another
              </button>
              <Link
                href={`/sudoku/leaderboard?d=${puzzle.difficulty}`}
                className="px-5 py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
              >
                Leaderboard
              </Link>
              <Link
                href="/sudoku"
                className="px-5 py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
              >
                Sudoku home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
