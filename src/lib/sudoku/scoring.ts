import { Difficulty } from "./types";

/**
 * Score formula — designed to feel like sudoku.com but with simpler tuning.
 *
 *   score = round( base * timeFactor * mistakeFactor * hintFactor )
 *
 * `base`         : how much a perfect-pace, no-mistake solve at this
 *                  difficulty is worth.
 * `timeFactor`   : `target / elapsed`, clamped to [0.3, 3.0]. Solving in
 *                  half the target gives ~2x; taking twice as long gives ~0.5x.
 * `mistakeFactor`: -10% per mistake, floored at 10% (so 9+ mistakes is still
 *                  worth something).
 * `hintFactor`   : -15% per hint used, floored at 30%.
 *
 * The result is always >= 0. Tweak the constants below to retune.
 */

const DIFFICULTY_BASE: Record<Difficulty, number> = {
  easy: 100,
  medium: 250,
  hard: 500,
  expert: 1000,
  extreme: 2000,
};

/** Target ("on-pace") solve time per difficulty. */
const DIFFICULTY_TARGET_MS: Record<Difficulty, number> = {
  easy: 5 * 60_000,
  medium: 10 * 60_000,
  hard: 20 * 60_000,
  expert: 30 * 60_000,
  extreme: 50 * 60_000,
};

const MISTAKE_REDUCTION_PER = 0.1;
const MISTAKE_FACTOR_FLOOR = 0.1;
const HINT_REDUCTION_PER = 0.15;
const HINT_FACTOR_FLOOR = 0.3;
const TIME_FACTOR_MIN = 0.3;
const TIME_FACTOR_MAX = 3.0;

export interface ScoreBreakdown {
  base: number;
  timeFactor: number;
  mistakeFactor: number;
  hintFactor: number;
  total: number;
}

export function calculateScore(
  difficulty: Difficulty,
  elapsedMs: number,
  mistakes: number,
  hintsUsed: number
): number {
  return scoreBreakdown(difficulty, elapsedMs, mistakes, hintsUsed).total;
}

export function scoreBreakdown(
  difficulty: Difficulty,
  elapsedMs: number,
  mistakes: number,
  hintsUsed: number
): ScoreBreakdown {
  const base = DIFFICULTY_BASE[difficulty];
  const targetMs = DIFFICULTY_TARGET_MS[difficulty];

  // Guard against zero/negative elapsed values (very fast paste, clock skew).
  const safeElapsed = Math.max(elapsedMs, 1000);

  const rawTimeFactor = targetMs / safeElapsed;
  const timeFactor = clamp(rawTimeFactor, TIME_FACTOR_MIN, TIME_FACTOR_MAX);

  const mistakeFactor = Math.max(
    MISTAKE_FACTOR_FLOOR,
    1 - mistakes * MISTAKE_REDUCTION_PER
  );
  const hintFactor = Math.max(
    HINT_FACTOR_FLOOR,
    1 - hintsUsed * HINT_REDUCTION_PER
  );

  const total = Math.max(
    0,
    Math.round(base * timeFactor * mistakeFactor * hintFactor)
  );

  return { base, timeFactor, mistakeFactor, hintFactor, total };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
