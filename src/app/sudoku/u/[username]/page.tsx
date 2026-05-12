import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "@/lib/sudoku";
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
    .select("id, username, display_name, created_at")
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

  return (
    <main className="flex flex-1 justify-center px-5 sm:px-6 py-10">
      <div className="w-full max-w-2xl flex flex-col gap-10">
        <div>
          <Link
            href="/"
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

        <section>
          <h2 className="font-display text-lg text-ink mb-3.5">Best times</h2>
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
        </section>

        <p className="text-sm text-ink-faint">
          {completed.length} puzzle{completed.length === 1 ? "" : "s"} solved.
        </p>
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
