import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTIES, DIFFICULTY_LABEL, Difficulty } from "@/lib/sudoku";
import { Avatar } from "@/components/Avatar";
import { getUserStreak } from "@/lib/daily";
import { getUserWordleStreak } from "@/lib/wordle/actions";
import { getUserAchievements } from "@/lib/achievements";
import { AchievementsGrid } from "@/components/AchievementsGrid";
import { ChallengeButton } from "./ChallengeButton";

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${m}:${pad(sec)}`;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, created_at")
    .ilike("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const me = await getUser();
  const isMe = me?.id === profile.id;

  let relation: "self" | "none" | "friends" | "pending_in" | "pending_out" = "none";
  if (isMe) {
    relation = "self";
  } else if (me) {
    const [friend, sent, received] = await Promise.all([
      supabase
        .from("friendships")
        .select("user_id")
        .eq("user_id", me.id)
        .eq("friend_id", profile.id)
        .maybeSingle(),
      supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user", me.id)
        .eq("to_user", profile.id)
        .eq("status", "pending")
        .maybeSingle(),
      supabase
        .from("friend_requests")
        .select("id")
        .eq("from_user", profile.id)
        .eq("to_user", me.id)
        .eq("status", "pending")
        .maybeSingle(),
    ]);
    if (friend.data) relation = "friends";
    else if (sent.data) relation = "pending_out";
    else if (received.data) relation = "pending_in";
  }

  // Public-ish stats: total games + best times by difficulty.
  const { data: rows } = await supabase
    .from("game_players")
    .select("finished_at, finish_time_ms, games (difficulty)")
    .eq("user_id", profile.id)
    .not("finished_at", "is", null)
    .limit(500);

  type Row = {
    finished_at: string | null;
    finish_time_ms: number | null;
    games: { difficulty: string } | null;
  };
  const completed = ((rows ?? []) as unknown as Row[]).filter(Boolean);

  const bestByDifficulty: Record<string, number> = {};
  for (const r of completed) {
    if (!r.games || !r.finish_time_ms) continue;
    const d = r.games.difficulty;
    if (!(d in bestByDifficulty) || r.finish_time_ms < bestByDifficulty[d]) {
      bestByDifficulty[d] = r.finish_time_ms;
    }
  }

  // Best score per difficulty (public — uses scores table).
  const { data: scoreRows } = await supabase
    .from("scores")
    .select("difficulty, score")
    .eq("user_id", profile.id);
  const bestScoreByDifficulty: Record<string, number> = {};
  for (const r of scoreRows ?? []) {
    const d = r.difficulty as string;
    if (
      !(d in bestScoreByDifficulty) ||
      r.score > bestScoreByDifficulty[d]
    ) {
      bestScoreByDifficulty[d] = r.score;
    }
  }

  // Streaks across both games — public stats.
  const [sudokuStreak, wordleStreak] = await Promise.all([
    getUserStreak(profile.id),
    getUserWordleStreak(profile.id),
  ]);

  // Best daily sudoku score
  const { data: bestDailyRows } = await supabase
    .from("scores")
    .select("score")
    .eq("user_id", profile.id)
    .not("daily_date", "is", null)
    .order("score", { ascending: false })
    .limit(1);
  const bestDailyScore = bestDailyRows?.[0]?.score ?? null;

  // Wordle aggregate
  const { data: wordleRows } = await supabase
    .from("wordle_results")
    .select("won")
    .eq("user_id", profile.id);
  const wordlePlayed = wordleRows?.length ?? 0;
  const wordleWins = (wordleRows ?? []).filter((r) => r.won).length;

  // Achievements
  const achievements = await getUserAchievements(profile.id);
  const anyUnlocked = achievements.some((a) => a.unlocked);

  return (
    <main className="flex flex-1 justify-center px-5 sm:px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-10">
        <div>
          <Link
            href="/sudoku"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Home
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name ?? profile.username}
              size={56}
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-4xl text-ink leading-tight">
                {profile.display_name ?? profile.username}
              </h1>
              <span className="text-ink-faint">@{profile.username}</span>
            </div>
          </div>
          {!isMe && me && (
            <div className="mt-4 flex flex-wrap gap-2">
              {relation === "friends" ? (
                <ChallengeButton friendId={profile.id} />
              ) : relation === "pending_out" ? (
                <span className="px-3 py-1.5 rounded-md text-sm text-ink-soft bg-paper-raised border border-edge">
                  Friend request sent
                </span>
              ) : relation === "pending_in" ? (
                <Link
                  href="/sudoku/friends"
                  className="px-3.5 py-1.5 rounded-md bg-success hover:opacity-90 text-canvas text-sm font-medium transition-colors duration-75"
                >
                  Respond to request
                </Link>
              ) : (
                <AddFriendInline username={profile.username} />
              )}
            </div>
          )}
        </div>

        {/* Streak badges — only shown if there's any streak history */}
        {(sudokuStreak.longest > 0 || wordleStreak.longest > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-edge bg-paper p-4 flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-warning-soft text-warning flex items-center justify-center text-lg">
                🔥
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
                  Sudoku streak
                </div>
                <div className="font-display text-lg text-ink tabular-nums">
                  {sudokuStreak.current}
                  <span className="text-sm text-ink-soft font-sans font-normal">
                    {" "}· best {sudokuStreak.longest}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-paper p-4 flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-warning-soft text-warning flex items-center justify-center text-lg">
                🔥
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
                  Wordle streak
                </div>
                <div className="font-display text-lg text-ink tabular-nums">
                  {wordleStreak.current}
                  <span className="text-sm text-ink-soft font-sans font-normal">
                    {" "}· best {wordleStreak.longest}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-lg text-ink mb-3.5">
            By difficulty
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {DIFFICULTIES.map((d) => (
              <div
                key={d}
                className="p-4 rounded-xl border border-edge bg-paper"
              >
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: `var(--diff-${d})` }}
                    aria-hidden
                  />
                  {DIFFICULTY_LABEL[d as Difficulty]}
                </div>
                <div className="text-lg font-mono tabular-nums text-ink mt-1.5">
                  {bestByDifficulty[d] ? fmtTime(bestByDifficulty[d]) : "—"}
                </div>
                <div className="text-xs text-ink-soft mt-0.5 tabular-nums">
                  {bestScoreByDifficulty[d]
                    ? `${bestScoreByDifficulty[d].toLocaleString()} pts`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {anyUnlocked && (
          <section>
            <h2 className="font-display text-lg text-ink mb-3.5">
              Achievements
            </h2>
            <AchievementsGrid progress={achievements} />
          </section>
        )}

        <section className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-faint">
          <span>
            <span className="text-ink font-medium tabular-nums">
              {completed.length}
            </span>{" "}
            sudoku{completed.length === 1 ? "" : "s"} solved
          </span>
          {bestDailyScore != null && (
            <span>
              Best daily score{" "}
              <span className="text-brand font-medium tabular-nums">
                {bestDailyScore.toLocaleString()}
              </span>
            </span>
          )}
          {wordlePlayed > 0 && (
            <span>
              <span className="text-ink font-medium tabular-nums">
                {wordleWins}
              </span>
              /{wordlePlayed} wordles solved
            </span>
          )}
        </section>
      </div>
    </main>
  );
}

function AddFriendInline({ username }: { username: string }) {
  return (
    <Link
      href={`/sudoku/friends?prefill=${encodeURIComponent(username)}`}
      className="px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
    >
      Add friend
    </Link>
  );
}
