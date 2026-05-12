import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import { DIFFICULTY_LABEL, Difficulty, decodeBoard } from "@/lib/sudoku";
import {
  getOrCreateDailyPuzzle,
  getUserDailyScore,
  getUserStreak,
  todayKey,
} from "@/lib/daily";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { DailyGame } from "./DailyGame";

export const metadata: Metadata = {
  title: "Daily Sudoku",
  description:
    "One puzzle a day, the same for everyone. Build a streak. Climb the daily leaderboard.",
  alternates: { canonical: "/sudoku/daily" },
};

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface ScoreRow {
  score: number;
  elapsed_ms: number;
  mistakes: number;
  hints_used: number;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
  } | null;
}

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const friendsOnly = f === "friends";
  const date = await todayKey();
  const dailyPuzzle = await getOrCreateDailyPuzzle(date);
  const me = await getUser();

  const myScore = me ? await getUserDailyScore(me.id, date) : null;
  const streak = me ? await getUserStreak(me.id) : null;

  // Top-10 daily leaderboard, dedupe to best per user (in case the unique
  // index isn't in place yet on older installs).
  const supabase = await createClient();

  let friendsScope: string[] | null = null;
  if (friendsOnly && me) {
    const { data: fr } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", me.id);
    friendsScope = [me.id, ...(fr ?? []).map((r) => r.friend_id as string)];
  }

  let lbQuery = supabase
    .from("scores")
    .select(
      "score, elapsed_ms, mistakes, hints_used, profiles:user_id (id, username, display_name)"
    )
    .eq("daily_date", date)
    .order("score", { ascending: false })
    .limit(50);
  if (friendsScope) {
    lbQuery = lbQuery.in("user_id", friendsScope);
  }
  const { data: leaderboardRaw } = await lbQuery;

  const seen = new Set<string>();
  const leaderboard: ScoreRow[] = [];
  for (const row of (leaderboardRaw ?? []) as unknown as ScoreRow[]) {
    if (!row.profiles) continue;
    if (seen.has(row.profiles.id)) continue;
    seen.add(row.profiles.id);
    leaderboard.push(row);
    if (leaderboard.length >= 10) break;
  }

  const given = decodeBoard(dailyPuzzle.puzzle);
  const solution = decodeBoard(dailyPuzzle.solution);

  return (
    <main className="flex flex-1 justify-center px-5 sm:px-6 py-10 sm:py-12">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div>
          <Link
            href="/sudoku"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Sudoku
          </Link>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-display text-4xl sm:text-5xl text-ink">
              Daily{" "}
              <em className="text-brand not-italic font-display italic">
                Sudoku
              </em>
            </h1>
            <span className="text-sm text-ink-faint">
              {formatLongDate(date)}
            </span>
          </div>
          <p className="text-sm text-ink-soft mt-2">
            One puzzle a day, the same for everyone.{" "}
            <span className="text-ink">
              Today is{" "}
              <strong className="font-medium">
                {DIFFICULTY_LABEL[dailyPuzzle.difficulty as Difficulty]}
              </strong>
            </span>
            . Streaks reset if you miss a day.
          </p>
        </div>

        {/* Streak ribbon */}
        {me && streak && (
          <div className="rounded-xl border border-edge bg-paper p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning-soft to-paper-raised ring-1 ring-edge/60 flex items-center justify-center">
                <FlameIcon size={28} dim={!streak.completedToday && streak.current === 0} />
              </div>
              <div>
                <div className="font-display text-2xl text-ink tabular-nums leading-tight">
                  {streak.current} {streak.current === 1 ? "day" : "days"}
                </div>
                <div className="text-xs text-ink-soft">
                  current streak ·{" "}
                  <span className="text-ink-faint">
                    best {streak.longest}
                  </span>
                </div>
              </div>
            </div>
            {streak.completedToday ? (
              <div className="text-sm text-success font-medium">
                ✓ Today done
              </div>
            ) : streak.current > 0 ? (
              <div className="text-sm text-ink-soft">
                Solve today to extend your streak
              </div>
            ) : (
              <div className="text-sm text-ink-soft">Start a new streak</div>
            )}
          </div>
        )}

        {/* Game (or completed state) */}
        <DailyGame
          given={given}
          solution={solution}
          difficulty={dailyPuzzle.difficulty as Difficulty}
          date={date}
          existingScore={myScore}
          isAuthed={!!me}
        />

        {/* Daily leaderboard */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="font-display text-lg text-ink">
              Today&rsquo;s leaderboard
            </h2>
            <div className="flex items-center gap-2">
              {me && (
                <Link
                  href={
                    friendsOnly
                      ? "/sudoku/daily"
                      : "/sudoku/daily?f=friends"
                  }
                  aria-pressed={friendsOnly}
                  className={
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors duration-75 " +
                    (friendsOnly
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-edge bg-paper text-ink-soft hover:text-ink hover:border-edge-strong")
                  }
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M17 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Friends
                </Link>
              )}
              <Link
                href="/sudoku/leaderboard"
                className="text-xs text-ink-faint hover:text-ink"
              >
                All-time →
              </Link>
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-ink-soft border border-edge bg-paper rounded-xl p-6 text-center">
              {friendsOnly
                ? "None of your friends have finished today yet. Encourage them, or "
                : "No one has finished today yet. "}
              {friendsOnly ? (
                <Link
                  href="/sudoku/daily"
                  className="text-brand hover:underline"
                >
                  see everyone
                </Link>
              ) : me ? (
                "Be the first."
              ) : (
                "Sign in and start the day's puzzle to claim the top spot."
              )}
              {friendsOnly ? "." : ""}
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {leaderboard.map((row, i) => {
                const rank = i + 1;
                const isMe = me && row.profiles?.id === me.id;
                const label =
                  row.profiles?.display_name ??
                  row.profiles?.username ??
                  "—";
                return (
                  <li
                    key={row.profiles?.id ?? i}
                    className={
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl border " +
                      (isMe
                        ? "border-brand bg-brand-soft"
                        : "border-edge bg-paper")
                    }
                  >
                    <div className="w-8 shrink-0 text-center font-mono text-sm text-ink-faint tabular-nums">
                      {rank === 1
                        ? "🥇"
                        : rank === 2
                          ? "🥈"
                          : rank === 3
                            ? "🥉"
                            : `#${rank}`}
                    </div>
                    <Link
                      href={`/sudoku/u/${row.profiles?.username ?? ""}`}
                      className="flex-1 min-w-0 group"
                    >
                      <div className="font-medium text-ink truncate group-hover:text-brand transition-colors duration-75">
                        {label}
                        {isMe && (
                          <span className="text-ink-faint font-normal"> (you)</span>
                        )}
                      </div>
                    </Link>
                    <div className="text-right shrink-0">
                      <div className="font-display text-lg text-brand tabular-nums">
                        {row.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-ink-faint font-mono tabular-nums">
                        {fmtTime(row.elapsed_ms)} · {row.mistakes} ✕
                        {row.hints_used > 0 && ` · ${row.hints_used} 💡`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
