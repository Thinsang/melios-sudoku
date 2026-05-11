import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { AddFriendForm } from "./AddFriendForm";
import { FriendActions } from "./FriendActions";

interface MiniProfile {
  id: string;
  username: string;
  display_name: string | null;
}

interface FriendshipRow {
  friend_id: string;
  created_at: string;
  profiles: MiniProfile | null;
}

interface RequestRow {
  id: string;
  created_at: string;
  profiles: MiniProfile | null;
}

interface GameInviteRow {
  id: string;
  created_at: string;
  game_id: string;
  games: { mode: string; difficulty: string } | null;
  profiles: MiniProfile | null;
}

export default async function FriendsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/sign-in?next=/friends");

  const supabase = await createClient();

  const [friendsRes, incomingRes, outgoingRes, invitesRes] = await Promise.all([
    supabase
      .from("friendships")
      .select("friend_id, created_at, profiles:friend_id (id, username, display_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id, created_at, profiles:from_user (id, username, display_name)")
      .eq("to_user", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id, created_at, profiles:to_user (id, username, display_name)")
      .eq("from_user", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("game_invites")
      .select(
        "id, created_at, game_id, games (mode, difficulty), profiles:from_user (id, username, display_name)"
      )
      .eq("to_user", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const friendRows = (friendsRes.data ?? []) as unknown as FriendshipRow[];
  const incomingRows = (incomingRes.data ?? []) as unknown as RequestRow[];
  const outgoingRows = (outgoingRes.data ?? []) as unknown as RequestRow[];
  const inviteRows = (invitesRes.data ?? []) as unknown as GameInviteRow[];

  const friends = friendRows
    .map((r) => r.profiles)
    .filter((p): p is MiniProfile => Boolean(p));

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
          <h1 className="font-display text-4xl text-ink mt-3">Friends</h1>
        </div>

        <Section title="Add a friend">
          <AddFriendForm />
        </Section>

        {inviteRows.length > 0 && (
          <Section title="Game invites">
            <ul className="flex flex-col gap-2">
              {inviteRows.map((inv) => {
                const from = inv.profiles;
                if (!from) return null;
                return (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-edge bg-paper"
                  >
                    <div>
                      <div className="font-medium text-ink">
                        {from.display_name ?? from.username}
                      </div>
                      <div className="text-sm text-ink-soft capitalize">
                        {inv.games?.mode ?? "game"} · {inv.games?.difficulty ?? ""}
                      </div>
                    </div>
                    <FriendActions kind="game_invite" id={inv.id} />
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {incomingRows.length > 0 && (
          <Section title="Friend requests">
            <ul className="flex flex-col gap-2">
              {incomingRows.map((req) => {
                const from = req.profiles;
                if (!from) return null;
                return (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-edge bg-paper"
                  >
                    <div>
                      <div className="font-medium text-ink">
                        {from.display_name ?? from.username}
                      </div>
                      <div className="text-sm text-ink-faint">@{from.username}</div>
                    </div>
                    <FriendActions kind="friend_request" id={req.id} />
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <Section title={`Your friends (${friends.length})`}>
          {friends.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No friends yet. Add one above to start challenging.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-edge bg-paper"
                >
                  <Link
                    href={`/u/${f.username}`}
                    className="flex-1 group"
                  >
                    <div className="font-medium text-ink group-hover:text-brand transition-colors duration-75">
                      {f.display_name ?? f.username}
                    </div>
                    <div className="text-sm text-ink-faint">@{f.username}</div>
                  </Link>
                  <FriendActions kind="friend" id={f.id} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {outgoingRows.length > 0 && (
          <Section title="Pending sent">
            <ul className="flex flex-col gap-2">
              {outgoingRows.map((req) => {
                const to = req.profiles;
                if (!to) return null;
                return (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-edge bg-paper opacity-60"
                  >
                    <div>
                      <div className="font-medium text-ink">
                        {to.display_name ?? to.username}
                      </div>
                      <div className="text-sm text-ink-faint">@{to.username}</div>
                    </div>
                    <span className="text-xs text-ink-faint">Pending</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg text-ink mb-3.5">{title}</h2>
      {children}
    </section>
  );
}
