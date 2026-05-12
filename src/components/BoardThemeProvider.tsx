"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  BOARD_THEME_IDS,
  BoardThemeId,
  DEFAULT_BOARD_THEME,
  isBoardThemeId,
} from "@/lib/board-themes";

const STORAGE_KEY = "melio_board_theme";

interface BoardThemeContextValue {
  theme: BoardThemeId;
  setTheme: (id: BoardThemeId) => void;
  /** False during SSR / before localStorage has been read. */
  mounted: boolean;
}

const BoardThemeContext = createContext<BoardThemeContextValue>({
  theme: DEFAULT_BOARD_THEME,
  setTheme: () => {},
  mounted: false,
});

/**
 * Holds the board theme — independent of light/dark page theme. Persists to
 * localStorage so it follows the user across sessions on the same device.
 */
export function BoardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<BoardThemeId>(DEFAULT_BOARD_THEME);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: only read localStorage after the first render, then flip
  // `mounted` so consumers can avoid showing the wrong theme briefly.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isBoardThemeId(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
      }
    } catch {
      // localStorage may throw in some privacy contexts; ignore.
    }
    setMounted(true);
  }, []);

  const setTheme = useCallback((id: BoardThemeId) => {
    if (!BOARD_THEME_IDS.includes(id)) return;
    setThemeState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  return (
    <BoardThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </BoardThemeContext.Provider>
  );
}

export function useBoardTheme() {
  return useContext(BoardThemeContext);
}
