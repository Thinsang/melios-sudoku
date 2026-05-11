"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateGuestId, setGuestName as setGuestNameCookie } from "@/lib/guest";
import {
  DIFFICULTIES,
  Difficulty,
  encodeBoard,
  generatePuzzle,
} from "@/lib/sudoku";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

const VALID_MODES = ["solo", "coop", "race"] as const;
type GameMode = (typeof VALID_MODES)[number];

export interface CreateGameResult {
  error?: string;
}

export async function createGame(
  _prev: CreateGameResult | null,
  formData: FormData
): Promise<CreateGameResult> {
  const mode = String(formData.get("mode") ?? "") as GameMode;
  const difficulty = String(formData.get("difficulty") ?? "") as Difficulty;
  const guestName = String(formData.get("guest_name") ?? "").trim();
  const inviteUserIds = formData
    .getAll("invite_user_id")
    .map(String)
    .filter(Boolean);

  if (!VALID_MODES.includes(mode)) return { error: "Invalid mode." };
  if (!DIFFICULTIES.includes(difficulty)) return { error: "Invalid difficulty." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Sign in to create a saved game. (Guests can join by invite link only.)",
    };
  }

  const puzzle = generatePuzzle(difficulty);
  const puzzleStr = encodeBoard(puzzle.given);
  const solutionStr = encodeBoard(puzzle.solution);

  const inviteCode = generateInviteCode();

  // Race starts in 'waiting' status — the lobby holds the timer at 0 until
  // all players have pressed Ready. Coop and solo (saved) start immediately.
  const isRace = mode === "race";
  const { data: game, error } = await supabase
    .from("games")
    .insert({
      mode,
      difficulty,
      puzzle: puzzleStr,
      solution: solutionStr,
      current_board: mode === "coop" ? puzzleStr : null,
      status: isRace ? "waiting" : "active",
      invite_code: inviteCode,
      created_by: user.id,
      started_at: isRace ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !game) return { error: error?.message ?? "Failed to create game." };

  // Add the creator as the first player.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username,display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: playerRow } = await supabase
    .from("game_players")
    .insert({
      game_id: game.id,
      user_id: user.id,
      display_name: profile?.display_name ?? profile?.username ?? "Player",
    })
    .select("id")
    .single();

  // Seed the per-player board for race/solo (private, RLS-protected).
  if (playerRow && (mode === "race" || mode === "solo")) {
    await supabase
      .from("player_progress")
      .insert({ player_id: playerRow.id, board: puzzleStr });
  }

  if (inviteUserIds.length > 0 && mode !== "solo") {
    // Verify each is actually a friend before inviting.
    const { data: friends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .in("friend_id", inviteUserIds);
    const friendSet = new Set((friends ?? []).map((f) => f.friend_id));
    const invites = inviteUserIds
      .filter((id) => friendSet.has(id))
      .map((toId) => ({ game_id: game.id, from_user: user.id, to_user: toId }));
    if (invites.length > 0) {
      await supabase.from("game_invites").insert(invites);
    }
  }

  if (guestName) await setGuestNameCookie(guestName);

  revalidatePath("/");
  redirect(`/play/${game.id}`);
}

export interface JoinGameResult {
  error?: string;
}

export async function joinGame(
  _prev: JoinGameResult | null,
  formData: FormData
): Promise<JoinGameResult> {
  const gameId = String(formData.get("game_id") ?? "");
  const guestName = String(formData.get("guest_name") ?? "").trim();
  if (!gameId) return { error: "Missing game id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: game, error: gErr } = await supabase
    .from("games")
    .select("id, mode, puzzle, status")
    .eq("id", gameId)
    .maybeSingle();
  if (gErr || !game) return { error: "Game not found." };
  if (game.status === "completed" || game.status === "abandoned") {
    return { error: "This game is over." };
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username,display_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: existing } = await supabase
      .from("game_players")
      .select("id")
      .eq("game_id", gameId)
      .eq("user_id", user.id)
      .maybeSingle();

    let playerId = existing?.id;

    if (!playerId) {
      const { data: inserted, error: insErr } = await supabase
        .from("game_players")
        .insert({
          game_id: gameId,
          user_id: user.id,
          display_name: profile?.display_name ?? profile?.username ?? "Player",
        })
        .select("id")
        .single();
      if (insErr || !inserted) return { error: insErr?.message ?? "Could not join." };
      playerId = inserted.id;
    }

    // Seed per-player board for race/solo modes if not already there.
    if (game.mode === "race" || game.mode === "solo") {
      const { data: pp } = await supabase
        .from("player_progress")
        .select("player_id")
        .eq("player_id", playerId)
        .maybeSingle();
      if (!pp) {
        await supabase
          .from("player_progress")
          .insert({ player_id: playerId, board: game.puzzle });
      }
    }
  } else {
    if (!guestName) return { error: "Enter a display name to play as a guest." };
    const guestId = await getOrCreateGuestId();
    await setGuestNameCookie(guestName);

    const { data: existing } = await supabase
      .from("game_players")
      .select("id")
      .eq("game_id", gameId)
      .eq("guest_id", guestId)
      .maybeSingle();

    if (!existing) {
      const { error: insErr } = await supabase.from("game_players").insert({
        game_id: gameId,
        guest_id: guestId,
        display_name: guestName,
      });
      if (insErr) return { error: insErr.message };
    }
    // Note: guests don't get a player_progress row (RLS would block their own
    // writes anyway). Their race/solo board is persisted to localStorage by
    // the client.
  }

  redirect(`/play/${gameId}`);
}

export async function joinByInviteCode(
  _prev: JoinGameResult | null,
  formData: FormData
): Promise<JoinGameResult> {
  const code = String(formData.get("invite_code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "Enter an invite code." };

  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();
  if (!game) return { error: "Invite code not found." };

  redirect(`/play/${game.id}`);
}

export async function recordMove(
  gameId: string,
  playerRowId: string,
  cellIndex: number,
  value: number,
  newBoard: string,
  mode: "solo" | "coop" | "race",
  progressPct: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (mode === "coop") {
    // Shared board update — only authed participants per RLS.
    await supabase
      .from("games")
      .update({ current_board: newBoard })
      .eq("id", gameId);
  } else if (user) {
    // Race or solo, authed: persist to private player_progress + bump public progress_pct.
    await supabase
      .from("player_progress")
      .upsert({ player_id: playerRowId, board: newBoard });
    await supabase
      .from("game_players")
      .update({ progress_pct: progressPct })
      .eq("id", playerRowId);
  }
  // Guests: no DB write — client uses localStorage and live broadcast.

  // Audit log (only auth participants — RLS forbids guest writes here).
  if (user) {
    await supabase.from("moves").insert({
      game_id: gameId,
      player_id: playerRowId,
      cell_index: cellIndex,
      value,
    });
  }
}

/**
 * Flip a race game from 'waiting' → 'active' and stamp started_at to a moment
 * a few seconds in the future. Every client uses started_at as the source of
 * truth for the countdown, so they all see "3, 2, 1, Go" in sync.
 */
export async function startRace(gameId: string, countdownMs = 3000) {
  const supabase = await createClient();
  const startAt = new Date(Date.now() + countdownMs).toISOString();

  // Only flip if still waiting — first writer wins, others no-op.
  const { data: cur } = await supabase
    .from("games")
    .select("status, mode")
    .eq("id", gameId)
    .maybeSingle();
  if (!cur || cur.mode !== "race" || cur.status !== "waiting") return;

  await supabase
    .from("games")
    .update({ status: "active", started_at: startAt })
    .eq("id", gameId);
}

export async function finishRace(
  gameId: string,
  playerRowId: string,
  finishTimeMs: number,
  mistakes: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // Guests can't write here under RLS.

  await supabase
    .from("game_players")
    .update({
      finished_at: new Date().toISOString(),
      finish_time_ms: finishTimeMs,
      mistakes,
      progress_pct: 100,
    })
    .eq("id", playerRowId);

  // If this is the first finisher in race mode, mark game completed.
  const { data: game } = await supabase
    .from("games")
    .select("mode, status")
    .eq("id", gameId)
    .maybeSingle();
  if (game?.mode === "race" && game.status === "active") {
    await supabase
      .from("games")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", gameId);
  }
}

export async function finishCoop(gameId: string, mistakes: number) {
  const supabase = await createClient();
  await supabase
    .from("games")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", gameId);
  // Stamp the latest mistake count on every active player.
  await supabase
    .from("game_players")
    .update({ finished_at: new Date().toISOString(), mistakes })
    .eq("game_id", gameId)
    .is("finished_at", null);
}
