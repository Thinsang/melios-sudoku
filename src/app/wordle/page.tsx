import Link from "next/link";
import { answerForDate, todayKey } from "@/lib/wordle";
import { WordleGame } from "./WordleGame";

// Compute the daily word at request time, not at build time. Without this
// the route would static-cache with whatever date was current at deploy,
// and every user would get yesterday's word until the next deploy.
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

export default function WordlePage() {
  const date = todayKey();
  const answer = answerForDate(date);

  return (
    <main className="flex flex-1 flex-col items-center px-5 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
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
              Wordle
            </em>
          </h1>
          <p className="text-sm text-ink-soft mt-2">
            One five-letter word. Six guesses. Same for everyone today.
          </p>
        </div>

        <WordleGame answer={answer} date={date} />
      </div>
    </main>
  );
}
