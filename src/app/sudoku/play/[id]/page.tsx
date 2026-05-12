import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGuestId, getGuestName } from "@/lib/guest";
import { GameRoom } from "./GameRoom";
import { JoinForm } from "./JoinForm";

export default async function PlayGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!game) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guestId = await getGuestId();
  const guestName = await getGuestName();

  let me = null;
  if (user) {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("game_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    me = data;
  } else if (guestId) {
    const { data } = await supabase
      .from("game_players")
      .select("*")
      .eq("game_id", id)
      .eq("guest_id", guestId)
      .maybeSingle();
    me = data;
  }

  const { data: players } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", id)
    .order("joined_at", { ascending: true });

  if (!me) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <JoinForm
          gameId={id}
          mode={game.mode}
          difficulty={game.difficulty}
          inviteCode={game.invite_code}
          authed={!!user}
          defaultGuestName={guestName ?? ""}
          existingPlayers={players ?? []}
        />
      </main>
    );
  }

  // Load this player's private board (race/solo). Guests get null and
  // hydrate from localStorage on the client.
  let initialBoard: string | null = null;
  if (user && (game.mode === "race" || game.mode === "solo")) {
    const { data: pp } = await supabase
      .from("player_progress")
      .select("board")
      .eq("player_id", me.id)
      .maybeSingle();
    initialBoard = pp?.board ?? game.puzzle;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-4 py-6 sm:py-10">
      <GameRoom
        game={game}
        me={me}
        initialPlayers={players ?? []}
        initialBoard={initialBoard}
        isGuest={!user}
      />
    </main>
  );
}
