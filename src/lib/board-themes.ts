/**
 * Board themes — purely cosmetic. The board reads its colors from CSS
 * variables (--paper, --ink, --cell-given, etc.); each theme below either
 * leaves them alone (Paper — uses the page's light/dark tokens) or overrides
 * them via a `[data-board-theme="<id>"]` selector in globals.css.
 *
 * Add a new theme by:
 *   1. Add an entry below with `id`, name, description, and 4-color preview
 *      swatches.
 *   2. Add a matching `[data-board-theme="<id>"] { … }` block in globals.css.
 */

export type BoardThemeId =
  | "paper"
  | "sakura"
  | "midnight"
  | "forest"
  | "slate"
  | "coral"
  | "mono";

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  description: string;
  /** 4 colors used for the mini-grid preview in the settings picker. */
  swatches: {
    paper: string;
    given: string;
    user: string;
    selected: string;
  };
  /** When true, the theme follows the page's light/dark mode. */
  followsPageTheme?: boolean;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "paper",
    name: "Paper",
    description: "Warm cream — the original.",
    swatches: {
      paper: "#ffffff",
      given: "#1c1916",
      user: "#6d28d9",
      selected: "#ede4fe",
    },
    followsPageTheme: true,
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Cherry blossom pinks, crimson ink.",
    swatches: {
      paper: "#fff4f7",
      given: "#4a1230",
      user: "#c01a4f",
      selected: "#fbcad6",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep indigo with electric blue.",
    swatches: {
      paper: "#0c1325",
      given: "#e0e6ff",
      user: "#7aa2ff",
      selected: "#1f3a8a",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Mossy greens with warm gold.",
    swatches: {
      paper: "#1a2820",
      given: "#e8e6d4",
      user: "#d4a73a",
      selected: "#3a5a40",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Minimalist gray. Pure focus.",
    swatches: {
      paper: "#f5f5f5",
      given: "#0a0a0a",
      user: "#525252",
      selected: "#d4d4d4",
    },
  },
  {
    id: "coral",
    name: "Coral",
    description: "Warm sunset pinks and oranges.",
    swatches: {
      paper: "#fff4ee",
      given: "#7a2a14",
      user: "#e85a2e",
      selected: "#fdd4b8",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Pure black and white. No compromise.",
    swatches: {
      paper: "#ffffff",
      given: "#000000",
      user: "#525252",
      selected: "#e5e5e5",
    },
  },
];

export const BOARD_THEME_IDS: BoardThemeId[] = BOARD_THEMES.map((t) => t.id);

export const DEFAULT_BOARD_THEME: BoardThemeId = "paper";

export function isBoardThemeId(s: string): s is BoardThemeId {
  return (BOARD_THEME_IDS as string[]).includes(s);
}
