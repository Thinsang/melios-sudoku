"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./toast/ToastProvider";

/**
 * Subscribes to inbox-style realtime events for the current user and:
 *   1. Refreshes the route (so pending counts + lists update)
 *   2. Pops a toast for genuinely new things (friend request received,
 *      game invite received, friend request accepted)
 *
 * We dedupe per-event-id with a ref-backed Set so a re-mount (route nav)
 * doesn't re-toast the same row, and we ignore events older than the
 * mount time so already-seen rows from before page load stay silent.
 */
export function HeaderRealtimeWatcher({ userId }: { userId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    // Captured once per subscription; rows older than this are treated
    // as already-seen so the user isn't re-toasted on every nav.
    const mountedAt = Date.now();

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_requests",
          filter: `to_user=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            from_user: string;
            status: string;
            created_at: string;
          };
          if (row.status !== "pending") return;
          if (!isFresh(row.created_at, mountedAt)) return;
          if (seenRef.current.has(`fr:${row.id}`)) return;
          seenRef.current.add(`fr:${row.id}`);

          // Look up the sender for a friendly message; fall back gracefully.
          void supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", row.from_user)
            .maybeSingle()
            .then(({ data }) => {
              const who =
                data?.display_name ?? data?.username ?? "Someone";
              push({
                title: "New friend request",
                description: `${who} wants to be friends.`,
                variant: "brand",
                action: { label: "View", href: "/sudoku/friends" },
              });
            });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friend_requests",
          filter: `from_user=eq.${userId}`,
        },
        (payload) => {
          // When someone the user invited *accepts*, congratulate.
          const row = payload.new as {
            id: string;
            to_user: string;
            status: string;
          };
          if (row.status !== "accepted") return;
          if (seenRef.current.has(`fra:${row.id}`)) return;
          seenRef.current.add(`fra:${row.id}`);
          void supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", row.to_user)
            .maybeSingle()
            .then(({ data }) => {
              const who =
                data?.display_name ?? data?.username ?? "Your friend";
              push({
                title: "Friend request accepted",
                description: `${who} is now your friend.`,
                variant: "success",
                action: { label: "Friends", href: "/sudoku/friends" },
              });
            });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_invites",
          filter: `to_user=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            game_id: string;
            from_user: string;
            status: string;
            created_at: string;
          };
          if (row.status !== "pending") return;
          if (!isFresh(row.created_at, mountedAt)) return;
          if (seenRef.current.has(`gi:${row.id}`)) return;
          seenRef.current.add(`gi:${row.id}`);
          void supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", row.from_user)
            .maybeSingle()
            .then(({ data }) => {
              const who =
                data?.display_name ?? data?.username ?? "A friend";
              push({
                title: "Game invite",
                description: `${who} invited you to play.`,
                variant: "brand",
                action: {
                  label: "Open",
                  href: `/sudoku/play/${row.game_id}`,
                },
              });
            });
          router.refresh();
        },
      )
      // Keep the dumb-refresh listener for non-toast updates (e.g. invite
      // declined / friend request rejected) so the badge counts still drop.
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friend_requests",
          filter: `to_user=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_invites",
          filter: `to_user=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [userId, router, push]);

  return null;
}

/**
 * Realtime can replay a recent event when the channel first subscribes.
 * Treat rows created more than 30s before mount as already-known so
 * we don't toast on every page load.
 */
function isFresh(createdAt: string | undefined, mountedAt: number): boolean {
  if (!createdAt) return true;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return true;
  return t >= mountedAt - 30_000;
}
