/**
 * 2048 engine. Pure logic, no React.
 *
 * Board is a length-16 number array (row-major). Empty cells are 0;
 * occupied cells store the tile value (2, 4, 8, ... 2048, ...).
 * Tiles slide and merge: two same-value tiles collide into one of
 * double the value. Each move that changes the board spawns one new
 * tile (90% chance of 2, 10% chance of 4) on a random empty cell.
 */

export const SIZE = 4;
export type Board = number[];
export type Direction = "up" | "down" | "left" | "right";

/** Fresh 4x4 board with two starter tiles. */
export function createBoard(): Board {
  const b: Board = Array(SIZE * SIZE).fill(0);
  return spawn(spawn(b));
}

/** Add a 2 (90%) or 4 (10%) to a random empty cell. Returns a new board. */
export function spawn(board: Board): Board {
  const empties: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) empties.push(i);
  }
  if (empties.length === 0) return board;
  const next = board.slice();
  const i = empties[Math.floor(Math.random() * empties.length)];
  next[i] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

/**
 * Slide one row toward index 0, merging same-value neighbors. Returns
 * the new row + the score gained from merges (sum of merged values).
 */
function slideRow(row: number[]): { row: number[]; gained: number } {
  const compact = row.filter((v) => v !== 0);
  const merged: number[] = [];
  let gained = 0;
  for (let i = 0; i < compact.length; i++) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const sum = compact[i] * 2;
      merged.push(sum);
      gained += sum;
      i++; // skip the partner
    } else {
      merged.push(compact[i]);
    }
  }
  while (merged.length < row.length) merged.push(0);
  return { row: merged, gained };
}

/** Read a row (left-to-right) given a row index. */
function getRow(b: Board, y: number): number[] {
  return b.slice(y * SIZE, (y + 1) * SIZE);
}
function setRow(b: Board, y: number, row: number[]) {
  for (let x = 0; x < SIZE; x++) b[y * SIZE + x] = row[x];
}
function getCol(b: Board, x: number): number[] {
  const r: number[] = [];
  for (let y = 0; y < SIZE; y++) r.push(b[y * SIZE + x]);
  return r;
}
function setCol(b: Board, x: number, col: number[]) {
  for (let y = 0; y < SIZE; y++) b[y * SIZE + x] = col[y];
}

export interface MoveResult {
  board: Board;
  /** Sum of values created by merges this move. */
  gained: number;
  /** True if any tile actually moved or merged. */
  changed: boolean;
}

/**
 * Slide every row/column in the given direction. Doesn't spawn —
 * callers do that when the move was a change. Returns a fresh board.
 */
export function move(board: Board, dir: Direction): MoveResult {
  const next = board.slice();
  let gained = 0;
  if (dir === "left") {
    for (let y = 0; y < SIZE; y++) {
      const { row, gained: g } = slideRow(getRow(next, y));
      setRow(next, y, row);
      gained += g;
    }
  } else if (dir === "right") {
    for (let y = 0; y < SIZE; y++) {
      const row = getRow(next, y);
      row.reverse();
      const { row: r, gained: g } = slideRow(row);
      r.reverse();
      setRow(next, y, r);
      gained += g;
    }
  } else if (dir === "up") {
    for (let x = 0; x < SIZE; x++) {
      const { row: col, gained: g } = slideRow(getCol(next, x));
      setCol(next, x, col);
      gained += g;
    }
  } else {
    for (let x = 0; x < SIZE; x++) {
      const col = getCol(next, x);
      col.reverse();
      const { row: c, gained: g } = slideRow(col);
      c.reverse();
      setCol(next, x, c);
      gained += g;
    }
  }
  const changed = next.some((v, i) => v !== board[i]);
  return { board: next, gained, changed };
}

/** True if there is at least one legal move (any direction). */
export function canMove(board: Board): boolean {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) return true;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    if (x + 1 < SIZE && board[i] === board[i + 1]) return true;
    if (y + 1 < SIZE && board[i] === board[i + SIZE]) return true;
  }
  return false;
}

/** True if the board contains 2048 or larger. */
export function hasReached2048(board: Board): boolean {
  return board.some((v) => v >= 2048);
}
