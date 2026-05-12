"use client";

import Link from "next/link";
import {
  acceptFriendRequest,
  acceptGameInvite,
  declineFriendRequest,
  declineGameInvite,
  unfriend,
} from "@/lib/friends/actions";

export function FriendActions({
  kind,
  id,
}: {
  kind: "friend" | "friend_request" | "game_invite";
  id: string;
}) {
  if (kind === "friend") {
    return (
      <div className="flex gap-2">
        <Link
          href={`/sudoku/new-game?mode=race&invite=${id}`}
          className="px-3 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
        >
          Challenge
        </Link>
        <form action={unfriend}>
          <input type="hidden" name="friend_id" value={id} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md text-ink-faint hover:text-danger text-sm transition-colors duration-75"
          >
            Remove
          </button>
        </form>
      </div>
    );
  }

  if (kind === "friend_request") {
    return (
      <div className="flex gap-2">
        <form action={acceptFriendRequest}>
          <input type="hidden" name="request_id" value={id} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-success hover:opacity-90 text-canvas text-sm font-medium transition-colors duration-75"
          >
            Accept
          </button>
        </form>
        <form action={declineFriendRequest}>
          <input type="hidden" name="request_id" value={id} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md text-ink-faint hover:text-ink-soft text-sm transition-colors duration-75"
          >
            Decline
          </button>
        </form>
      </div>
    );
  }

  // game_invite
  return (
    <div className="flex gap-2">
      <form action={acceptGameInvite}>
        <input type="hidden" name="invite_id" value={id} />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
        >
          Join
        </button>
      </form>
      <form action={declineGameInvite}>
        <input type="hidden" name="invite_id" value={id} />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md text-ink-faint hover:text-ink-soft text-sm transition-colors duration-75"
        >
          Decline
        </button>
      </form>
    </div>
  );
}
