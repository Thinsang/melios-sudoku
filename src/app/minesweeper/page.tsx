import Link from "next/link";
import { MinesweeperGame } from "./MinesweeperGame";
import type { Difficulty } from "@/lib/minesweeper";

const VALID = ["beginner", "intermediate", "expert"] as const;

export default async function MinesweeperPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const difficulty: Difficulty = (VALID as readonly string[]).includes(d ?? "")
    ? (d as Difficulty)
    : "beginner";

  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Melio Games
          </Link>
        </header>

        <div className="text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">
            Melio{" "}
            <em className="text-brand not-italic font-display italic">
              Minesweeper
            </em>
          </h1>
          <p className="text-sm text-ink-soft mt-2 max-w-md mx-auto">
            Reveal every safe cell. Numbers tell you how many mines hide in the
            8 neighbors. Long-press (or right-click) to flag.
          </p>
        </div>

        <MinesweeperGame difficulty={difficulty} />
      </div>
    </main>
  );
}
