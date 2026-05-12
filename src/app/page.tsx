import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

/**
 * Melio's Games hub. The root of meliogames.com. Currently has one published
 * game (Sudoku); the layout is designed to accommodate more later without
 * looking sparse.
 */
export default function MeliosGamesHub() {
  return (
    <>
      {/* Minimal top bar — distinct from the sudoku Header, which lives at
          /sudoku/* only. */}
      <header className="w-full border-b border-edge bg-canvas/80 backdrop-blur supports-[backdrop-filter]:bg-canvas/70 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink hover:text-brand transition-colors duration-75"
          >
            <span className="text-brand">
              <BrandMark size={18} />
            </span>
            <span className="font-display text-[1.05rem] tracking-tight font-semibold">
              Melio
            </span>
          </Link>
          <nav className="text-sm">
            <Link
              href="/sudoku"
              className="px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
            >
              Play Sudoku
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-5 sm:px-6 py-14 sm:py-24">
        <div className="w-full max-w-3xl flex flex-col gap-14 sm:gap-20">
          {/* Hero */}
          <section className="text-center">
            <h1 className="font-display text-[2.75rem] sm:text-7xl leading-[1.02] tracking-tight text-ink">
              Melio&rsquo;s{" "}
              <em className="text-brand not-italic font-display italic">Games</em>
            </h1>
            <p className="mt-5 text-base sm:text-xl text-ink-soft max-w-xl mx-auto leading-relaxed">
              A small collection of carefully made games. Think and have fun!
            </p>
          </section>

          {/* Games */}
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-sm uppercase tracking-[0.18em] text-ink-faint">
                Now playing
              </h2>
              <span className="text-xs text-ink-faint">1 game · more coming</span>
            </div>

            <SudokuCard />
            <ComingSoonCard />
          </section>

          {/* Tagline / about — kept minimal so it doesn't feel like marketing */}
          <section className="text-center text-sm text-ink-faint border-t border-edge pt-8">
            <p>Built with intent. Designed to be played a lot.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-edge">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between text-xs text-ink-faint">
          <span>© Melio</span>
          <Link
            href="/sudoku"
            className="hover:text-ink transition-colors duration-75"
          >
            Sudoku
          </Link>
        </div>
      </footer>
    </>
  );
}

/* =========================================================================
 * Featured Sudoku card — the marquee element on the hub. Visually echoes
 * the sudoku app's design (Fraunces display type, brand purple, soft shadow)
 * so it feels like one cohesive product.
 * =======================================================================*/
function SudokuCard() {
  return (
    <Link
      href="/sudoku"
      aria-label="Play sudoku"
      className="group flex flex-col sm:flex-row items-stretch overflow-hidden rounded-2xl border border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-lifted)] hover:-translate-y-px transition-all duration-150"
    >
      <div className="shrink-0 flex items-center justify-center p-8 sm:p-10 bg-paper-raised border-b sm:border-b-0 sm:border-r border-edge">
        <SudokuPreviewTile />
      </div>

      <div className="flex-1 p-6 sm:p-8 flex flex-col gap-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint font-medium">
          Logic · 1–4 players
        </div>
        <h3 className="font-display text-3xl sm:text-4xl text-ink leading-[1.05]">
          Sudoku
        </h3>
        <p className="text-ink-soft leading-relaxed">
          Five difficulties from Easy to Extreme. Play solo, race a friend
          across the same puzzle, or solve one together. Live multiplayer,
          scoring, friends, leaderboards, board themes.
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-faint mt-1">
          <FeaturePill>Solo</FeaturePill>
          <FeaturePill>Race</FeaturePill>
          <FeaturePill>Co-op</FeaturePill>
          <FeaturePill>Leaderboard</FeaturePill>
          <FeaturePill>Themes</FeaturePill>
        </ul>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 text-brand font-medium group-hover:gap-2.5 transition-all duration-150">
            Play sudoku
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center px-2 py-0.5 rounded-full bg-paper-raised border border-edge">
      {children}
    </li>
  );
}

/**
 * A bigger, more detailed cousin of <BrandMark> — 5x5 cells with a few
 * "filled" diagonals and a single highlighted cell, evoking a sudoku
 * board at a glance.
 */
function SudokuPreviewTile() {
  // 5x5 layout. 'g' = given, 'u' = brand-color "user input", 's' = selected
  const cells: Array<"g" | "u" | "s" | ""> = [
    "g", "", "", "u", "",
    "", "u", "", "", "g",
    "", "", "s", "", "",
    "g", "", "", "u", "",
    "", "u", "", "", "g",
  ];
  return (
    <div
      className="grid grid-cols-5 gap-px aspect-square w-28 sm:w-32 md:w-36 rounded-md overflow-hidden border-2"
      style={{ borderColor: "var(--ink)", backgroundColor: "var(--ink)" }}
    >
      {cells.map((kind, i) => {
        const bg =
          kind === "s" ? "var(--brand-soft)" : "var(--paper)";
        const color =
          kind === "g"
            ? "var(--ink)"
            : kind === "u"
              ? "var(--brand)"
              : "transparent";
        const digit =
          kind === "g" ? "5" : kind === "u" ? "3" : kind === "s" ? "" : "";
        return (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] sm:text-xs font-semibold tabular-nums"
            style={{ backgroundColor: bg, color }}
          >
            {digit}
          </div>
        );
      })}
    </div>
  );
}

function ComingSoonCard() {
  return (
    <div className="flex items-center gap-4 p-5 sm:p-6 rounded-2xl border border-dashed border-edge-strong bg-paper-raised/40">
      <div className="w-11 h-11 rounded-lg bg-paper border border-edge flex items-center justify-center text-ink-faint">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="font-display text-base sm:text-lg text-ink">
          More games coming
        </div>
        <div className="text-sm text-ink-soft mt-0.5">
          The next one&rsquo;s in early sketches.
        </div>
      </div>
    </div>
  );
}
