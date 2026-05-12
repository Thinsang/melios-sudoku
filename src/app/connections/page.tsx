import Link from "next/link";
import { puzzleForDate, shuffleForDate, todayKey } from "@/lib/connections/puzzles";
import { ConnectionsGame } from "./ConnectionsGame";

// Compute the daily puzzle at request time, not at build time. Otherwise
// the route static-caches with whatever date was current at deploy and
// everyone sees the same yesterday-puzzle until the next push.
export const dynamic = "force-dynamic";

function formatLongDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ConnectionsPage() {
  const date = todayKey();
  const puzzle = puzzleForDate(date);
  const allWords = puzzle.groups.flatMap((g) => g.words);
  const startOrder = shuffleForDate(allWords, date);

  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-md flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Melio Games
          </Link>
          <span className="text-xs text-ink-faint">{formatLongDate(date)}</span>
        </header>

        <div className="text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">
            Melio{" "}
            <em className="text-brand not-italic font-display italic">
              Connections
            </em>
          </h1>
          <p className="text-sm text-ink-soft mt-2">
            Find four groups of four. Four mistakes and the day&rsquo;s over.
          </p>
        </div>

        <ConnectionsGame puzzle={puzzle} startOrder={startOrder} date={date} />
      </div>
    </main>
  );
}
