"use client";

import clsx from "clsx";
import { Board, CellValue } from "@/lib/sudoku";

interface Props {
  given: Board;
  current: Board;
  solution: Board;
  notes: Record<number, number[]>;
  selected: number | null;
  conflicts: Set<number>;
  lockedBy?: Record<number, string>;
  onSelect: (index: number) => void;
  hideMistakes?: boolean;
}

export function SudokuBoard({
  given,
  current,
  solution,
  notes,
  selected,
  conflicts,
  lockedBy,
  onSelect,
  hideMistakes,
}: Props) {
  const selRow = selected !== null ? Math.floor(selected / 9) : -1;
  const selCol = selected !== null ? selected % 9 : -1;
  const selBox =
    selected !== null
      ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3)
      : -1;
  const selectedValue = selected !== null ? current[selected] : 0;

  return (
    <div
      className="grid grid-cols-9 grid-rows-9 aspect-square w-full select-none touch-manipulation rounded-xl overflow-hidden border-2 border-ink bg-paper shadow-[var(--shadow-soft)]"
      role="grid"
      aria-label="Sudoku board"
    >
      {current.map((value, i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

        const isGiven = given[i] !== 0;
        const isSelected = selected === i;
        const inSelLine =
          selected !== null && (row === selRow || col === selCol || box === selBox);
        const matchesSelectedValue =
          selectedValue !== 0 && value === selectedValue && !isSelected;
        const isConflict = conflicts.has(i);
        const isWrong =
          !hideMistakes && !isGiven && value !== 0 && value !== solution[i];
        const lockedByOther = lockedBy?.[i];

        const isThickRight = col === 2 || col === 5;
        const isThickBottom = row === 2 || row === 5;
        const cellNotes = notes[i] ?? [];

        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            aria-selected={isSelected}
            aria-label={`Row ${row + 1} column ${col + 1}${value ? ` value ${value}` : " empty"}`}
            onClick={() => onSelect(i)}
            disabled={Boolean(lockedByOther)}
            className={clsx(
              "relative flex items-center justify-center font-medium outline-none touch-manipulation",
              "text-lg sm:text-2xl md:text-[1.75rem] tabular-nums",
              // Base cell paper
              "bg-paper",
              // Thin internal borders
              col < 8 &&
                (isThickRight
                  ? "border-r-2 border-r-ink"
                  : "border-r border-r-edge"),
              row < 8 &&
                (isThickBottom
                  ? "border-b-2 border-b-ink"
                  : "border-b border-b-edge"),
              // Givens: ink (typographically distinct via weight).
              // User input: brand color.
              isGiven
                ? "text-[var(--cell-given)] font-semibold"
                : "text-[var(--cell-user)] font-medium",
              // Mistakes win text color regardless of conflict — vivid red,
              // bold weight, so a wrong digit can't be mistaken for a correct
              // one in the brand color.
              isWrong && "!text-[var(--cell-conflict-ink)] !font-bold",
              // Background priority: conflict > selected > matchesValue > inSelLine > wrong > lockedByOther
              isConflict && "!bg-[var(--cell-conflict)]",
              !isConflict && isSelected && "!bg-[var(--cell-selected)]",
              !isConflict &&
                !isSelected &&
                matchesSelectedValue &&
                "!bg-[var(--cell-match)]",
              !isConflict &&
                !isSelected &&
                !matchesSelectedValue &&
                inSelLine &&
                "!bg-[var(--cell-related)]",
              !isConflict &&
                !isSelected &&
                !matchesSelectedValue &&
                !inSelLine &&
                isWrong &&
                "!bg-[var(--cell-wrong-bg)]",
              !isConflict &&
                !isSelected &&
                !inSelLine &&
                !isWrong &&
                lockedByOther &&
                "!bg-warning-soft",
              lockedByOther && "cursor-not-allowed"
            )}
          >
            {value !== 0 ? (
              <span>{value}</span>
            ) : cellNotes.length > 0 ? (
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full text-[0.55rem] sm:text-[0.65rem] leading-none text-ink-faint p-0.5 font-mono">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n} className="flex items-center justify-center">
                    {cellNotes.includes(n) ? n : ""}
                  </span>
                ))}
              </div>
            ) : null}
            {lockedByOther && (
              <span className="absolute bottom-0 right-0.5 text-[0.5rem] font-semibold text-warning">
                {lockedByOther.slice(0, 2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type { Props as SudokuBoardProps };
export type SudokuValue = CellValue;
