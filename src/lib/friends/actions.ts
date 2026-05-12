"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

export async function sendFriendRequest(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  if (!username) return { error: "Enter a username." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .maybeSingle();
  if (!target) return { error: `No user named "${username}".` };
  if (target.id === user.id) return { error: "Can't friend yourself." };

  // Already friends?
  const { data: existing } = await supabase
    .from("friendships")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("friend_id", target.id)
    .maybeSingle();
  if (existing) return { error: `You're already friends with ${target.username}.` };

  // Reverse pending request? Auto-accept.
  const { data: reverse } = await supabase
    .from("friend_requests")
    .select("id, status")
    .eq("from_user", target.id)
    .eq("to_user", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (reverse) {
    await acceptFriendRequestById(reverse.id);
    revalidatePath("/sudoku/friends");
    return { ok: true };
  }

  const { error } = await supabase
    .from("friend_requests")
    .upsert(
      { from_user: user.id, to_user: target.id, status: "pending" },
      { onConflict: "from_user,to_user" }
    );
  if (error) return { error: error.message };

  revalidatePath("/sudoku/friends");
  return { ok: true };
}

async function acceptFriendRequestById(reqId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: req } = await supabase
    .from("friend_requests")
    .select("from_user, to_user, status")
    .eq("id", reqId)
    .maybeSingle();
  if (!req || req.to_user !== user.id || req.status !== "pending") return;

  // Flip the request to 'accepted'. The `trg_friend_request_accepted` trigger
  // in the DB then writes both directions of the friendship under
  // SECURITY DEFINER — which is the part RLS was blocking before, and why
  // the sender wasn't seeing the new friend in their list.
  await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", reqId);
}

export async function acceptFriendRequest(formData: FormData) {
  const reqId = String(formData.get("request_id") ?? "");
  if (!reqId) return;
  await acceptFriendRequestById(reqId);
  revalidatePath("/sudoku/friends");
}

export async function declineFriendRequest(formData: FormData) {
  const reqId = String(formData.get("request_id") ?? "");
  if (!reqId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", reqId)
    .eq("to_user", user.id);
  revalidatePath("/sudoku/friends");
}

export async function unfriend(formData: FormData) {
  const friendId = String(formData.get("friend_id") ?? "");
  if (!friendId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // delete both directions
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    );
  revalidatePath("/sudoku/friends");
}

export async function challengeFriend(formData: FormData) {
  const friendId = String(formData.get("friend_id") ?? "");
  const mode = String(formData.get("mode") ?? "race");
  if (!friendId) return;
  if (!["race", "coop"].includes(mode))
    throw new Error("Mode must be race or coop");

  // Forward to /new-game with prefilled mode and a friend hint, or
  // create immediately. We create immediately for simplicity.
  redirect(`/sudoku/new-game?mode=${mode}&invite=${friendId}`);
}

export async function acceptGameInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  if (!inviteId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: inv } = await supabase
    .from("game_invites")
    .select("game_id, to_user, status")
    .eq("id", inviteId)
    .maybeSingle();
  if (!inv || inv.to_user !== user.id || inv.status !== "pending") return;

  await supabase
    .from("game_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId);
  redirect(`/sudoku/play/${inv.game_id}`);
}

export async function declineGameInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  if (!inviteId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("game_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("to_user", user.id);
  revalidatePath("/sudoku/friends");
}
