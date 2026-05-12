import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getCurrentProfile, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { getUserDailyScore, getUserStreak, todayKey } from "@/lib/daily";
import {
  getMyWordleResult,
  getUserWordleStreak,
} from "@/lib/wordle/actions";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/sudoku";

// Schema.org Organization + WebSite structured data. Helps Google understand
// what the site is and surface sitelinks under search results.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://meliogames.com#org",
      name: "Melio Games",
      url: "https://meliogames.com",
      logo: "https://meliogames.com/icon.svg",
    },
    {
      "@type": "WebSite",
      "@id": "https://meliogames.com#website",
      url: "https://meliogames.com",
      name: "Melio Games",
      publisher: { "@id": "https://meliogames.com#org" },
      description:
        "Play free online puzzle games at Melio Games. Multiplayer sudoku with friends, races, co-op, and leaderboards.",
      inLanguage: "en-US",
    },
  ],
};

/**
 * Melio's Games hub. The bare meliogames.com landing. Renders an auth-aware
 * top bar, a hero, a featured Sudoku card with a 9x9 preview, and a roster of
 * coming-soon games (Wordle, Crossword, Connections, Minesweeper).
 */
export default async function MeliosGamesHub() {
  const profile = await getCurrentProfile();
  const user = await getUser();
  // Signed in → username (the unique @handle). Signed out → "Player 1".
  const greetingName = profile?.username ?? "Player 1";

  // Today snapshot for signed-in users — what's left to play.
  const today = user ? await todayKey() : null;
  const [sudokuDone, sudokuStreak, wordleDone, wordleStreak] = user
    ? await Promise.all([
        getUserDailyScore(user.id, today!),
        getUserStreak(user.id),
        getMyWordleResult(today!),
        getUserWordleStreak(user.id),
      ])
    : [null, null, null, null];

  // Most-recently touched in-progress game so we can offer Resume up
  // top instead of forcing them to navigate into /sudoku.
  interface ActiveGame {
    id: string;
    mode: string;
    difficulty: string;
  }
  let activeGame: ActiveGame | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("games")
      .select(
        "id, mode, difficulty, started_at, status, game_players!inner(user_id)"
      )
      .eq("status", "active")
      .eq("game_players.user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as unknown as ActiveGame | null;
    if (row) activeGame = row;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <HubTopBar profile={profile} />

      <main className="flex-1 flex flex-col items-center px-5 sm:px-6 py-12 sm:py-20">
        <div className="w-full max-w-4xl flex flex-col gap-14 sm:gap-20">
          {/* Greeting */}
          <section className="text-center">
            <h1 className="font-display text-[2.5rem] sm:text-6xl leading-[1.05] tracking-tight text-ink">
              Hello,{" "}
              <em className="text-brand not-italic font-display italic">
                {greetingName}
              </em>
            </h1>
          </section>

          {/* Resume in-progress game */}
          {activeGame && (
            <Link
              href={`/sudoku/play/${activeGame.id}`}
              className="group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-brand/30 bg-brand-soft hover:border-brand/60 hover:shadow-[var(--shadow-soft)] hover:-translate-y-px transition-all duration-150"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-paper text-brand flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">
                  Resume
                </div>
                <div className="font-display text-lg text-ink leading-tight mt-0.5">
                  {(activeGame.mode === "race"
                    ? "Race"
                    : activeGame.mode === "coop"
                      ? "Co-op"
                      : "Solo")}{" "}
                  ·{" "}
                  {DIFFICULTY_LABEL[
                    activeGame.difficulty as Difficulty
                  ] ?? activeGame.difficulty}
                </div>
                <div className="text-xs text-ink-soft mt-0.5">
                  You left a puzzle in progress.
                </div>
              </div>
              <ArrowIcon className="hidden sm:block text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-100" />
            </Link>
          )}

          {/* Today snapshot — signed-in users only */}
          {user && (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-xs uppercase tracking-[0.18em] text-ink-faint">
                Today
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TodayCard
                  title="Daily Sudoku"
                  href="/sudoku/daily"
                  done={Boolean(sudokuDone)}
                  doneLabel={
                    sudokuDone
                      ? `${sudokuDone.score.toLocaleString()} pts`
                      : undefined
                  }
                  streak={sudokuStreak?.current ?? 0}
                  streakLive={Boolean(sudokuStreak?.completedToday)}
                  ctaLabel={sudokuDone ? "Replay" : "Play"}
                />
                <TodayCard
                  title="Daily Wordle"
                  href="/wordle"
                  done={Boolean(wordleDone)}
                  doneLabel={
                    wordleDone
                      ? wordleDone.won
                        ? `${wordleDone.guesses}/6`
                        : "X/6"
                      : undefined
                  }
                  streak={wordleStreak?.current ?? 0}
                  streakLive={Boolean(wordleStreak?.completedToday)}
                  ctaLabel={wordleDone ? "Review" : "Play"}
                />
              </div>
            </section>
          )}

          {/* Featured game */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xs uppercase tracking-[0.18em] text-ink-faint">
              Now playing
            </h2>
            <SudokuFeatureCard />
          </section>

          {/* Wordle — now live */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xs uppercase tracking-[0.18em] text-ink-faint">
              Also playing
            </h2>
            <Link
              href="/wordle"
              className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-soft)] hover:-translate-y-px transition-all duration-150"
            >
              <div className="flex items-center justify-center bg-paper-raised border border-edge rounded-xl py-3 px-3 sm:py-4 sm:px-4 shrink-0">
                <WordlePreview />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-2xl sm:text-3xl text-ink group-hover:text-brand transition-colors duration-75">
                    Wordle
                  </h3>
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-success-soft text-success font-medium">
                    Daily
                  </span>
                </div>
                <p className="text-sm text-ink-soft mt-1">
                  Five letters. Six guesses. A new word every day.
                </p>
              </div>
              <ArrowIcon className="hidden sm:block text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-100" />
            </Link>
          </section>

          {/* Coming soon */}
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xs uppercase tracking-[0.18em] text-ink-faint">
                Coming soon
              </h2>
              <span className="text-xs text-ink-faint">3 in the works</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ComingSoonCard
                name="Crossword"
                blurb="Daily crosswords with friends."
                tags={["Word", "Co-op"]}
                preview={<CrosswordPreview />}
              />
              <ComingSoonCard
                name="Connections"
                blurb="Group sixteen words into four sets."
                tags={["Word", "Solo"]}
                preview={<ConnectionsPreview />}
              />
              <ComingSoonCard
                name="Minesweeper"
                blurb="Classic logic, modern feel."
                tags={["Logic", "Solo"]}
                preview={<MinesweeperPreview />}
              />
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/* =========================================================================
 * Top bar — auth-aware. Mirrors the sudoku Header's structure but with the
 * games-hub wordmark and no sudoku-specific nav (friends, leaderboard, etc.).
 * =======================================================================*/

function HubTopBar({
  profile,
}: {
  profile: { username: string; display_name: string | null } | null;
}) {
  return (
    <header className="w-full border-b border-edge bg-canvas/80 backdrop-blur supports-[backdrop-filter]:bg-canvas/70 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          aria-label="Melio Games"
          className="font-display text-[1.05rem] tracking-tight font-semibold text-ink hover:opacity-90 transition-opacity duration-75"
        >
          Melio{" "}
          <em className="text-brand not-italic font-display italic">Games</em>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2 text-sm">
          {profile ? (
            <>
              <Link
                href="/sudoku/profile"
                className="hidden sm:inline-block px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
              >
                {profile.display_name ?? profile.username}
              </Link>
              <ThemeToggle />
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised text-sm transition-colors duration-75"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/sudoku/auth/sign-in?next=/"
                className="px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
              >
                Sign in
              </Link>
              <Link
                href="/sudoku/auth/sign-up?next=/"
                className="px-3.5 py-1.5 rounded-md bg-ink hover:bg-ink/90 text-canvas font-medium transition-colors duration-75"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* =========================================================================
 * Featured Sudoku card with an actual 9x9 preview.
 * =======================================================================*/

function SudokuFeatureCard() {
  return (
    <Link
      href="/sudoku"
      aria-label="Play sudoku"
      className="group flex flex-col sm:flex-row items-stretch overflow-hidden rounded-2xl border border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-lifted)] hover:-translate-y-px transition-all duration-150"
    >
      <div className="shrink-0 flex items-center justify-center p-6 sm:p-8 bg-paper-raised border-b sm:border-b-0 sm:border-r border-edge">
        <SudokuPreview />
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
 * Realistic 9x9 sudoku snapshot. About half the cells filled, a mix of
 * "given" digits (ink) and "user-entered" digits (brand purple), one cell
 * shown selected with the brand-soft highlight.
 */
function SudokuPreview() {
  // 81-cell layout. Each cell is { value, kind }.
  //   "g" = given (ink, bold)
  //   "u" = user-entered (brand purple)
  //   "s" = selected (highlighted bg; show as user-entered digit)
  //   ""  = empty
  //
  // The pattern below is a real-ish partial state of an Easy puzzle, just
  // enough to feel busy without being unreadable at this size.
  type Kind = "g" | "u" | "s" | "";
  const cells: Array<[number, Kind]> = [
    [5, "g"], [3, "g"], [0, ""], [0, ""], [7, "g"], [0, ""], [0, ""], [0, ""], [0, ""],
    [6, "g"], [0, ""], [0, ""], [1, "g"], [9, "g"], [5, "g"], [0, ""], [0, ""], [0, ""],
    [0, ""], [9, "u"], [8, "g"], [0, ""], [0, ""], [0, ""], [0, ""], [6, "g"], [0, ""],
    [8, "g"], [0, ""], [0, ""], [0, ""], [6, "u"], [0, ""], [0, ""], [0, ""], [3, "g"],
    [4, "g"], [0, ""], [0, ""], [8, "g"], [0, "s"], [3, "g"], [0, ""], [0, ""], [1, "g"],
    [7, "g"], [0, ""], [0, ""], [0, ""], [2, "g"], [0, ""], [0, ""], [0, ""], [6, "g"],
    [0, ""], [6, "g"], [0, ""], [0, ""], [0, ""], [0, ""], [2, "u"], [8, "g"], [0, ""],
    [0, ""], [0, ""], [0, ""], [4, "g"], [1, "g"], [9, "u"], [0, ""], [0, ""], [5, "g"],
    [0, ""], [0, ""], [0, ""], [0, ""], [8, "g"], [0, ""], [0, ""], [7, "g"], [9, "g"],
  ];

  return (
    <div
      className="grid grid-cols-9 aspect-square w-36 sm:w-44 md:w-52 rounded-lg overflow-hidden border-2"
      style={{ borderColor: "var(--ink)", backgroundColor: "var(--ink)" }}
    >
      {cells.map(([value, kind], i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const thickRight = (col === 2 || col === 5) && col < 8;
        const thickBottom = (row === 2 || row === 5) && row < 8;
        const isSelected = kind === "s";
        const isGiven = kind === "g";
        const isUser = kind === "u" || kind === "s";

        const bg = isSelected ? "var(--brand-soft)" : "var(--paper)";
        const color = isGiven
          ? "var(--ink)"
          : isUser
            ? "var(--brand)"
            : "transparent";

        return (
          <div
            key={i}
            className="flex items-center justify-center text-[7px] sm:text-[9px] md:text-[11px] font-semibold tabular-nums"
            style={{
              backgroundColor: bg,
              color,
              boxShadow:
                (thickRight ? "1px 0 0 var(--ink), " : "") +
                (thickBottom ? "0 1px 0 var(--ink)" : "") ||
                undefined,
              marginRight: col < 8 && !thickRight ? 0.5 : 0,
              marginBottom: row < 8 && !thickBottom ? 0.5 : 0,
            }}
          >
            {value || ""}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
 * Coming-soon game cards. Same outer shell as the Sudoku card but smaller,
 * dimmed, and not clickable. Each has its own preview tile.
 * =======================================================================*/

function ComingSoonCard({
  name,
  blurb,
  tags,
  preview,
}: {
  name: string;
  blurb: string;
  tags: string[];
  preview: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-edge bg-paper opacity-90">
      <div className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.14em] text-ink-faint font-medium px-2 py-0.5 rounded-full border border-edge bg-paper-raised">
        Soon
      </div>
      <div className="flex items-center justify-center bg-paper-raised border border-edge rounded-xl py-5 px-3 min-h-[7.5rem]">
        {preview}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl text-ink">{name}</h3>
        <p className="text-sm text-ink-soft">{blurb}</p>
        <ul className="flex flex-wrap gap-1.5 text-[10px] text-ink-faint mt-1">
          {tags.map((t) => (
            <li
              key={t}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-paper-raised border border-edge"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* =========================================================================
 * Preview tiles per game. Each is intentionally distinct so the roster
 * doesn't look samey.
 * =======================================================================*/

/** Wordle preview — the word "MELIO" with realistic colored states. */
function WordlePreview() {
  const tiles: Array<{ letter: string; state: "correct" | "present" | "absent" }> = [
    { letter: "M", state: "correct" },
    { letter: "E", state: "correct" },
    { letter: "L", state: "present" },
    { letter: "I", state: "absent" },
    { letter: "O", state: "absent" },
  ];
  const COLORS = {
    correct: { bg: "#6aaa64", text: "#ffffff" },
    present: { bg: "#c9b458", text: "#ffffff" },
    absent: { bg: "var(--paper)", text: "var(--ink-soft)", border: "var(--edge-strong)" },
  };
  return (
    <div className="flex gap-1">
      {tiles.map((t, i) => {
        const c = COLORS[t.state];
        return (
          <div
            key={i}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-bold text-sm sm:text-base rounded-sm"
            style={{
              backgroundColor: c.bg,
              color: c.text,
              border: "border" in c ? `2px solid ${c.border}` : "none",
            }}
          >
            {t.letter}
          </div>
        );
      })}
    </div>
  );
}

/** Crossword preview — small grid with black squares + a couple letters. */
function CrosswordPreview() {
  // 5x5 — 'X' = black, letters = filled cell, '' = empty white cell
  const grid: Array<string> = [
    "M", "", "", "X", "C",
    "E", "X", "", "", "A",
    "L", "I", "F", "T", "S",
    "I", "", "X", "", "T",
    "O", "X", "", "", "S",
  ];
  return (
    <div
      className="grid grid-cols-5 gap-px aspect-square w-24 sm:w-28 rounded-sm overflow-hidden border-2"
      style={{ borderColor: "var(--ink)", backgroundColor: "var(--ink)" }}
    >
      {grid.map((cell, i) => {
        const isBlack = cell === "X";
        return (
          <div
            key={i}
            className="flex items-center justify-center text-[9px] sm:text-[11px] font-semibold tabular-nums"
            style={{
              backgroundColor: isBlack ? "var(--ink)" : "var(--paper)",
              color: "var(--ink)",
            }}
          >
            {isBlack ? "" : cell}
          </div>
        );
      })}
    </div>
  );
}

/** Connections preview — 4x4 grid with the four category colors. */
function ConnectionsPreview() {
  // Connections uses 4 categories. Show 16 tiles colored to evoke them.
  const COLORS = ["#f9df6d", "#a0c35a", "#b0c4ef", "#bc70c4"];
  // Layout: 4 of each color, shuffled-looking but visually balanced.
  const layout: number[] = [
    0, 1, 2, 3,
    1, 0, 3, 2,
    2, 3, 0, 1,
    3, 2, 1, 0,
  ];
  return (
    <div className="grid grid-cols-4 gap-1 w-24 sm:w-28">
      {layout.map((c, i) => (
        <div
          key={i}
          className="aspect-square rounded-sm"
          style={{ backgroundColor: COLORS[c] }}
        />
      ))}
    </div>
  );
}

/** Minesweeper preview — small grid with numbers and a flag. */
function TodayCard({
  title,
  href,
  done,
  doneLabel,
  streak,
  streakLive,
  ctaLabel,
}: {
  title: string;
  href: string;
  done: boolean;
  doneLabel?: string;
  streak: number;
  streakLive: boolean;
  ctaLabel: string;
}) {
  return (
    <Link
      href={href}
      className={
        "group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-150 " +
        (done
          ? "border-success/30 bg-success-soft hover:border-success/50"
          : "border-edge bg-paper hover:border-edge-strong hover:shadow-[var(--shadow-soft)] hover:-translate-y-px")
      }
    >
      <div
        className={
          "shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl " +
          (done
            ? "bg-success/15 text-success"
            : "bg-brand-soft text-brand")
        }
      >
        {done ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          "▶"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-lg text-ink leading-tight">
            {title}
          </h3>
          {done && doneLabel && (
            <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-paper text-ink-soft border border-edge font-medium tabular-nums">
              {doneLabel}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-soft mt-0.5">
          {done ? (
            "Done · come back tomorrow"
          ) : streak > 0 ? (
            <>
              <span
                className={streakLive ? "text-warning" : "text-ink-soft"}
              >
                🔥 {streak}-day streak
              </span>{" "}
              · {streakLive ? "kept" : "play to keep"}
            </>
          ) : (
            "Build a new streak"
          )}
        </div>
      </div>
      <span
        className={
          "shrink-0 hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-75 " +
          (done
            ? "text-ink-soft border border-edge bg-paper group-hover:bg-paper-raised"
            : "bg-brand text-brand-ink group-hover:bg-brand-hover")
        }
      >
        {ctaLabel}
      </span>
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function MinesweeperPreview() {
  // 4x4 — string per cell:
  //   "" = revealed empty, "1"/"2"/"3" = number, "?" = unrevealed, "F" = flag
  const cells: string[] = [
    "1", "1", "2", "F",
    "", "", "1", "2",
    "", "1", "1", "1",
    "1", "2", "F", "1",
  ];
  const NUM_COLOR: Record<string, string> = {
    "1": "#1976d2",
    "2": "#388e3c",
    "3": "#d32f2f",
  };
  return (
    <div
      className="grid grid-cols-4 gap-px aspect-square w-24 sm:w-28 rounded-sm overflow-hidden border-2"
      style={{ borderColor: "var(--ink)", backgroundColor: "var(--ink)" }}
    >
      {cells.map((cell, i) => {
        const isFlag = cell === "F";
        const isRevealedEmpty = cell === "";
        const isNumber = ["1", "2", "3"].includes(cell);
        return (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] sm:text-xs font-bold tabular-nums"
            style={{
              backgroundColor: isRevealedEmpty
                ? "var(--paper-sunken)"
                : isFlag
                  ? "var(--paper-raised)"
                  : "var(--paper)",
              color: isFlag
                ? "var(--danger)"
                : isNumber
                  ? NUM_COLOR[cell]
                  : "transparent",
            }}
          >
            {isFlag ? "⚑" : cell}
          </div>
        );
      })}
    </div>
  );
}
