import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "@/lib/sudoku";
import { getUserStreak } from "@/lib/daily";
import { EmptyState } from "@/components/EmptyState";
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

  // Best daily score across all completions.
  const { data: dailyRows } = await supabase
    .from("scores")
    .select("score, daily_date")
    .eq("user_id", profile.id)
    .not("daily_date", "is", null)
    .order("score", { ascending: false })
    .limit(1);
  const bestDaily = dailyRows && dailyRows.length > 0 ? dailyRows[0] : null;

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
          <div className="mt-3 flex items-baseline gap-3">
            <h1 className="font-display text-4xl text-ink">
              {profile.display_name ?? profile.username}
            </h1>
            <span className="text-ink-faint">@{profile.username}</span>
          </div>
        </div>

        <Section title="Daily">
          <Link
            href="/sudoku/daily"
            className="group block rounded-xl border border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-soft)] transition-all duration-100 p-4 sm:p-5"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="shrink-0 w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center text-xl">
                🔥
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <div className="font-display text-2xl text-ink tabular-nums leading-tight">
                    {streak.current} {streak.current === 1 ? "day" : "days"}
                  </div>
                  <span className="text-xs text-ink-faint">
                    current streak · best {streak.longest}
                  </span>
                </div>
                <div className="text-sm text-ink-soft mt-0.5">
                  {streak.completedToday ? (
                    <span className="text-success font-medium">
                      ✓ Today done — streak locked in
                    </span>
                  ) : streak.current > 0 ? (
                    "Solve today's puzzle to extend it."
                  ) : (
                    "Start a streak by solving today's puzzle."
                  )}
                </div>
              </div>
              {bestDaily && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
                    Best daily
                  </div>
                  <div className="font-display text-lg text-brand tabular-nums">
                    {bestDaily.score.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </Link>
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
              label="Total time"
              value={fmtTime(
                all.reduce((acc, r) => acc + (r.finish_time_ms ?? 0), 0)
              )}
              mono
            />
          </div>
        </Section>

        <Section title="Best times">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIFFICULTIES.map((d) => (
              <div
                key={d}
                className="p-4 rounded-xl border border-edge bg-paper"
              >
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
                  {DIFFICULTY_LABEL[d]}
                </div>
                <div className="text-lg font-mono tabular-nums text-ink mt-1.5">
                  {bestByDifficulty[d] ? fmtTime(bestByDifficulty[d]) : "—"}
                </div>
              </div>
            ))}
          </div>
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
