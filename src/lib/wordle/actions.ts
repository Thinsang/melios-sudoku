"use server";

import { createClient } from "@/lib/supabase/server";

export interface WordleRecordResult {
  saved: boolean;
  improved: boolean;
  best: { guesses: number; won: boolean } | null;
}

/**
 * Record the caller's Wordle completion for `date`. If they already have
 * a row, we update only if the new attempt is *strictly better*:
 *   - A win always beats a loss
 *   - Fewer guesses beats more (when both won)
 * Mirrors the sudoku daily "save-best-only" semantics.
 */
export async function recordWordleCompletion(payload: {
  date: string;
  guesses: number;
  won: boolean;
}): Promise<WordleRecordResult> {
  const { date, guesses, won } = payload;
  if (guesses < 1 || guesses > 6) {
    return { saved: false, improved: false, best: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false, improved: false, best: null };

  const { data: existing } = await supabase
    .from("wordle_results")
    .select("id, guesses, won")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    // Strictly-better check
    const better =
      (won && !existing.won) || (won === existing.won && guesses < existing.guesses);
    if (!better) {
      return {
        saved: true,
        improved: false,
        best: { guesses: existing.guesses, won: existing.won },
      };
    }
    await supabase
      .from("wordle_results")
      .update({ guesses, won })
      .eq("id", existing.id);
    return { saved: true, improved: true, best: { guesses, won } };
  }

  await supabase.from("wordle_results").insert({
    user_id: user.id,
    date,
    guesses,
    won,
  });
  return { saved: true, improved: true, best: { guesses, won } };
}

/** Fetch the caller's existing Wordle result for `date`, if any. */
export async function getMyWordleResult(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("wordle_results")
    .select("guesses, won, created_at")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();
  return data;
}

export interface WordleStreak {
  current: number;
  longest: number;
  completedToday: boolean;
}

/**
 * Walk wordle_results.date for `userId` to compute current + longest
 * winning streak. A "streak day" is a *won* result; a loss breaks the
 * streak. Mirrors the sudoku streak math.
 */
export async function getUserWordleStreak(
  userId: string,
): Promise<WordleStreak> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("wordle_results")
    .select("date, won")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  const rows = (data ?? []) as Array<{ date: string; won: boolean }>;
  const wonByDate = new Map<string, boolean>();
  for (const r of rows) wonByDate.set(r.date, r.won);
  const completedToday = wonByDate.get(today) === true;

  // Current streak — walk backwards from today (or yesterday for grace).
  let current = 0;
  let cursor: string | null = null;
  if (wonByDate.get(today) === true) cursor = today;
  else if (wonByDate.get(yest) === true) cursor = yest;
  while (cursor && wonByDate.get(cursor) === true) {
    current++;
    const d = new Date(`${cursor}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }

  // Longest streak — walk dates ascending, counting consecutive wins.
  const sorted = [...wonByDate.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const [date, won] of sorted) {
    if (!won) {
      run = 0;
      prev = date;
      continue;
    }
    if (prev) {
      const diff =
        (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${prev}T00:00:00Z`)) /
        86_400_000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = date;
  }

  return { current, longest, completedToday };
}
