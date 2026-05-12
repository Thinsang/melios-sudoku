"use server";

import { createClient } from "@/lib/supabase/server";
import {
  Difficulty,
  calculateScore,
  encodeBoard,
  generatePuzzle,
} from "@/lib/sudoku";

/**
 * Difficulty by UTC day-of-week. Sunday = hardest; Monday is easy to ease
 * people into the week; Saturday is a hard puzzle for weekend deep dives.
 * Index 0 is Sunday (matching JS Date#getUTCDay).
 */
const DIFFICULTY_BY_DAY: Difficulty[] = [
  "extreme", // Sunday
  "easy",    // Monday
  "medium",  // Tuesday
  "hard",    // Wednesday
  "medium",  // Thursday
  "expert",  // Friday
  "hard",    // Saturday
];

export async function difficultyForDate(dateIso: string): Promise<Difficulty> {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  return DIFFICULTY_BY_DAY[day];
}

/** YYYY-MM-DD in UTC for "today". The daily resets at midnight UTC. */
export async function todayKey(): Promise<string> {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export async function yesterdayKey(): Promise<string> {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Get today's daily puzzle, generating + caching it on first request. */
export async function getOrCreateDailyPuzzle(date: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("daily_puzzles")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (existing) return existing;

  // Generate. Difficulty is deterministic by date.
  const difficulty = await difficultyForDate(date);
  const p = generatePuzzle(difficulty);

  // Insert. RLS only allows today / yesterday / tomorrow inserts. Race-safe
  // via PK on date — second writer's insert no-ops and we re-read.
  await supabase.from("daily_puzzles").insert({
    date,
    difficulty,
    puzzle: encodeBoard(p.given),
    solution: encodeBoard(p.solution),
  });

  const { data: final } = await supabase
    .from("daily_puzzles")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  return final ?? {
    date,
    difficulty,
    puzzle: encodeBoard(p.given),
    solution: encodeBoard(p.solution),
    created_at: new Date().toISOString(),
  };
}

/**
 * Record the caller's completion of a daily puzzle. If they've already
 * finished today, update only if the new score is strictly better
 * (so users can replay to push their leaderboard rank).
 */
export interface DailyCompletionResult {
  score: number;
  saved: boolean;
  improved: boolean;
}

export async function recordDailyCompletion(payload: {
  date: string;
  difficulty: Difficulty;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
}): Promise<DailyCompletionResult> {
  const { date, difficulty, elapsedMs, mistakes, hintsUsed } = payload;
  const score = calculateScore(difficulty, elapsedMs, mistakes, hintsUsed);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { score, saved: false, improved: false };

  const { data: existing } = await supabase
    .from("scores")
    .select("id, score")
    .eq("user_id", user.id)
    .eq("daily_date", date)
    .maybeSingle();

  if (existing) {
    if (score > existing.score) {
      await supabase
        .from("scores")
        .update({
          score,
          elapsed_ms: elapsedMs,
          mistakes,
          hints_used: hintsUsed,
        })
        .eq("id", existing.id);
      return { score, saved: true, improved: true };
    }
    return { score, saved: true, improved: false };
  }

  await supabase.from("scores").insert({
    user_id: user.id,
    difficulty,
    mode: "solo",
    score,
    elapsed_ms: elapsedMs,
    mistakes,
    hints_used: hintsUsed,
    daily_date: date,
  });

  return { score, saved: true, improved: true };
}

export interface StreakInfo {
  current: number;
  longest: number;
  completedToday: boolean;
}

/**
 * Compute the user's current + longest daily streak by walking their
 * `scores.daily_date` history. Current streak = consecutive days ending
 * today (or yesterday if today isn't completed yet — grace period).
 */
export async function getUserStreak(userId: string): Promise<StreakInfo> {
  const supabase = await createClient();
  const today = await todayKey();
  const yesterday = await yesterdayKey();

  const { data } = await supabase
    .from("scores")
    .select("daily_date")
    .eq("user_id", userId)
    .not("daily_date", "is", null)
    .order("daily_date", { ascending: false });

  const dates = new Set<string>(
    (data ?? []).map((r) => r.daily_date as string)
  );
  const completedToday = dates.has(today);

  // Current streak — walk backwards from today (or yesterday if today
  // isn't done yet — gives users until midnight to keep their streak).
  let current = 0;
  let cursor: string | null = null;
  if (dates.has(today)) cursor = today;
  else if (dates.has(yesterday)) cursor = yesterday;
  while (cursor && dates.has(cursor)) {
    current++;
    const d = new Date(`${cursor}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }

  // Longest streak — walk all completion dates in ascending order.
  const sorted = Array.from(dates).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of sorted) {
    if (prev) {
      const diff =
        (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${prev}T00:00:00Z`)) /
        86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = date;
  }

  return { current, longest, completedToday };
}

/** Fetch the current user's existing daily score for `date`, if any. */
export async function getUserDailyScore(userId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scores")
    .select("score, elapsed_ms, mistakes, hints_used, created_at")
    .eq("user_id", userId)
    .eq("daily_date", date)
    .maybeSingle();
  return data;
}
