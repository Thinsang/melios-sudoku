"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  BOARD_SIZE,
  Board,
  CellValue,
  Puzzle,
  cloneBoard,
  findConflicts,
  isBoardComplete,
  progressPercent,
} from ".";

export interface NotesMap {
  [index: number]: Set<number>;
}

export const MAX_HINTS = 3;

interface GameState {
  given: Board;
  current: Board;
  solution: Board;
  notes: Record<number, number[]>;
  selected: number | null;
  history: Array<{ index: number; prev: CellValue; next: CellValue }>;
  startedAt: number;
  elapsedMs: number;
  paused: boolean;
  mistakes: number;
  started: boolean;
  hintsUsed: number;
}

type Action =
  | { type: "select"; index: number | null }
  | { type: "input"; value: CellValue }
  | { type: "clear" }
  | { type: "toggleNote"; value: number }
  | { type: "undo" }
  | { type: "tick"; ms: number }
  | { type: "togglePause" }
  | { type: "hint" }
  | { type: "start" };

function init(puzzle: Puzzle): GameState {
  return {
    given: cloneBoard(puzzle.given),
    current: cloneBoard(puzzle.given),
    solution: cloneBoard(puzzle.solution),
    notes: {},
    selected: null,
    history: [],
    startedAt: 0,
    elapsedMs: 0,
    paused: false,
    mistakes: 0,
    started: false,
    hintsUsed: 0,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "start":
      if (state.started) return state;
      return { ...state, started: true, startedAt: Date.now() };

    case "select":
      return { ...state, selected: action.index };

    case "input": {
      if (!state.started) return state;
      if (state.selected === null) return state;
      const idx = state.selected;
      if (state.given[idx] !== 0) return state;
      const prev = state.current[idx];
      if (prev === action.value) return state;

      const next = action.value;
      const newCurrent = state.current.slice() as Board;
      newCurrent[idx] = next;

      const newNotes = { ...state.notes };
      if (next !== 0) delete newNotes[idx];

      const isMistake =
        next !== 0 && state.solution[idx] !== next ? state.mistakes + 1 : state.mistakes;

      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        history: [...state.history, { index: idx, prev, next }],
        mistakes: isMistake,
      };
    }

    case "clear": {
      if (!state.started) return state;
      if (state.selected === null) return state;
      const idx = state.selected;
      if (state.given[idx] !== 0) return state;
      const prev = state.current[idx];
      if (prev === 0 && !state.notes[idx]) return state;
      const newCurrent = state.current.slice() as Board;
      newCurrent[idx] = 0;
      const newNotes = { ...state.notes };
      delete newNotes[idx];
      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        history: [...state.history, { index: idx, prev, next: 0 }],
      };
    }

    case "toggleNote": {
      if (!state.started) return state;
      if (state.selected === null) return state;
      const idx = state.selected;
      if (state.given[idx] !== 0) return state;
      if (state.current[idx] !== 0) return state;
      const existing = new Set(state.notes[idx] ?? []);
      if (existing.has(action.value)) existing.delete(action.value);
      else existing.add(action.value);
      const newNotes = { ...state.notes };
      if (existing.size === 0) delete newNotes[idx];
      else newNotes[idx] = Array.from(existing).sort();
      return { ...state, notes: newNotes };
    }

    case "undo": {
      if (!state.started) return state;
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      const newCurrent = state.current.slice() as Board;
      newCurrent[last.index] = last.prev;
      return {
        ...state,
        current: newCurrent,
        history: state.history.slice(0, -1),
        selected: last.index,
      };
    }

    case "tick":
      if (state.paused || !state.started) return state;
      return { ...state, elapsedMs: state.elapsedMs + action.ms };

    case "togglePause":
      if (!state.started) return state;
      return { ...state, paused: !state.paused };

    case "hint": {
      if (!state.started) return state;
      if (state.hintsUsed >= MAX_HINTS) return state;
      if (state.selected === null) return state;
      const idx = state.selected;
      if (state.given[idx] !== 0) return state;
      if (state.current[idx] === state.solution[idx]) return state;
      const newCurrent = state.current.slice() as Board;
      const prev = newCurrent[idx];
      newCurrent[idx] = state.solution[idx];
      const newNotes = { ...state.notes };
      delete newNotes[idx];
      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        history: [...state.history, { index: idx, prev, next: state.solution[idx] }],
        hintsUsed: state.hintsUsed + 1,
      };
    }

    default:
      return state;
  }
}

export function useSudokuGame(puzzle: Puzzle) {
  const [state, dispatch] = useReducer(reducer, puzzle, init);

  const { given, current, solution, paused, selected, started, hintsUsed } = state;

  const conflicts = useMemo(() => findConflicts(current), [current]);
  const complete = useMemo(() => isBoardComplete(current, solution), [current, solution]);
  const progress = useMemo(
    () => progressPercent(given, current, solution),
    [given, current, solution]
  );

  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (complete || paused || !started) return;
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      dispatch({ type: "tick", ms: delta });
    }, 1000);
    return () => window.clearInterval(id);
  }, [complete, paused, started]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Allow Enter / Space to begin the puzzle when not started.
      if (!started && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        dispatch({ type: "start" });
        return;
      }
      if (!started) return;
      if (selected === null) return;
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        dispatch({ type: "input", value: Number(e.key) as CellValue });
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        dispatch({ type: "clear" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        dispatch({ type: "select", index: Math.max(0, selected - 9) });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        dispatch({ type: "select", index: Math.min(BOARD_SIZE - 1, selected + 9) });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selected % 9 !== 0) dispatch({ type: "select", index: selected - 1 });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selected % 9 !== 8) dispatch({ type: "select", index: selected + 1 });
      } else if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        dispatch({ type: "undo" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, started]);

  const select = useCallback((index: number | null) => dispatch({ type: "select", index }), []);
  const input = useCallback((value: CellValue) => dispatch({ type: "input", value }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const toggleNote = useCallback((value: number) => dispatch({ type: "toggleNote", value }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const togglePause = useCallback(() => dispatch({ type: "togglePause" }), []);
  const hint = useCallback(() => dispatch({ type: "hint" }), []);
  const start = useCallback(() => dispatch({ type: "start" }), []);

  const hintsLeft = MAX_HINTS - hintsUsed;

  return {
    state,
    conflicts,
    complete,
    progress,
    hintsLeft,
    select,
    input,
    clear,
    toggleNote,
    undo,
    togglePause,
    hint,
    start,
  };
}
