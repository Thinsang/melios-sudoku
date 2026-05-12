import Link from "next/link";
import { TwentyFortyEightGame } from "./TwentyFortyEightGame";

export default function TwentyFortyEightPage() {
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
        </header>

        <div className="text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">
            Melio{" "}
            <em className="text-brand not-italic font-display italic">
              2048
            </em>
          </h1>
          <p className="text-sm text-ink-soft mt-2 max-w-xs mx-auto">
            Slide with arrow keys or swipe. Same-value tiles merge — chase
            2048 and beyond.
          </p>
        </div>

        <TwentyFortyEightGame />
      </div>
    </main>
  );
}
