import { BOARD_SIZE, Board, CellValue, Difficulty, Puzzle } from "./types";

function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function emptyBoard(): Board {
  return new Array(BOARD_SIZE).fill(0) as Board;
}

export function cloneBoard(b: Board): Board {
  return b.slice() as Board;
}

export function isValidPlacement(board: Board, index: number, value: CellValue): boolean {
  if (value === 0) return true;
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row * 9 + i] === value) return false;
    if (i !== row && board[i * 9 + col] === value) return false;
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const idx = r * 9 + c;
      if (idx !== index && board[idx] === value) return false;
    }
  }
  return true;
}

function findEmpty(board: Board): number {
  for (let i = 0; i < BOARD_SIZE; i++) if (board[i] === 0) return i;
  return -1;
}

function fillBoard(board: Board, rand: () => number): boolean {
  const idx = findEmpty(board);
  if (idx === -1) return true;
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9] as CellValue[], rand);
  for (const n of candidates) {
    if (isValidPlacement(board, idx, n)) {
      board[idx] = n;
      if (fillBoard(board, rand)) return true;
      board[idx] = 0;
    }
  }
  return false;
}

export function generateSolvedBoard(rand: () => number = Math.random): Board {
  const b = emptyBoard();
  fillBoard(b, rand);
  return b;
}

export function countSolutions(board: Board, cap = 2): number {
  const idx = findEmpty(board);
  if (idx === -1) return 1;
  let count = 0;
  for (let n = 1 as CellValue; n <= 9; n = ((n as number) + 1) as CellValue) {
    if (isValidPlacement(board, idx, n)) {
      board[idx] = n;
      count += countSolutions(board, cap - count);
      board[idx] = 0;
      if (count >= cap) return count;
    }
  }
  return count;
}

export function solveBoard(board: Board): Board | null {
  const work = cloneBoard(board);
  const idx = findEmpty(work);
  if (idx === -1) return work;
  for (let n = 1 as CellValue; n <= 9; n = ((n as number) + 1) as CellValue) {
    if (isValidPlacement(work, idx, n)) {
      work[idx] = n;
      const r = solveBoard(work);
      if (r) return r;
      work[idx] = 0;
    }
  }
  return null;
}

const CLUE_RANGE: Record<Difficulty, [number, number]> = {
  easy: [40, 45],
  medium: [32, 36],
  hard: [27, 30],
  expert: [22, 26],
  // Sudoku's mathematical floor for a unique-solution puzzle is 17 clues.
  // Extreme rides right up against it. Generation can take a few seconds.
  extreme: [17, 21],
};

export function generatePuzzle(
  difficulty: Difficulty,
  rand: () => number = Math.random
): Puzzle {
  const solution = generateSolvedBoard(rand);
  const [minClues, maxClues] = CLUE_RANGE[difficulty];
  const targetClues = Math.floor(minClues + rand() * (maxClues - minClues + 1));

  const given = cloneBoard(solution);
  const indices = shuffle(Array.from({ length: BOARD_SIZE }, (_, i) => i), rand);
  let clues = BOARD_SIZE;

  for (const i of indices) {
    if (clues <= targetClues) break;
    const saved = given[i];
    given[i] = 0;
    const probe = cloneBoard(given);
    if (countSolutions(probe, 2) !== 1) {
      given[i] = saved;
    } else {
      clues--;
    }
  }

  return { difficulty, given, solution };
}

export function isBoardComplete(current: Board, solution: Board): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (current[i] !== solution[i]) return false;
  }
  return true;
}

export function progressPercent(given: Board, current: Board, solution: Board): number {
  let totalToFill = 0;
  let correct = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (given[i] === 0) {
      totalToFill++;
      if (current[i] === solution[i]) correct++;
    }
  }
  if (totalToFill === 0) return 100;
  return Math.round((correct / totalToFill) * 100);
}

/**
 * The 20 peer cells of a given index: cells in the same row, column, or 3x3
 * box (excluding the cell itself). Used to auto-clear pencil-mark notes
 * containing a value when that value is committed elsewhere in the unit.
 */
export function getPeers(index: number): number[] {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const peers = new Set<number>();
  for (let i = 0; i < 9; i++) {
    peers.add(row * 9 + i);
    peers.add(i * 9 + col);
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      peers.add(r * 9 + c);
    }
  }
  peers.delete(index);
  return Array.from(peers);
}

/**
 * Remove `value` from any pencil-mark notes in `index`'s peer cells.
 * Returns a new notes record (does not mutate `notes`). If no notes change,
 * returns the same reference so callers can short-circuit.
 */
export function clearNotesInPeers(
  notes: Record<number, number[]>,
  index: number,
  value: number
): Record<number, number[]> {
  if (value === 0) return notes;
  let changed = false;
  const next: Record<number, number[]> = { ...notes };
  for (const peer of getPeers(index)) {
    const peerNotes = next[peer];
    if (peerNotes && peerNotes.includes(value)) {
      const filtered = peerNotes.filter((n) => n !== value);
      if (filtered.length === 0) delete next[peer];
      else next[peer] = filtered;
      changed = true;
    }
  }
  return changed ? next : notes;
}

export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();
  for (let i = 0; i < BOARD_SIZE; i++) {
    const v = board[i];
    if (v === 0) continue;
    if (!isValidPlacement(board, i, v)) conflicts.add(i);
  }
  return conflicts;
}

export function encodeBoard(board: Board): string {
  if (board.length !== BOARD_SIZE) {
    throw new Error(
      `encodeBoard: expected ${BOARD_SIZE} cells, got ${board.length}`
    );
  }
  return board.map((c) => String(c | 0)).join("");
}

export function decodeBoard(s: string): Board {
  // Be tolerant of CHAR(n) trailing-space padding from Postgres and any stray
  // whitespace introduced in transport. Strip everything non-digit.
  const cleaned = String(s).replace(/[^0-9]/g, "");
  if (cleaned.length !== BOARD_SIZE) {
    throw new Error(
      `decodeBoard: expected ${BOARD_SIZE} digits, got ${cleaned.length} (raw length ${s?.length ?? 0})`
    );
  }
  const out = emptyBoard();
  for (let i = 0; i < BOARD_SIZE; i++) {
    const c = cleaned.charCodeAt(i) - 48; // '0' = 48
    out[i] = (c >= 0 && c <= 9 ? c : 0) as CellValue;
  }
  return out;
}
