import { WORDS, isValidGuess } from "./words";

export { WORDS, isValidGuess };

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** State of a single letter in a guess. */
export type LetterState = "correct" | "present" | "absent";

export interface ScoredLetter {
  letter: string;
  state: LetterState;
}

/**
 * UTC YYYY-MM-DD for "today". Matches the sudoku daily semantics so a
 * shared "Day N" mental model works across games.
 */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Pick the answer for `dateIso` deterministically from WORDS. Uses a
 * tiny FNV-1a hash of the date string so the order isn't trivially
 * predictable from the date.
 */
export function answerForDate(dateIso: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < dateIso.length; i++) {
    h ^= dateIso.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return WORDS[h % WORDS.length];
}

/**
 * Score a guess against the answer with standard Wordle rules:
 *   - Exact letter+position match = "correct"
 *   - Letter exists elsewhere in answer = "present" (but each answer
 *     letter is only matched once — duplicates beyond the count in
 *     the answer are "absent")
 *   - Otherwise = "absent"
 *
 * Both args are case-insensitive but the returned letters are lowercase.
 */
export function scoreGuess(answer: string, guess: string): ScoredLetter[] {
  const a = answer.toLowerCase();
  const g = guess.toLowerCase();
  if (g.length !== WORD_LENGTH) {
    throw new Error("guess must be 5 letters");
  }
  const result: ScoredLetter[] = Array.from({ length: WORD_LENGTH }, (_, i) => ({
    letter: g[i],
    state: "absent" as LetterState,
  }));

  // First pass: mark exact matches and tally remaining answer letters.
  const remaining: Record<string, number> = {};
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i].state = "correct";
    } else {
      remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
    }
  }

  // Second pass: mark "present" only for non-exact positions that still
  // have remaining capacity in the answer.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i].state === "correct") continue;
    const c = g[i];
    if ((remaining[c] ?? 0) > 0) {
      result[i].state = "present";
      remaining[c]--;
    }
  }

  return result;
}

/**
 * Roll up per-letter states across the whole guess history so the
 * keyboard can show the best-known state for each letter.
 * Priority: correct > present > absent > unknown.
 */
export function letterStates(
  history: ScoredLetter[][],
): Record<string, LetterState> {
  const out: Record<string, LetterState> = {};
  for (const row of history) {
    for (const cell of row) {
      const cur = out[cell.letter];
      if (cur === "correct") continue;
      if (cur === "present" && cell.state !== "correct") continue;
      out[cell.letter] = cell.state;
    }
  }
  return out;
}

/**
 * Hard-mode validator. A guess passes when it uses every previously-
 * revealed clue:
 *   - "correct" letters stay in the same position
 *   - "present" letters must appear somewhere in the new guess
 *     (at least as many times as they've been confirmed)
 *
 * Returns a human-readable reason if the guess fails, or null on pass.
 */
export function hardModeViolation(
  history: ScoredLetter[][],
  guess: string,
): string | null {
  const g = guess.toLowerCase();
  if (g.length !== WORD_LENGTH) return null;
  if (history.length === 0) return null;

  // 1. Position constraints from any "correct" hit.
  for (const row of history) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const cell = row[i];
      if (cell.state === "correct" && g[i] !== cell.letter) {
        return `${ordinal(i + 1)} letter must be ${cell.letter.toUpperCase()}.`;
      }
    }
  }

  // 2. Presence constraints. For each row, for each letter, the count
  // of (correct OR present) appearances in that row is a lower bound
  // on how many times that letter must appear in any subsequent guess.
  // We use the max across all history rows so the constraint never
  // weakens once it's established.
  const required: Record<string, number> = {};
  for (const row of history) {
    const rowCounts: Record<string, number> = {};
    for (const cell of row) {
      if (cell.state === "correct" || cell.state === "present") {
        rowCounts[cell.letter] = (rowCounts[cell.letter] ?? 0) + 1;
      }
    }
    for (const [letter, c] of Object.entries(rowCounts)) {
      if (c > (required[letter] ?? 0)) required[letter] = c;
    }
  }

  const guessCounts: Record<string, number> = {};
  for (const c of g) guessCounts[c] = (guessCounts[c] ?? 0) + 1;
  for (const [letter, need] of Object.entries(required)) {
    if ((guessCounts[letter] ?? 0) < need) {
      return need === 1
        ? `Guess must contain ${letter.toUpperCase()}.`
        : `Guess must contain ${need} ${letter.toUpperCase()}s.`;
    }
  }

  return null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
