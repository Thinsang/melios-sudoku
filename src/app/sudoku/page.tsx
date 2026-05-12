import Link from "next/link";
import { DIFFICULTIES, DIFFICULTY_LABEL, Difficulty } from "@/lib/sudoku";
import { createClient } from "@/lib/supabase/server";
import {
  difficultyForDate,
  getUserDailyScore,
  getUserStreak,
  todayKey,
} from "@/lib/daily";
import { JoinByCodeForm } from "./JoinByCodeForm";

// Schema.org structured data for the sudoku app — declared as a VideoGame
// (the closest match for a free, browser-playable game). Helps Google show
// rich result cards and discover the game's properties.
const SUDOKU_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Melio Sudoku",
  url: "https://meliogames.com/sudoku",
  image: "https://meliogames.com/sudoku/opengraph-image",
  description:
    "Play sudoku online for free. Five difficulties from Easy to Extreme. Race a friend, solve together in co-op, or play solo. Live multiplayer, scoring, leaderboards.",
  genre: ["Puzzle", "Logic", "Strategy"],
  gamePlatform: ["Web browser"],
  applicationCategory: "Game",
  operatingSystem: "Any",
  inLanguage: "en-US",
  playMode: ["SinglePlayer", "MultiPlayer", "CoOp"],
  numberOfPlayers: { "@type": "QuantitativeValue", minValue: 1, maxValue: 4 },
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "Melio Games",
    url: "https://meliogames.com",
  },
};

const DIFFICULTY_DESC: Record<Difficulty, string> = {
  easy: "A relaxing warm-up.",
  medium: "Balanced and steady.",
  hard: "Real chains and pairs.",
  expert: "For the truly fearless.",
  extreme: "The hardest sudoku math allows.",
};

const DIFFICULTY_PIPS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
  extreme: 5,
};

const DIFFICULTY_TOKEN: Record<Difficulty, string> = {
  easy: "diff-easy",
  medium: "diff-medium",
  hard: "diff-hard",
  expert: "diff-expert",
  extreme: "diff-extreme",
};

const MODE_LABEL: Record<string, string> = {
  solo: "Solo",
  coop: "Co-op",
  race: "Race",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showWelcome = welcome === "1" && Boolean(user);

  let profileGreeting: string | null = null;
  if (showWelcome && user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle();
    profileGreeting = data?.display_name ?? data?.username ?? null;
  }

  let activeGames: Array<{
    id: string;
    mode: string;
    difficulty: string;
    started_at: string | null;
  }> = [];
  if (user) {
    const { data } = await supabase
      .from("games")
      .select("id, mode, difficulty, started_at, status, game_players!inner(user_id)")
      .eq("status", "active")
      .eq("game_players.user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(6);
    activeGames = data ?? [];
  }

  // Daily snapshot — difficulty + (if signed in) streak + today's status.
  const today = await todayKey();
  const dailyDifficulty = await difficultyForDate(today);
  const dailyScore = user ? await getUserDailyScore(user.id, today) : null;
  const streak = user ? await getUserStreak(user.id) : null;

  return (
    <main className="flex flex-1 flex-col items-center px-5 sm:px-6 py-10 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SUDOKU_STRUCTURED_DATA),
        }}
      />
      <div className="w-full max-w-3xl flex flex-col gap-12">
        {showWelcome && (
          <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 flex items-center gap-3 -mb-4">
            <div className="shrink-0 w-7 h-7 rounded-full bg-success/20 text-success flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-sm text-ink">
              {profileGreeting
                ? `Welcome, ${profileGreeting}. Your account is ready.`
                : "Welcome. Your account is ready."}
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="text-center pt-6 pb-2">
          <h1 className="font-display text-[2.5rem] sm:text-[3.75rem] leading-[1.05] tracking-tight text-ink">
            Solo, <em className="text-brand not-italic font-display italic">with friends</em>,
            <br className="hidden sm:block" />
            {" "}or against them.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-soft max-w-md mx-auto">
            A calm, focused sudoku you can share. Pick a difficulty, or invite someone in.
          </p>
        </section>

        {/* Daily puzzle — keystone retention. Always visible, prominent. */}
        <Link
          href="/sudoku/daily"
          className="group block rounded-2xl border border-brand/40 bg-gradient-to-br from-brand-soft via-paper to-paper p-5 sm:p-6 hover:border-brand hover:shadow-[var(--shadow-lifted)] transition-all duration-150"
        >
          <div className="flex items-center gap-5">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-warning-soft text-warning flex items-center justify-center text-2xl sm:text-3xl">
              🔥
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[11px] uppercase tracking-[0.18em] text-brand font-semibold">
                  Daily challenge
                </div>
                {dailyScore ? (
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-success-soft text-success font-medium">
                    Done today
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full bg-brand-soft text-brand font-medium">
                    {DIFFICULTY_LABEL[dailyDifficulty]}
                  </span>
                )}
              </div>
              <div className="font-display text-xl sm:text-2xl text-ink mt-1 leading-tight">
                {dailyScore
                  ? `Your best today: ${dailyScore.score.toLocaleString()}`
                  : "Today's puzzle — same for everyone"}
              </div>
              <div className="text-sm text-ink-soft mt-1">
                {streak && streak.current > 0
                  ? `${streak.current}-day streak · ${
                      streak.completedToday
                        ? "kept alive"
                        : "solve today to keep it going"
                    }`
                  : "Build a streak. Climb the daily leaderboard."}
              </div>
            </div>
            <ArrowIcon className="hidden sm:block text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-100" />
          </div>
        </Link>

        {activeGames.length > 0 && (
          <Section title="Resume" hint="Picked up from where you left off.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeGames.map((g) => (
                <Link
                  key={g.id}
                  href={`/sudoku/play/${g.id}`}
                  className="group flex items-center justify-between rounded-lg bg-paper border border-edge px-4 py-3 hover:border-edge-strong hover:shadow-[var(--shadow-soft)] transition-all duration-100"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium">
                      {MODE_LABEL[g.mode] ?? g.mode}
                    </div>
                    <div className="text-base font-medium text-ink mt-0.5">
                      {DIFFICULTY_LABEL[g.difficulty as Difficulty] ?? g.difficulty}
                    </div>
                  </div>
                  <ArrowIcon className="text-ink-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-100" />
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section title="Solo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIFFICULTIES.map((d) => (
              <Link
                key={d}
                href={`/sudoku/play?d=${d}`}
                className="group rounded-xl border border-edge bg-paper px-5 py-4 hover:border-edge-strong hover:shadow-[var(--shadow-soft)] hover:-translate-y-px transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-xl text-ink leading-snug">
                      {DIFFICULTY_LABEL[d]}
                    </div>
                    <div className="text-sm text-ink-soft mt-1">
                      {DIFFICULTY_DESC[d]}
                    </div>
                  </div>
                  <Pips
                    count={DIFFICULTY_PIPS[d]}
                    colorVar={`var(--${DIFFICULTY_TOKEN[d]})`}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Multiplayer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModeCard
              href="/sudoku/new-game?mode=race"
              icon={<RaceIcon />}
              title="Race a friend"
              description="Same puzzle, separate boards, fastest wins."
            />
            <ModeCard
              href="/sudoku/new-game?mode=coop"
              icon={<CoopIcon />}
              title="Co-op with a friend"
              description="Solve a single board together."
            />
          </div>
          <div className="mt-3">
            <JoinByCodeForm />
          </div>
        </Section>

        {!user && (
          <div className="rounded-xl border border-edge bg-paper-raised p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-display text-lg text-ink leading-tight">
                Save progress. Track stats. Challenge friends.
              </div>
              <div className="text-sm text-ink-soft mt-1">
                A free account, no fuss.
              </div>
            </div>
            <Link
              href="/sudoku/auth/sign-up"
              className="self-stretch sm:self-auto px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm text-center whitespace-nowrap transition-colors duration-75"
            >
              Create an account
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Pips({ count, colorVar }: { count: number; colorVar: string }) {
  return (
    <div className="flex items-center gap-1 pt-1" aria-label={`Difficulty ${count} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: i <= count ? colorVar : "transparent",
            border: i <= count ? "none" : "1px solid var(--edge-strong)",
          }}
        />
      ))}
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-edge bg-paper p-5 hover:border-edge-strong hover:shadow-[var(--shadow-soft)] hover:-translate-y-px transition-all duration-150"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-display text-lg text-ink leading-snug group-hover:text-brand transition-colors duration-75">
          {title}
        </div>
        <div className="text-sm text-ink-soft mt-1">{description}</div>
      </div>
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
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

function RaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function CoopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M17 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
