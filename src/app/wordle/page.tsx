import Link from "next/link";
import { answerForDate, todayKey } from "@/lib/wordle";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import { getUserWordleStreak } from "@/lib/wordle/actions";
import { Avatar } from "@/components/Avatar";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { WordleGame } from "./WordleGame";

// Compute the daily word at request time, not at build time. Without this
// the route would static-cache with whatever date was current at deploy,
// and every user would get yesterday's word until the next deploy.
export const dynamic = "force-dynamic";

interface WordleRow {
  guesses: number;
  won: boolean;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
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

export default async function WordlePage() {
  const date = todayKey();
  const answer = answerForDate(date);

  const me = await getUser();
  const streak = me ? await getUserWordleStreak(me.id) : null;

  const supabase = await createClient();
  // Top 10 results for today, ranked by win then fewest guesses then time.
  const { data: leaderRows } = await supabase
    .from("wordle_results")
    .select(
      "guesses, won, created_at, profiles:user_id (id, username, display_name, avatar_url)"
    )
    .eq("date", date)
    .order("won", { ascending: false })
    .order("guesses", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(10);
  const leaderboard = (leaderRows ?? []) as unknown as WordleRow[];

  return (
    <main className="flex flex-1 flex-col items-center px-5 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Melio Games
          </Link>
          <span className="text-xs text-ink-faint">{formatLongDate(date)}</span>
        </header>

        <div className="text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">
            Melio{" "}
            <em className="text-brand not-italic font-display italic">
              Wordle
            </em>
          </h1>
          <p className="text-sm text-ink-soft mt-2">
            One five-letter word. Six guesses. Same for everyone today.
          </p>
        </div>

        {/* Streak ribbon (signed-in users) */}
        {streak && (
          <div className="rounded-xl border border-edge bg-paper p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warning-soft to-paper-raised ring-1 ring-edge/60 flex items-center justify-center">
                <FlameIcon
                  size={22}
                  dim={!streak.completedToday && streak.current === 0}
                />
              </div>
              <div>
                <div className="font-display text-xl text-ink tabular-nums leading-tight">
                  {streak.current} {streak.current === 1 ? "day" : "days"}
                </div>
                <div className="text-xs text-ink-soft">
                  current · <span className="text-ink-faint">best {streak.longest}</span>
                </div>
              </div>
            </div>
            {streak.completedToday ? (
              <span className="text-xs text-success font-medium">✓ Today done</span>
            ) : streak.current > 0 ? (
              <span className="text-xs text-ink-soft">
                Solve today to keep it going
              </span>
            ) : (
              <span className="text-xs text-ink-soft">Start a streak</span>
            )}
          </div>
        )}

        <WordleGame answer={answer} date={date} />

        {/* Today's leaderboard */}
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg text-ink">
            Today&rsquo;s leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-ink-soft border border-edge bg-paper rounded-xl p-5 text-center">
              No one has finished today&rsquo;s puzzle yet.{" "}
              {me ? "Be the first." : "Sign in to claim the top spot."}
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {leaderboard.map((row, i) => {
                const rank = i + 1;
                const p = row.profiles;
                if (!p) return null;
                const isMe = me && p.id === me.id;
                const label = p.display_name ?? p.username;
                return (
                  <li
                    key={p.id}
                    className={
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border " +
                      (isMe
                        ? "border-brand bg-brand-soft"
                        : "border-edge bg-paper")
                    }
                  >
                    <div className="w-7 shrink-0 text-center font-mono text-sm text-ink-faint tabular-nums">
                      {rank === 1
                        ? "🥇"
                        : rank === 2
                          ? "🥈"
                          : rank === 3
                            ? "🥉"
                            : `#${rank}`}
                    </div>
                    <Avatar src={p.avatar_url} name={label} size={28} />
                    <Link
                      href={`/sudoku/u/${p.username}`}
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
                      <div
                        className={
                          "font-display text-base tabular-nums " +
                          (row.won ? "text-brand" : "text-ink-faint")
                        }
                      >
                        {row.won ? `${row.guesses}/6` : "X/6"}
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
