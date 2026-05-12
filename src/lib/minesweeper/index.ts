/**
 * Minesweeper engine. Pure logic, no React.
 *
 * Cells are stored in a 1-D Uint8 array; each value encodes:
 *   - bit 0: mine?
 *   - bit 1: revealed?
 *   - bit 2: flagged?
 *   - bits 4..7: neighbor mine count (0..8)
 *
 * Mines are not placed until the first reveal — instead the engine
 * remembers the *target* mine count and lays them out at click time,
 * skipping the clicked cell and its 8 neighbors. This is standard
 * "safe first click" behavior and matches the original Microsoft impl.
 */

export type Difficulty = "beginner" | "intermediate" | "expert";

export interface DifficultyConfig {
  cols: number;
  rows: number;
  mines: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  // Classic expert is 30x16 but that's awkward on mobile. We use 12x16 for
  // a "hard" tier that fits a phone in portrait. Real expert is also
  // exposed for desktop users who pick it.
  expert: { cols: 16, rows: 16, mines: 60 },
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

export type Status = "fresh" | "playing" | "won" | "lost";

export interface Board {
  cols: number;
  rows: number;
  mines: number;
  cells: Uint8Array;
  /** Cells that have actually been revealed by the user (for win-check). */
  revealedCount: number;
  /** Number of flagged cells, for the mine-counter display. */
  flagCount: number;
  status: Status;
  /** Index of the mine that ended the game, when status === "lost". */
  losingIndex: number | null;
  /** Was the mine layout generated yet? Triggered by first reveal. */
  laid: boolean;
}

const MINE = 1 << 0;
const REVEALED = 1 << 1;
const FLAGGED = 1 << 2;
const COUNT_MASK = 0b1111_0000;

export function isMine(c: number): boolean {
  return (c & MINE) !== 0;
}
export function isRevealed(c: number): boolean {
  return (c & REVEALED) !== 0;
}
export function isFlagged(c: number): boolean {
  return (c & FLAGGED) !== 0;
}
export function neighborMines(c: number): number {
  return (c & COUNT_MASK) >> 4;
}

export function createBoard(d: Difficulty): Board {
  const { cols, rows, mines } = DIFFICULTIES[d];
  return {
    cols,
    rows,
    mines,
    cells: new Uint8Array(cols * rows),
    revealedCount: 0,
    flagCount: 0,
    status: "fresh",
    losingIndex: null,
    laid: false,
  };
}

function neighbors(b: Board, i: number): number[] {
  const x = i % b.cols;
  const y = Math.floor(i / b.cols);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= b.cols || ny < 0 || ny >= b.rows) continue;
      out.push(ny * b.cols + nx);
    }
  }
  return out;
}

/**
 * Lay mines uniformly at random, excluding `safeIndex` and its 8 neighbors
 * so the first click is always an empty cell (and usually a flood-fill).
 * Computes neighbor counts after placement.
 */
function layMines(b: Board, safeIndex: number) {
  const exclude = new Set<number>([safeIndex, ...neighbors(b, safeIndex)]);
  const total = b.cols * b.rows;
  const eligible: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!exclude.has(i)) eligible.push(i);
  }
  // Fisher-Yates partial shuffle — pick mines.length distinct indices.
  const n = Math.min(b.mines, eligible.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (eligible.length - i));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    b.cells[eligible[i]] |= MINE;
  }
  // Pre-compute neighbor counts for every cell.
  for (let i = 0; i < total; i++) {
    if (isMine(b.cells[i])) continue;
    let count = 0;
    for (const ni of neighbors(b, i)) {
      if (isMine(b.cells[ni])) count++;
    }
    b.cells[i] = (b.cells[i] & ~COUNT_MASK) | (count << 4);
  }
  b.laid = true;
}

/**
 * Iterative flood-fill from `start`: reveals contiguous zero-count cells
 * and the single ring of numbered cells around them.
 */
function flood(b: Board, start: number) {
  const queue = [start];
  while (queue.length > 0) {
    const i = queue.pop()!;
    const c = b.cells[i];
    if (isRevealed(c) || isFlagged(c)) continue;
    b.cells[i] |= REVEALED;
    b.revealedCount++;
    if (neighborMines(b.cells[i]) === 0 && !isMine(b.cells[i])) {
      for (const ni of neighbors(b, i)) {
        if (!isRevealed(b.cells[ni]) && !isFlagged(b.cells[ni])) {
          queue.push(ni);
        }
      }
    }
  }
}

function checkWin(b: Board): boolean {
  // Win = all non-mine cells revealed.
  return b.revealedCount === b.cols * b.rows - b.mines;
}

/**
 * Reveal a single cell. Returns a *new* Board so React sees a referential
 * change. Handles first-click-safe placement, flood-fill, win/lose
 * detection.
 */
export function reveal(prev: Board, i: number): Board {
  if (prev.status === "won" || prev.status === "lost") return prev;
  if (isRevealed(prev.cells[i]) || isFlagged(prev.cells[i])) return prev;

  const b: Board = {
    ...prev,
    cells: new Uint8Array(prev.cells),
  };
  if (!b.laid) layMines(b, i);

  if (isMine(b.cells[i])) {
    b.cells[i] |= REVEALED;
    b.revealedCount++;
    b.status = "lost";
    b.losingIndex = i;
    // Reveal every other mine so the user can see where they were.
    for (let k = 0; k < b.cells.length; k++) {
      if (isMine(b.cells[k]) && !isRevealed(b.cells[k])) {
        b.cells[k] |= REVEALED;
      }
    }
    return b;
  }

  flood(b, i);
  if (b.status === "fresh") b.status = "playing";
  if (checkWin(b)) {
    b.status = "won";
    // Auto-flag the remaining mines on win for a clean final board.
    for (let k = 0; k < b.cells.length; k++) {
      if (isMine(b.cells[k]) && !isFlagged(b.cells[k])) {
        b.cells[k] |= FLAGGED;
      }
    }
    b.flagCount = b.mines;
  }
  return b;
}

/** Toggle a flag on the given cell. No-op for revealed cells. */
export function toggleFlag(prev: Board, i: number): Board {
  if (prev.status === "won" || prev.status === "lost") return prev;
  if (isRevealed(prev.cells[i])) return prev;
  const b: Board = { ...prev, cells: new Uint8Array(prev.cells) };
  if (isFlagged(b.cells[i])) {
    b.cells[i] &= ~FLAGGED;
    b.flagCount--;
  } else {
    b.cells[i] |= FLAGGED;
    b.flagCount++;
  }
  if (b.status === "fresh") b.status = "playing";
  return b;
}

/**
 * "Chord" — reveal all hidden neighbors of an already-revealed numbered
 * cell, but only when the number of flagged neighbors matches the
 * cell's mine count. Classic power-user shortcut.
 */
export function chord(prev: Board, i: number): Board {
  if (prev.status !== "playing" && prev.status !== "fresh") return prev;
  const c = prev.cells[i];
  if (!isRevealed(c) || neighborMines(c) === 0) return prev;
  const ns = neighbors(prev, i);
  let flagged = 0;
  for (const ni of ns) if (isFlagged(prev.cells[ni])) flagged++;
  if (flagged !== neighborMines(c)) return prev;
  let next = prev;
  for (const ni of ns) {
    if (!isRevealed(next.cells[ni]) && !isFlagged(next.cells[ni])) {
      next = reveal(next, ni);
      // Stop early if we just lost.
      if (next.status === "lost") break;
    }
  }
  return next;
}
