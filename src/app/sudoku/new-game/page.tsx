import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { NewGameForm } from "./NewGameForm";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; invite?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sudoku/auth/sign-in?next=/sudoku/new-game");
  }

  const { mode, invite } = await searchParams;

  const supabase = await createClient();
  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id, profiles:friend_id (id, username, display_name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  type FriendRow = {
    friend_id: string;
    profiles: { id: string; username: string; display_name: string | null } | null;
  };

  const friends = ((friendships ?? []) as FriendRow[])
    .map((f) => f.profiles)
    .filter((p): p is { id: string; username: string; display_name: string | null } => Boolean(p));

  return (
    <main className="flex flex-1 items-center justify-center px-5 sm:px-6 py-10 sm:py-14">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div>
          <Link
            href="/"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Home
          </Link>
          <h1 className="font-display text-3xl text-ink mt-3">New game</h1>
          <p className="text-sm text-ink-soft mt-1">
            Pick a mode and difficulty. You&rsquo;ll get a link to share.
          </p>
        </div>
        <NewGameForm
          initialMode={mode === "coop" || mode === "race" || mode === "solo" ? mode : "race"}
          friends={friends}
          initialInvited={invite ? [invite] : []}
        />
      </div>
    </main>
  );
}
