"use client";

import clsx from "clsx";
import { useBoardTheme } from "@/components/BoardThemeProvider";
import { BOARD_THEMES, BoardTheme } from "@/lib/board-themes";

/**
 * Settings card: pick a board theme. Each option renders a tiny 3x3 grid
 * preview painted with the theme's own swatches so the user can see what
 * they're choosing without having to start a game.
 */
export function BoardThemeSection() {
  const { theme: current, setTheme, mounted } = useBoardTheme();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg text-ink">Board theme</h2>
      <p className="text-sm text-ink-soft -mt-1">
        Cosmetic only — the sudoku board, separate from page light/dark.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {BOARD_THEMES.map((theme) => {
          const active = mounted && current === theme.id;
          return (
            <button
              type="button"
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={clsx(
                "group relative flex flex-col gap-2 p-3 rounded-xl border text-left transition-colors duration-75",
                active
                  ? "border-brand bg-brand-soft"
                  : "border-edge bg-paper hover:border-edge-strong"
              )}
            >
              <ThemePreview theme={theme} />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink truncate">
                    {theme.name}
                  </span>
                  {active && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="text-[11px] text-ink-faint mt-0.5 leading-snug">
                  {theme.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Tiny 3x3 grid preview using the theme's swatches. Imitates the look of the
 * real board: one given (dark), one user-entered (brand), one selected.
 */
function ThemePreview({ theme }: { theme: BoardTheme }) {
  const { paper, given, user, selected } = theme.swatches;
  // Cell config: 'g' = given digit, 'u' = user digit, 's' = selected cell, '' = blank
  const layout: Array<"g" | "u" | "s" | ""> = [
    "g", "", "u",
    "", "s", "",
    "u", "g", "",
  ];
  return (
    <div
      className="grid grid-cols-3 gap-px aspect-square w-full rounded-md overflow-hidden border-2"
      style={{ borderColor: given, backgroundColor: given }}
    >
      {layout.map((kind, i) => {
        const bg = kind === "s" ? selected : paper;
        const color =
          kind === "g" ? given : kind === "u" ? user : "transparent";
        const content = kind === "g" ? "5" : kind === "u" ? "3" : "";
        return (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] sm:text-xs font-semibold tabular-nums"
            style={{ backgroundColor: bg, color }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
