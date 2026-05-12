"use client";

import Link from "next/link";

export function ChallengeButton({ friendId }: { friendId: string }) {
  return (
    <div className="flex gap-2">
      <Link
        href={`/sudoku/new-game?mode=race&invite=${friendId}`}
        className="px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
      >
        Challenge to race
      </Link>
      <Link
        href={`/sudoku/new-game?mode=coop&invite=${friendId}`}
        className="px-3.5 py-1.5 rounded-md border border-edge bg-paper text-ink hover:bg-paper-raised text-sm font-medium transition-colors duration-75"
      >
        Co-op
      </Link>
    </div>
  );
}
