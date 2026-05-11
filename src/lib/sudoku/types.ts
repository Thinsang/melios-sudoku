export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Board = CellValue[];

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

export interface Puzzle {
  difficulty: Difficulty;
  given: Board;
  solution: Board;
}

export interface CellPos {
  row: number;
  col: number;
  box: number;
  index: number;
}

export const BOARD_SIZE = 81;

export function indexToPos(index: number): CellPos {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  return { row, col, box, index };
}

export function posToIndex(row: number, col: number): number {
  return row * 9 + col;
}
