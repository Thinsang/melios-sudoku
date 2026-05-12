import Link from "next/link";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/server";
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  Difficulty,
} from "@/lib/sudoku";

const DIFFICULTY_TOKEN: Record<Difficulty, string> = {
  easy: "diff-easy",
  medium: "diff-medium",
  hard: "diff-hard",
  expert: "diff-expert",
  extreme: "diff-extreme",
};

const MODE_LABEL: Record<string, string> = {
  solo: "Solo",
  coop: "Co-op",
  race: "Race",
};

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

interface ScoreRow {
  id: string;
  user_id: string;
  score: number;
  elapsed_ms: number;
  mistakes: number;
  hints_used: number;
  mode: string;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
  } | null;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const difficulty: Difficulty = (DIFFICULTIES as readonly string[]).includes(
    d ?? ""
  )
    ? (d as Difficulty)
    : "medium";

  const supabase = await createClient();
  const me = await getUser();

  // Pull more than 20 so we can dedupe to best-per-user without missing rows.
  const { data } = await supabase
    .from("scores")
    .select(
      "id, user_id, score, elapsed_ms, mistakes, hints_used, mode, created_at, profiles:user_id (id, username, display_name)"
    )
    .eq("difficulty", difficulty)
    .order("score", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as ScoreRow[];

  // Dedupe to best score per user.
  const seen = new Set<string>();
  const top: ScoreRow[] = [];
  for (const row of rows) {
    if (!row.profiles) continue;
    if (seen.has(row.profiles.id)) continue;
    seen.add(row.profiles.id);
    top.push(row);
    if (top.length >= 20) break;
  }

  // My best at this difficulty (so I can see myself even if outside top 20).
  let myBest: ScoreRow | null = null;
  let myRank: number | null = null;
  if (me) {
    const idx = top.findIndex((r) => r.profiles?.id === me.id);
    if (idx >= 0) {
      myBest = top[idx];
      myRank = idx + 1;
    } else {
      // Count how many users have a higher score than mine — that's the rank.
      const { data: mine } = await supabase
        .from("scores")
        .select(
          "id, user_id, score, elapsed_ms, mistakes, hints_used, mode, created_at, profiles:user_id (id, username, display_name)"
        )
        .eq("difficulty", difficulty)
        .eq("user_id", me.id)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mine) {
        myBest = mine as unknown as ScoreRow;
        // Rank = 1 + count of distinct users with strictly higher best score.
        // Approximate via the same top-200 dedupe + a count fallback.
        const { count: betterCount } = await supabase
          .from("scores")
          .select("user_id", { count: "exact", head: true })
          .eq("difficulty", difficulty)
          .gt("score", myBest.score);
        myRank = (betterCount ?? 0) + 1;
      }
    }
  }

  return (
    <main className="flex flex-1 justify-center px-5 sm:px-6 py-10">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div>
          <Link
            href="/"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Home
          </Link>
          <h1 className="font-display text-4xl text-ink mt-3">Leaderboard</h1>
          <p className="text-sm text-ink-soft mt-1">
            Best score per player at each difficulty. Score blends time,
            mistakes, and hints — see how it&rsquo;s computed below.
          </p>
        </div>

        {/* Difficulty tabs */}
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => (
            <Link
              key={diff}
              href={`/sudoku/leaderboard?d=${diff}`}
              className={clsx(
                "relative px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-75 overflow-hidden",
                diff === difficulty
                  ? "border-brand bg-brand-soft text-ink"
                  : "border-edge bg-paper text-ink-soft hover:text-ink hover:border-edge-strong"
              )}
            >
              <span
                className="absolute left-0 top-0 h-full w-0.5"
                style={{ backgroundColor: `var(--${DIFFICULTY_TOKEN[diff]})` }}
              />
              <span className="pl-1.5">{DIFFICULTY_LABEL[diff]}</span>
            </Link>
          ))}
        </div>

        {/* My best (when outside top 20) */}
        {me && myBest && myRank && myRank > 20 && (
          <div className="rounded-xl border border-brand/40 bg-brand-soft p-4">
            <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium mb-1">
              Your best at {DIFFICULTY_LABEL[difficulty]}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-ink tabular-nums">
                {myBest.score.toLocaleString()}
              </span>
              <span className="text-sm text-ink-soft">
                rank #{myRank} · {fmtTime(myBest.elapsed_ms)} ·{" "}
                {myBest.mistakes} mistake{myBest.mistakes === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        )}

        {/* Top scores */}
        {top.length === 0 ? (
          <div className="rounded-xl border border-edge bg-paper p-8 text-center">
            <p className="text-sm text-ink-soft">
              No scores yet at {DIFFICULTY_LABEL[difficulty]}.{" "}
              <Link
                href={`/sudoku/play?d=${difficulty}`}
                className="text-brand hover:underline"
              >
                Be the first.
              </Link>
            </p>
          </div>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {top.map((row, i) => {
              const rank = i + 1;
              const isMe = me && row.profiles?.id === me.id;
              const label = row.profiles?.display_name ?? row.profiles?.username ?? "—";
              return (
                <li
                  key={row.id}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-75",
                    isMe
                      ? "border-brand bg-brand-soft"
                      : "border-edge bg-paper"
                  )}
                >
                  <div
                    className={clsx(
                      "w-8 shrink-0 text-center font-mono tabular-nums text-sm",
                      rank === 1
                        ? "text-warning font-semibold"
                        : rank <= 3
                          ? "text-ink font-semibold"
                          : "text-ink-faint"
                    )}
                  >
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
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
                    <div className="text-xs text-ink-faint">
                      @{row.profiles?.username} · {MODE_LABEL[row.mode] ?? row.mode}
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

        {/* Scoring rubric */}
        <details className="rounded-xl border border-edge bg-paper p-4">
          <summary className="cursor-pointer text-sm font-medium text-ink">
            How scoring works
          </summary>
          <div className="mt-3 text-sm text-ink-soft space-y-2 leading-relaxed">
            <p>
              <strong className="text-ink">score = base × time × mistakes × hints</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-ink">Base</strong> per difficulty: Easy 100,
                Medium 250, Hard 500, Expert 1,000, Extreme 2,000.
              </li>
              <li>
                <strong className="text-ink">Time</strong> compares your solve to
                a target pace per difficulty. Solving in half the target ≈ 2×.
              </li>
              <li>
                <strong className="text-ink">Mistakes</strong> cost 10% each
                (floor: 10% of base).
              </li>
              <li>
                <strong className="text-ink">Hints</strong> cost <strong>25% each</strong>:
                1 hint = 0.75×, 2 = 0.50×, 3 = 0.25×. Multiplayer modes
                don&rsquo;t expose hints.
              </li>
            </ul>
          </div>
        </details>
      </div>
    </main>
  );
}
