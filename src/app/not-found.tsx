import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page doesn't exist (or doesn't anymore).",
  robots: { index: false, follow: false },
};

/**
 * Site-wide custom 404. Replaces Next.js's default. Renders 4·0·4 as
 * three sudoku cells (middle one in brand purple) and offers quick
 * links to the main routes so a misclick isn't a dead end.
 */
export default function NotFound() {
  return (
    <>
      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 py-16 sm:py-24">
        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          {/* 404 as three sudoku cells */}
          <div className="flex gap-2" aria-hidden>
            {["4", "0", "4"].map((d, i) => (
              <span
                key={i}
                className={
                  "w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl font-display text-4xl sm:text-5xl font-semibold tabular-nums border-2 " +
                  (i === 1
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-edge-strong bg-paper text-ink")
                }
              >
                {d}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              Page not found
            </h1>
            <p className="text-sm sm:text-base text-ink-soft max-w-sm">
              That page doesn&rsquo;t exist (or doesn&rsquo;t anymore). Try one
              of these instead.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mt-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
            >
              Melio Games
            </Link>
            <Link
              href="/sudoku"
              className="px-4 py-2 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
            >
              Sudoku
            </Link>
            <Link
              href="/sudoku/daily"
              className="px-4 py-2 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
            >
              Daily
            </Link>
            <Link
              href="/wordle"
              className="px-4 py-2 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
            >
              Wordle
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
