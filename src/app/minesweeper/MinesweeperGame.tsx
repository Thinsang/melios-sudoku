"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Board,
  type Difficulty,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  chord,
  createBoard,
  isFlagged,
  isMine,
  isRevealed,
  neighborMines,
  reveal,
  toggleFlag,
} from "@/lib/minesweeper";

const VALID_DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "expert",
];

const BEST_KEY = "melio_minesweeper_best_v1";

interface BestTimes {
  beginner?: number;
  intermediate?: number;
  expert?: number;
}

const NUMBER_COLORS: Record<number, string> = {
  1: "#1d4ed8", // blue
  2: "#15803d", // green
  3: "#b91c1c", // red
  4: "#5b21b6", // dark purple
  5: "#a16207", // brown
  6: "#0e7490", // teal
  7: "#000000", // black
  8: "#525252", // gray
};

function fmtClock(ms: number): string {
  const s = Math.min(999, Math.floor(ms / 1000));
  return s.toString().padStart(3, "0");
}

export function MinesweeperGame({
  difficulty: initialDifficulty,
}: {
  difficulty: Difficulty;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [board, setBoard] = useState<Board>(() => createBoard(initialDifficulty));
  const [flagMode, setFlagMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startMs = useRef<number | null>(null);
  const [best, setBest] = useState<BestTimes>({});
  const [justBestied, setJustBestied] = useState(false);

  // Hydrate bests from localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBest(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  // Tick the clock while playing.
  useEffect(() => {
    if (board.status !== "playing") return;
    const id = window.setInterval(() => {
      if (startMs.current !== null) {
        setElapsed(Date.now() - startMs.current);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [board.status]);

  // Save personal best when the user wins. Reacting to a status flip is
  // exactly the kind of "state derived from external system change" the
  // effect rule allows for; the lint heuristic doesn't detect this case
  // so we silence it explicitly.
  useEffect(() => {
    if (board.status !== "won") return;
    const final = elapsed;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest((prev) => {
      const cur = prev[difficulty];
      if (cur !== undefined && final >= cur) return prev;
      const nextBest: BestTimes = { ...prev, [difficulty]: final };
      try {
        window.localStorage.setItem(BEST_KEY, JSON.stringify(nextBest));
      } catch {
        // ignore
      }
      setJustBestied(true);
      return nextBest;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.status]);

  // Block the default browser context menu inside the grid so right-click
  // flags cleanly.
  function suppressContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  const handleReveal = useCallback(
    (i: number) => {
      setBoard((b) => {
        // First reveal starts the clock.
        if (!b.laid && startMs.current === null) {
          startMs.current = Date.now();
          setElapsed(0);
        }
        return reveal(b, i);
      });
    },
    [],
  );

  const handleFlag = useCallback((i: number) => {
    setBoard((b) => toggleFlag(b, i));
  }, []);

  const handleChord = useCallback((i: number) => {
    setBoard((b) => chord(b, i));
  }, []);

  function newGame(d: Difficulty) {
    setDifficulty(d);
    setBoard(createBoard(d));
    setFlagMode(false);
    setJustBestied(false);
    startMs.current = null;
    setElapsed(0);
  }

  const config = DIFFICULTIES[difficulty];
  const minesLeft = config.mines - board.flagCount;
  const won = board.status === "won";
  const lost = board.status === "lost";

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Difficulty tabs */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {VALID_DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => newGame(d)}
            className={
              "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors duration-75 " +
              (d === difficulty
                ? "border-brand bg-brand text-brand-ink"
                : "border-edge bg-paper text-ink-soft hover:text-ink hover:border-edge-strong")
            }
          >
            {DIFFICULTY_LABEL[d]}
            <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">
              {DIFFICULTIES[d].cols}×{DIFFICULTIES[d].rows} · {DIFFICULTIES[d].mines}
            </span>
          </button>
        ))}
      </div>

      {/* HUD */}
      <div className="flex items-center justify-between gap-3 w-full max-w-md px-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">💣</span>
          <span className="font-mono tabular-nums text-lg text-ink">
            {minesLeft.toString().padStart(3, "0")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => newGame(difficulty)}
          aria-label="New game"
          className="w-11 h-11 rounded-full bg-paper border border-edge hover:border-edge-strong hover:bg-paper-raised flex items-center justify-center text-xl transition-colors duration-75"
        >
          {lost ? "😵" : won ? "😎" : "🙂"}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-base">⏱️</span>
          <span className="font-mono tabular-nums text-lg text-ink">
            {fmtClock(elapsed)}
          </span>
        </div>
      </div>

      {/* Flag-mode toggle for touch devices. On desktop right-click works
          too but this is the primary mobile flagging UX. */}
      <button
        type="button"
        onClick={() => setFlagMode((f) => !f)}
        aria-pressed={flagMode}
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors duration-75 " +
          (flagMode
            ? "border-warning bg-warning text-canvas"
            : "border-edge bg-paper text-ink-soft hover:text-ink hover:border-edge-strong")
        }
      >
        <span aria-hidden>🚩</span>
        {flagMode ? "Flag mode (tap to flag)" : "Tap to flag"}
      </button>

      {/* Grid — sized to fit the viewport while staying square cells */}
      <div
        onContextMenu={suppressContextMenu}
        className="rounded-lg border-2 border-ink-faint bg-ink-faint p-1 select-none touch-manipulation overflow-auto max-w-full"
      >
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
            width: `min(94vw, ${board.cols * 32}px)`,
          }}
        >
          {Array.from(board.cells).map((cell, i) => (
            <Cell
              key={i}
              cell={cell}
              isLosing={lost && board.losingIndex === i}
              gameOver={won || lost}
              flagMode={flagMode}
              onReveal={() => handleReveal(i)}
              onFlag={() => handleFlag(i)}
              onChord={() => handleChord(i)}
            />
          ))}
        </div>
      </div>

      {/* Result banner */}
      {(won || lost) && (
        <div
          className={
            "w-full max-w-md rounded-xl border p-4 text-center " +
            (won
              ? "border-success/30 bg-success-soft"
              : "border-danger/30 bg-danger-soft")
          }
        >
          <div className="font-display text-xl text-ink">
            {won ? "Cleared!" : "Boom."}
          </div>
          <div className="text-sm text-ink-soft mt-1">
            {won ? (
              <>
                {DIFFICULTY_LABEL[difficulty]} ·{" "}
                <span className="font-mono tabular-nums text-ink">
                  {fmtClock(elapsed)}
                </span>{" "}
                seconds
                {justBestied && (
                  <span className="text-success font-medium">
                    {" "}· new personal best!
                  </span>
                )}
              </>
            ) : (
              <>You hit a mine. Try again — first click is always safe.</>
            )}
          </div>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => newGame(difficulty)}
              className="px-4 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
            >
              New game
            </button>
            <Link
              href="/"
              className="px-4 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
            >
              Home
            </Link>
          </div>
        </div>
      )}

      {/* Best times */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-md text-center">
        {VALID_DIFFICULTIES.map((d) => (
          <div key={d} className="p-2 rounded-lg border border-edge bg-paper">
            <div className="text-[9px] uppercase tracking-[0.12em] text-ink-faint font-medium">
              {DIFFICULTY_LABEL[d]}
            </div>
            <div className="font-mono tabular-nums text-sm text-ink mt-0.5">
              {best[d] !== undefined ? fmtClock(best[d]!) : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  cell,
  isLosing,
  gameOver,
  flagMode,
  onReveal,
  onFlag,
  onChord,
}: {
  cell: number;
  isLosing: boolean;
  gameOver: boolean;
  flagMode: boolean;
  onReveal: () => void;
  onFlag: () => void;
  onChord: () => void;
}) {
  const revealed = isRevealed(cell);
  const mine = isMine(cell);
  const flagged = isFlagged(cell);
  const n = neighborMines(cell);
  // Long-press detection for mobile flagging when not in flag mode.
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  function handleClick() {
    if (gameOver) return;
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (flagMode) {
      onFlag();
      return;
    }
    if (revealed && n > 0) {
      // Click on a numbered, revealed cell with matching flag count → chord.
      onChord();
      return;
    }
    onReveal();
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (gameOver) return;
    onFlag();
  }

  function handlePointerDown() {
    if (gameOver || flagMode || revealed) return;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      onFlag();
    }, 400);
  }
  function clearPress() {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  let content: React.ReactNode = "";
  let bg = "bg-paper-raised";
  let color = "";
  if (revealed) {
    bg = isLosing ? "bg-danger" : "bg-paper";
    if (mine) {
      content = "💣";
    } else if (n > 0) {
      content = n;
      color = NUMBER_COLORS[n];
    }
  } else if (flagged) {
    content = "🚩";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      disabled={gameOver && !revealed && !flagged}
      tabIndex={-1}
      className={
        "aspect-square flex items-center justify-center font-bold font-mono text-sm sm:text-base tabular-nums transition-colors duration-75 " +
        bg +
        " " +
        (revealed
          ? "border border-edge"
          : "border border-edge-strong hover:bg-paper-raised/70")
      }
      style={color ? { color } : undefined}
      aria-label={
        revealed
          ? mine
            ? "Mine"
            : n > 0
              ? `${n} adjacent mines`
              : "Empty"
          : flagged
            ? "Flagged"
            : "Hidden"
      }
    >
      {content}
    </button>
  );
}
