"use client";

import clsx from "clsx";
import { Board, CellValue } from "@/lib/sudoku";

interface Props {
  current: Board;
  noteMode: boolean;
  onInput: (value: CellValue) => void;
  onToggleNote: (value: number) => void;
  onClear: () => void;
  onToggleNoteMode: () => void;
  onUndo: () => void;
  onHint?: () => void;
  hintsLeft?: number;
  disabled?: boolean;
}

export function NumberPad({
  current,
  noteMode,
  onInput,
  onToggleNote,
  onClear,
  onToggleNoteMode,
  onUndo,
  onHint,
  hintsLeft,
  disabled,
}: Props) {
  const counts = new Array(10).fill(0) as number[];
  for (const v of current) counts[v]++;

  return (
    <div
      className={clsx(
        "flex flex-col gap-2 w-full",
        disabled && "opacity-50 pointer-events-none"
      )}
      aria-disabled={disabled}
    >
      <div className="grid grid-cols-9 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const exhausted = counts[n] >= 9;
          return (
            <button
              key={n}
              type="button"
              onClick={() =>
                noteMode ? onToggleNote(n) : onInput(n as CellValue)
              }
              disabled={exhausted}
              className={clsx(
                "relative aspect-square rounded-lg text-xl sm:text-2xl font-medium tabular-nums touch-manipulation transition-colors duration-75",
                "bg-paper border border-edge text-ink",
                "hover:bg-paper-raised hover:border-edge-strong",
                "active:bg-paper-sunken",
                "shadow-[0_1px_0_var(--edge)]",
                exhausted && "opacity-25 cursor-not-allowed",
                noteMode &&
                  "!bg-warning-soft !border-warning/40 !text-warning"
              )}
              aria-label={`Enter ${n}`}
            >
              {n}
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-ink-faint/20 text-[8px] font-semibold text-ink-soft flex items-center justify-center leading-none">
                {9 - counts[n]}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={clsx(
          "grid gap-1.5",
          onHint ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        <ActionButton onClick={onUndo} label="Undo" icon={<UndoIcon />} />
        <ActionButton onClick={onClear} label="Erase" icon={<EraseIcon />} />
        <ActionButton
          onClick={onToggleNoteMode}
          label="Notes"
          icon={<PencilIcon />}
          active={noteMode}
        />
        {onHint && (
          <ActionButton
            onClick={onHint}
            label="Hint"
            icon={<LightbulbIcon />}
            disabled={hintsLeft !== undefined && hintsLeft <= 0}
            badge={hintsLeft !== undefined ? String(hintsLeft) : undefined}
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  icon,
  active,
  disabled,
  badge,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium touch-manipulation transition-colors duration-75",
        "bg-paper border border-edge text-ink-soft",
        "hover:bg-paper-raised hover:border-edge-strong hover:text-ink",
        "active:bg-paper-sunken",
        "shadow-[0_1px_0_var(--edge)]",
        active && "!bg-warning-soft !border-warning/40 !text-warning",
        disabled && "opacity-40 cursor-not-allowed hover:bg-paper hover:text-ink-soft hover:border-edge"
      )}
    >
      {badge !== undefined && (
        <span className="absolute top-1.5 right-2 text-[10px] font-semibold text-ink-faint tabular-nums">
          {badge}
        </span>
      )}
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
    </svg>
  );
}

function EraseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16a2 2 0 0 1 0-2.8l9-9a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L13 19" />
      <line x1="18" y1="9" x2="12" y2="15" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}
