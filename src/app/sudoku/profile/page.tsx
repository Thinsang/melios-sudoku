import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTIES, DIFFICULTY_LABEL, Difficulty } from "@/lib/sudoku";
import { getUserStreak } from "@/lib/daily";
import { getUserWordleStreak } from "@/lib/wordle/actions";
import { getUserAchievements } from "@/lib/achievements";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { AchievementsGrid } from "@/components/AchievementsGrid";
import { ProfileEndGameButton } from "./ProfileEndGameButton";

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sudoku/auth/sign-in?next=/sudoku/profile");

  const supabase = await createClient();

  const streak = await getUserStreak(profile.id);
  const wordleStreak = await getUserWordleStreak(profile.id);
  const achievements = await getUserAchievements(profile.id);

  // Best daily score across all completions.
  const { data: dailyRows } = await supabase
    .from("scores")
    .select("score, daily_date")
    .eq("user_id", profile.id)
    .not("daily_date", "is", null)
    .order("score", { ascending: false })
    .limit(1);
  const bestDaily = dailyRows && dailyRows.length > 0 ? dailyRows[0] : null;

  // Best score and total points per difficulty.
  const { data: allScores } = await supabase
    .from("scores")
    .select("difficulty, score")
    .eq("user_id", profile.id);
  const bestScoreByDifficulty: Record<string, number> = {};
  let totalPoints = 0;
  let totalScoredGames = 0;
  for (const row of allScores ?? []) {
    const d = row.difficulty as string;
    totalPoints += row.score;
    totalScoredGames++;
    if (!(d in bestScoreByDifficulty) || row.score > bestScoreByDifficulty[d]) {
      bestScoreByDifficulty[d] = row.score;
    }
  }

  // Wordle: total played, wins, distribution
  const { data: wordleRows } = await supabase
    .from("wordle_results")
    .select("guesses, won")
    .eq("user_id", profile.id);
  const wordleStats = {
    played: wordleRows?.length ?? 0,
    wins: (wordleRows ?? []).filter((r) => r.won).length,
    distribution: [0, 0, 0, 0, 0, 0],
  };
  for (const r of wordleRows ?? []) {
    if (r.won && r.guesses >= 1 && r.guesses <= 6) {
      wordleStats.distribution[r.guesses - 1]++;
    }
  }
  const wordleMaxDist = Math.max(1, ...wordleStats.distribution);

  const { data: rows } = await supabase
    .from("game_players")
    .select(
      "finished_at, finish_time_ms, mistakes, joined_at, games (id, mode, difficulty, status, completed_at)"
    )
    .eq("user_id", profile.id)
    .order("joined_at", { ascending: false })
    .limit(200);

  type Row = {
    finished_at: string | null;
    finish_time_ms: number | null;
    mistakes: number;
    joined_at: string;
    games: {
      id: string;
      mode: string;
      difficulty: string;
      status: string;
      completed_at: string | null;
    } | null;
  };

  const all = (rows ?? []) as Row[];
  const total = all.length;
  const completed = all.filter((r) => r.finished_at).length;

  const bestByDifficulty: Record<string, number> = {};
  for (const r of all) {
    if (!r.finished_at || !r.finish_time_ms || !r.games) continue;
    const d = r.games.difficulty;
    if (!(d in bestByDifficulty) || r.finish_time_ms < bestByDifficulty[d]) {
      bestByDifficulty[d] = r.finish_time_ms;
    }
  }

  const recent = all.slice(0, 8);

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
        </div>

        <Section title="Daily streaks">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StreakCard
              href="/sudoku/daily"
              title="Sudoku"
              current={streak.current}
              longest={streak.longest}
              completedToday={streak.completedToday}
              bestScore={bestDaily?.score ?? null}
            />
            <StreakCard
              href="/wordle"
              title="Wordle"
              current={wordleStreak.current}
              longest={wordleStreak.longest}
              completedToday={wordleStreak.completedToday}
              bestScore={null}
            />
          </div>
        </Section>

        <Section title="Stats">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Played" value={total.toString()} />
            <Stat label="Completed" value={completed.toString()} />
            <Stat
              label="Win rate"
              value={total === 0 ? "—" : `${Math.round((completed / total) * 100)}%`}
            />
            <Stat
              label="Total points"
              value={
                totalScoredGames > 0 ? totalPoints.toLocaleString() : "—"
              }
              mono
            />
          </div>
        </Section>

        <Section title="By difficulty">
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
        </Section>

        {/* Wordle distribution — only shown when the user has any wordle history */}
        {wordleStats.played > 0 && (
          <Section title="Wordle guesses">
            <div className="rounded-xl border border-edge bg-paper p-4 sm:p-5">
              <div className="text-xs text-ink-soft mb-3">
                {wordleStats.wins} / {wordleStats.played} solved ·{" "}
                <span className="text-ink">
                  {Math.round((wordleStats.wins / wordleStats.played) * 100)}%
                </span>{" "}
                win rate
              </div>
              <div className="flex flex-col gap-1.5">
                {wordleStats.distribution.map((count, i) => {
                  const pct = (count / wordleMaxDist) * 100;
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 text-ink-faint font-mono tabular-nums shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 h-5 rounded bg-paper-raised relative overflow-hidden">
                        <div
                          className={
                            "h-full rounded transition-all duration-300 " +
                            (count > 0 ? "bg-brand" : "bg-paper-raised")
                          }
                          style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                        />
                        {count > 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-brand-ink tabular-nums">
                            {count}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>
        )}

        <Section title="Achievements">
          <AchievementsGrid progress={achievements} />
        </Section>

        <Section title="Recent games">
          {recent.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
              }
              title="No games yet"
              description="Pick a difficulty or jump into today's daily puzzle — your finished games show up here."
              action={{ label: "Play sudoku", href: "/sudoku" }}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((r) => {
                if (!r.games) return null;
                const finished = Boolean(r.finished_at);
                return (
                  <li
                    key={r.games.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-edge bg-paper"
                  >
                    <div>
                      <div className="font-medium text-ink capitalize">
                        {r.games.mode} ·{" "}
                        {DIFFICULTY_LABEL[
                          r.games.difficulty as keyof typeof DIFFICULTY_LABEL
                        ]}
                      </div>
                      <div className="text-sm text-ink-soft">
                        {finished
                          ? `${fmtTime(r.finish_time_ms ?? 0)} · ${r.mistakes} mistake${
                              r.mistakes === 1 ? "" : "s"
                            }`
                          : r.games.status === "active"
                            ? "In progress"
                            : "Abandoned"}
                      </div>
                    </div>
                    {!finished && r.games.status === "active" && (
                      <div className="flex items-center gap-2">
                        <ProfileEndGameButton gameId={r.games.id} />
                        <Link
                          href={`/sudoku/play/${r.games.id}`}
                          className="px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
                        >
                          Resume
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-ink mb-3.5">{title}</h2>
      {children}
    </section>
  );
}

function StreakCard({
  title,
  href,
  current,
  longest,
  completedToday,
  bestScore,
}: {
  title: string;
  href: string;
  current: number;
  longest: number;
  completedToday: boolean;
  bestScore: number | null;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-soft)] transition-all duration-100 p-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg " +
            (completedToday
              ? "bg-success/15 text-success"
              : "bg-warning-soft text-warning")
          }
        >
          {completedToday ? "✓" : "🔥"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
            {title}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-xl text-ink tabular-nums leading-none">
              {current}
            </span>
            <span className="text-xs text-ink-soft">
              {current === 1 ? "day" : "days"} · best {longest}
            </span>
          </div>
        </div>
        {bestScore != null && (
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-[0.12em] text-ink-faint font-medium">
              Best
            </div>
            <div className="font-display text-base text-brand tabular-nums">
              {bestScore.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl border border-edge bg-paper">
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
        {label}
      </div>
      <div
        className={`text-lg font-semibold text-ink mt-1.5 ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
