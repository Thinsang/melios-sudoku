"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SIZE,
  type Board,
  type Direction,
  canMove,
  createBoard,
  hasReached2048,
  move,
  spawn,
} from "@/lib/twentyfortyeight";

const BEST_KEY = "melio_2048_best_v1";

// Curated palette per tile value. Higher tiles get warmer / more saturated
// brand-adjacent colors. Background derived from tile value so it stays
// readable in dark mode too.
const TILE_STYLES: Record<number, { bg: string; fg: string }> = {
  2:    { bg: "#eee4da", fg: "#776e65" },
  4:    { bg: "#ede0c8", fg: "#776e65" },
  8:    { bg: "#f2b179", fg: "#f9f6f2" },
  16:   { bg: "#f59563", fg: "#f9f6f2" },
  32:   { bg: "#f67c5f", fg: "#f9f6f2" },
  64:   { bg: "#f65e3b", fg: "#f9f6f2" },
  128:  { bg: "#edcf72", fg: "#f9f6f2" },
  256:  { bg: "#edcc61", fg: "#f9f6f2" },
  512:  { bg: "#edc850", fg: "#f9f6f2" },
  1024: { bg: "#edc53f", fg: "#f9f6f2" },
  2048: { bg: "#edc22e", fg: "#f9f6f2" },
};
const SUPER_TILE = { bg: "#6d28d9", fg: "#ffffff" }; // brand purple for 4096+

function tileFontSize(value: number) {
  // Smaller font for 4-digit numbers so they fit the tile on mobile.
  if (value < 100) return "text-3xl sm:text-4xl";
  if (value < 1000) return "text-2xl sm:text-3xl";
  if (value < 10000) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}

export function TwentyFortyEightGame() {
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [reached2048, setReached2048] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  // One-step undo snapshot. Set after every successful move; consumed
  // (cleared) when undo is used or a new game starts. Single-step keeps
  // the game honest — you can't fish for a 4-spawn.
  const [previous, setPrevious] = useState<{
    board: Board;
    score: number;
  } | null>(null);

  // Hydrate best score.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (raw) {
        const n = Number(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Number.isFinite(n)) setBest(n);
      }
    } catch {
      // ignore
    }
  }, []);

  const tryMove = useCallback((dir: Direction) => {
    if (gameOver) return;
    setBoard((cur) => {
      const result = move(cur, dir);
      if (!result.changed) return cur;
      const next = spawn(result.board);
      // Snapshot the state we're leaving so the user can undo this one
      // move. Use the score-updater closure so we capture the pre-move
      // score correctly.
      setScore((s) => {
        setPrevious({ board: cur, score: s });
        const ns = s + result.gained;
        setBest((b) => {
          if (ns > b) {
            try {
              window.localStorage.setItem(BEST_KEY, String(ns));
            } catch {
              // ignore
            }
            return ns;
          }
          return b;
        });
        return ns;
      });
      if (!reached2048 && hasReached2048(next)) {
        setReached2048(true);
      }
      if (!canMove(next)) setGameOver(true);
      return next;
    });
  }, [gameOver, reached2048]);

  function undo() {
    if (!previous) return;
    setBoard(previous.board);
    setScore(previous.score);
    setPrevious(null);
    setGameOver(false);
  }

  // Keyboard input — arrows, WASD, and vim-style HJKL.
  // We normalize letter keys via toLowerCase so caps-lock doesn't matter
  // and modifier-less keypresses are handled identically.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't steal keystrokes if the user is typing in something focusable.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      // Ignore modifier combos (e.g. Ctrl+W should still close the tab).
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        // Vim bindings as a bonus.
        k: "up",
        j: "down",
        h: "left",
        l: "right",
      };
      const dir = map[k];
      if (dir) {
        e.preventDefault();
        tryMove(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryMove]);

  // Touch swipe input.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const THRESHOLD = 24;
    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      tryMove(dx > 0 ? "right" : "left");
    } else {
      tryMove(dy > 0 ? "down" : "up");
    }
  }

  function newGame() {
    setBoard(createBoard());
    setScore(0);
    setReached2048(false);
    setContinuing(false);
    setGameOver(false);
    setPrevious(null);
  }

  // After hitting 2048, give a one-time "You won!" overlay; the user
  // can choose to keep playing or start over.
  const showWonModal = reached2048 && !continuing && !gameOver;

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* HUD */}
      <div className="flex items-stretch gap-2 w-full">
        <div className="flex-1 rounded-lg bg-paper border border-edge p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.12em] text-ink-faint font-medium">
            Score
          </div>
          <div className="font-display text-xl text-ink tabular-nums">
            {score.toLocaleString()}
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-paper border border-edge p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.12em] text-ink-faint font-medium">
            Best
          </div>
          <div className="font-display text-xl text-brand tabular-nums">
            {best.toLocaleString()}
          </div>
        </div>
        <button
          type="button"
          onClick={undo}
          disabled={!previous}
          aria-label="Undo last move"
          title="Undo last move (one step)"
          className="px-3 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-75"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={newGame}
          className="px-4 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
        >
          New
        </button>
      </div>

      {/* Board */}
      <div
        className="relative rounded-xl bg-ink-faint p-2 select-none touch-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ width: "min(94vw, 26rem)" }}
      >
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((value, i) => (
            <Tile key={i} value={value} />
          ))}
        </div>

        {/* Game-over overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas/85 backdrop-blur-sm rounded-xl">
            <div className="text-center px-6">
              <div className="font-display text-3xl sm:text-4xl text-ink">
                Game over.
              </div>
              <div className="text-sm text-ink-soft mt-1">
                No more moves.{" "}
                <span className="text-brand font-medium tabular-nums">
                  {score.toLocaleString()}
                </span>{" "}
                points.
              </div>
              <button
                type="button"
                onClick={newGame}
                className="mt-4 px-5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
              >
                Play again
              </button>
            </div>
          </div>
        )}

        {/* Won overlay (dismissible — user can keep playing) */}
        {showWonModal && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-canvas/85 backdrop-blur-sm rounded-xl">
            <div className="text-center px-6">
              <div className="text-2xl">🎉</div>
              <div className="font-display text-3xl sm:text-4xl text-ink mt-1">
                You hit 2048.
              </div>
              <div className="text-sm text-ink-soft mt-1">
                Keep going for a higher score, or start fresh.
              </div>
              <div className="mt-4 flex justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setContinuing(true)}
                  className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
                >
                  Keep going
                </button>
                <button
                  type="button"
                  onClick={newGame}
                  className="px-4 py-2 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
                >
                  New game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touch hint + arrow controls for desktop/mobile parity */}
      <div className="flex flex-col items-center gap-2">
        <ArrowControls onMove={tryMove} disabled={gameOver} />
        <p className="text-xs text-ink-faint">
          Arrow keys, WASD, or swipe.
        </p>
        <Link
          href="/"
          className="text-xs text-ink-soft hover:text-ink transition-colors duration-75"
        >
          ← Back to Melio Games
        </Link>
      </div>
    </div>
  );
}

function Tile({ value }: { value: number }) {
  if (value === 0) {
    return (
      <div
        className="aspect-square rounded-md bg-paper-raised/60"
        aria-hidden
      />
    );
  }
  const style =
    TILE_STYLES[value] ??
    (value >= 4096 ? SUPER_TILE : TILE_STYLES[2048]);
  return (
    <div
      className={
        "aspect-square rounded-md flex items-center justify-center font-display font-semibold tabular-nums shadow-[var(--shadow-soft)] " +
        tileFontSize(value)
      }
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {value}
    </div>
  );
}

function ArrowControls({
  onMove,
  disabled,
}: {
  onMove: (d: Direction) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:hidden">
      <div />
      <ControlButton onClick={() => onMove("up")} disabled={disabled} label="▲" />
      <div />
      <ControlButton onClick={() => onMove("left")} disabled={disabled} label="◀" />
      <ControlButton onClick={() => onMove("down")} disabled={disabled} label="▼" />
      <ControlButton onClick={() => onMove("right")} disabled={disabled} label="▶" />
    </div>
  );
}

function ControlButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-12 h-10 rounded-md border border-edge bg-paper hover:bg-paper-raised disabled:opacity-40 text-ink flex items-center justify-center transition-colors duration-75"
      aria-label={`Move ${label}`}
    >
      {label}
    </button>
  );
}
