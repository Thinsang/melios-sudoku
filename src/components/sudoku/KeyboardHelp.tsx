"use client";

import { useEffect, useState } from "react";

/**
 * Keyboard shortcuts cheat sheet. Triggers on "?" or "/" — same
 * convention as GitHub, Linear, etc. Used on the sudoku game pages so
 * power users discover keyboard navigation without it being in the way.
 *
 * Renders nothing until opened. Esc closes.
 */

interface Shortcut {
  keys: string[];
  label: string;
}

const SUDOKU_SHORTCUTS: Array<{ group: string; items: Shortcut[] }> = [
  {
    group: "Selection",
    items: [
      { keys: ["←", "→", "↑", "↓"], label: "Move between cells" },
      { keys: ["Click"], label: "Select a cell directly" },
    ],
  },
  {
    group: "Input",
    items: [
      { keys: ["1", "–", "9"], label: "Place a digit" },
      { keys: ["0", "Backspace", "Delete"], label: "Clear the cell" },
      { keys: ["Ctrl/⌘", "Z"], label: "Undo last move" },
    ],
  },
  {
    group: "Game",
    items: [
      { keys: ["Enter", "Space"], label: "Begin the puzzle" },
      { keys: ["?", "/"], label: "Open this cheat sheet" },
    ],
  },
];

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept while the user is typing in an input/textarea.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (!open && (e.key === "?" || e.key === "/")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-help-title"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-paper border border-edge rounded-2xl shadow-[var(--shadow-lifted)] w-full max-w-md p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint font-medium">
              Shortcuts
            </div>
            <h2
              id="kb-help-title"
              className="font-display text-xl text-ink leading-snug"
            >
              Keyboard
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="text-ink-faint hover:text-ink transition-colors duration-75 -mt-1 -mr-1 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {SUDOKU_SHORTCUTS.map((g) => (
            <div key={g.group}>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium mb-2">
                {g.group}
              </div>
              <ul className="flex flex-col gap-1.5">
                {g.items.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-ink-soft">{s.label}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, ki) =>
                        k === "–" ? (
                          <span
                            key={ki}
                            className="text-ink-faint text-xs"
                            aria-hidden
                          >
                            –
                          </span>
                        ) : (
                          <kbd
                            key={ki}
                            className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-edge bg-paper-raised text-ink min-w-[1.4rem] text-center"
                          >
                            {k}
                          </kbd>
                        ),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-faint mt-5 text-center">
          Press <kbd className="font-mono px-1 py-0.5 rounded bg-paper-raised border border-edge">Esc</kbd>{" "}
          or click outside to close.
        </p>
      </div>
    </div>
  );
}
