import { createClient } from "@/lib/supabase/server";
import { getUserStreak } from "@/lib/daily";
import { getUserWordleStreak } from "@/lib/wordle/actions";

/**
 * Achievement system — derived state, no new DB tables. Each badge is
 * computed by looking at the existing scores / wordle_results / friends /
 * profile rows for a given user.
 *
 * Add a new achievement by:
 *   1. Append a definition to ACHIEVEMENTS below.
 *   2. Add a corresponding `case "your-id":` to evaluateAchievement.
 */

export interface AchievementDef {
  id: string;
  /** Short label shown under the badge. */
  name: string;
  /** Sentence shown on hover/expansion. */
  description: string;
  /** Single-character glyph or short emoji. */
  glyph: string;
  /** Tiered? When tiered, the badge displays a `progress / target`. */
  target?: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: "welcome",
    name: "Welcome",
    description: "Signed up to Melio Games.",
    glyph: "👋",
  },
  {
    id: "first-solve",
    name: "First solve",
    description: "Complete your first sudoku puzzle.",
    glyph: "🎯",
  },
  {
    id: "quintet",
    name: "All five",
    description: "Solve at least one puzzle at every difficulty.",
    glyph: "🖐",
    target: 5,
  },
  {
    id: "speed-demon",
    name: "Speed demon",
    description: "Finish an Easy puzzle in under 3 minutes.",
    glyph: "⚡",
  },
  {
    id: "high-score-1k",
    name: "Four digits",
    description: "Earn a 1,000+ score on any difficulty.",
    glyph: "🏅",
  },
  {
    id: "high-score-5k",
    name: "Five thousand",
    description: "Earn a 5,000+ score on any difficulty.",
    glyph: "💎",
  },
  {
    id: "total-points-10k",
    name: "Ten K club",
    description: "Earn 10,000 total points across all games.",
    glyph: "💰",
    target: 10_000,
  },
  {
    id: "dedicated-7",
    name: "Dedicated",
    description: "Keep a 7-day Sudoku daily streak.",
    glyph: "📅",
    target: 7,
  },
  {
    id: "ironwill-30",
    name: "Iron will",
    description: "Keep a 30-day Sudoku daily streak.",
    glyph: "🪨",
    target: 30,
  },
  {
    id: "wordnerd-7",
    name: "Word nerd",
    description: "Keep a 7-day Wordle streak.",
    glyph: "📖",
    target: 7,
  },
  {
    id: "wordle-genius",
    name: "Genius",
    description: "Solve a Wordle in 2 guesses or fewer.",
    glyph: "🧠",
  },
  {
    id: "first-friend",
    name: "Friend",
    description: "Add your first friend.",
    glyph: "🤝",
  },
] as const;

export interface AchievementProgress {
  id: string;
  unlocked: boolean;
  /** Current value for tiered achievements; undefined for binary ones. */
  current?: number;
  /** Target value for tiered achievements. */
  target?: number;
}

/**
 * Compute every achievement's unlocked status + progress for `userId`.
 * Runs one round-trip per achievement category (scores, wordle, friends),
 * then a couple of cheap reductions.
 */
export async function getUserAchievements(
  userId: string,
): Promise<AchievementProgress[]> {
  const supabase = await createClient();

  const [scoresRes, wordleRes, friendsRes, gamesRes, sudokuStreak, wordleStreak] =
    await Promise.all([
      supabase
        .from("scores")
        .select("score, difficulty, elapsed_ms")
        .eq("user_id", userId),
      supabase
        .from("wordle_results")
        .select("guesses, won")
        .eq("user_id", userId),
      supabase
        .from("friendships")
        .select("friend_id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("game_players")
        .select("finished_at, finish_time_ms, games (difficulty)")
        .eq("user_id", userId)
        .not("finished_at", "is", null),
      getUserStreak(userId),
      getUserWordleStreak(userId),
    ]);

  const scores = scoresRes.data ?? [];
  const wordle = wordleRes.data ?? [];
  const friendCount = friendsRes.count ?? 0;
  type GameRow = {
    finished_at: string | null;
    finish_time_ms: number | null;
    games: { difficulty: string } | null;
  };
  const games = (gamesRes.data ?? []) as unknown as GameRow[];

  // Derived rollups
  const totalPoints = scores.reduce((s, r) => s + (r.score ?? 0), 0);
  const maxScore = scores.reduce(
    (m, r) => ((r.score ?? 0) > m ? (r.score ?? 0) : m),
    0,
  );
  const difficultiesSeen = new Set(
    games.map((g) => g.games?.difficulty).filter(Boolean) as string[],
  );
  const easyFastestMs = games
    .filter((g) => g.games?.difficulty === "easy" && g.finish_time_ms)
    .reduce(
      (m, g) =>
        m === null || (g.finish_time_ms ?? Infinity) < m
          ? g.finish_time_ms ?? null
          : m,
      null as number | null,
    );
  const bestWordleGuesses = wordle
    .filter((w) => w.won)
    .reduce(
      (m, w) => (m === null || w.guesses < m ? w.guesses : m),
      null as number | null,
    );

  return ACHIEVEMENTS.map((a): AchievementProgress => {
    switch (a.id) {
      case "welcome":
        return { id: a.id, unlocked: true };
      case "first-solve":
        return { id: a.id, unlocked: games.length > 0 };
      case "quintet": {
        return {
          id: a.id,
          unlocked: difficultiesSeen.size >= 5,
          current: difficultiesSeen.size,
          target: 5,
        };
      }
      case "speed-demon":
        return {
          id: a.id,
          unlocked: easyFastestMs !== null && easyFastestMs < 3 * 60_000,
        };
      case "high-score-1k":
        return { id: a.id, unlocked: maxScore >= 1_000 };
      case "high-score-5k":
        return { id: a.id, unlocked: maxScore >= 5_000 };
      case "total-points-10k":
        return {
          id: a.id,
          unlocked: totalPoints >= 10_000,
          current: Math.min(totalPoints, 99_999),
          target: 10_000,
        };
      case "dedicated-7":
        return {
          id: a.id,
          unlocked: sudokuStreak.longest >= 7,
          current: sudokuStreak.longest,
          target: 7,
        };
      case "ironwill-30":
        return {
          id: a.id,
          unlocked: sudokuStreak.longest >= 30,
          current: sudokuStreak.longest,
          target: 30,
        };
      case "wordnerd-7":
        return {
          id: a.id,
          unlocked: wordleStreak.longest >= 7,
          current: wordleStreak.longest,
          target: 7,
        };
      case "wordle-genius":
        return {
          id: a.id,
          unlocked: bestWordleGuesses !== null && bestWordleGuesses <= 2,
        };
      case "first-friend":
        return { id: a.id, unlocked: friendCount > 0 };
      default:
        return { id: a.id, unlocked: false };
    }
  });
}
