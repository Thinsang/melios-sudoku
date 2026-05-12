import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "Melio Games is a small, carefully made games studio. Free puzzle games, no ads, no tracking beyond what we need to run the site.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <main className="flex-1 flex justify-center px-5 sm:px-6 py-12 sm:py-16">
        <article className="w-full max-w-2xl flex flex-col gap-8">
          <header>
            <Link
              href="/"
              className="text-sm text-ink-soft hover:text-ink transition-colors duration-75"
            >
              ← Melio Games
            </Link>
            <h1 className="font-display text-4xl sm:text-5xl text-ink mt-3">
              About
            </h1>
          </header>

          <div className="prose-content text-ink-soft leading-relaxed flex flex-col gap-5 text-base">
            <p>
              <strong className="text-ink">Melio Games</strong> is a small,
              carefully made games studio. We build calm, focused puzzle games
              you can play in your browser — solo, with a friend, or against
              one.
            </p>
            <p>
              The flagship is{" "}
              <Link href="/sudoku" className="text-brand hover:underline">
                Melio Sudoku
              </Link>
              : five difficulties, live multiplayer races, co-op solving on a
              shared board, a daily puzzle with streaks, and a leaderboard.
              Alongside it,{" "}
              <Link href="/wordle" className="text-brand hover:underline">
                Wordle
              </Link>
              ,{" "}
              <Link href="/connections" className="text-brand hover:underline">
                Connections
              </Link>
              ,{" "}
              <Link href="/minesweeper" className="text-brand hover:underline">
                Minesweeper
              </Link>
              , and{" "}
              <Link href="/2048" className="text-brand hover:underline">
                2048
              </Link>{" "}
              — each built with the same restraint.
            </p>
            <h2 className="font-display text-2xl text-ink mt-2">
              What we&rsquo;re about
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>
                <strong className="text-ink">Free.</strong> No ads. No paywalls
                on core gameplay. Sign up if you want streaks and a name on the
                leaderboard, but every puzzle is free to play.
              </li>
              <li>
                <strong className="text-ink">Calm.</strong> No flashing
                animations, no rage-bait. Warm paper feel, careful typography,
                tight feedback loops.
              </li>
              <li>
                <strong className="text-ink">Together.</strong> Real-time
                multiplayer is a first-class feature, not an afterthought. Race
                someone across the same puzzle, or solve one together.
              </li>
            </ul>
            <h2 className="font-display text-2xl text-ink mt-2">Get in touch</h2>
            <p>
              Bugs, ideas, feature requests, or just hello —{" "}
              <a
                href="mailto:hello@meliogames.com"
                className="text-brand hover:underline"
              >
                hello@meliogames.com
              </a>
              .
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
