import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getCurrentProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStreak } from "@/lib/daily";
import { HeaderRealtimeWatcher } from "./HeaderRealtimeWatcher";
import { ThemeToggle } from "./ThemeToggle";
import { BrandMark } from "./BrandMark";

export async function Header() {
  const profile = await getCurrentProfile();

  let pendingCount = 0;
  let streakCurrent = 0;
  let streakCompletedToday = false;
  if (profile) {
    const supabase = await createClient();
    const [reqCount, inviteCount, streak] = await Promise.all([
      supabase
        .from("friend_requests")
        .select("id", { count: "exact", head: true })
        .eq("to_user", profile.id)
        .eq("status", "pending"),
      supabase
        .from("game_invites")
        .select("id", { count: "exact", head: true })
        .eq("to_user", profile.id)
        .eq("status", "pending"),
      getUserStreak(profile.id),
    ]);
    pendingCount = (reqCount.count ?? 0) + (inviteCount.count ?? 0);
    streakCurrent = streak.current;
    streakCompletedToday = streak.completedToday;
  }

  return (
    <header className="w-full border-b border-edge bg-canvas/80 backdrop-blur supports-[backdrop-filter]:bg-canvas/70 sticky top-0 z-30">
      {profile && <HeaderRealtimeWatcher userId={profile.id} />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            aria-label="Melio's Games"
            className="text-ink-faint hover:text-ink transition-colors duration-75"
          >
            Melio
          </Link>
          <span className="text-ink-faint">/</span>
          <Link
            href="/sudoku"
            className="flex items-center gap-2 text-ink hover:text-brand transition-colors duration-75"
          >
            <span className="text-brand">
              <BrandMark size={16} />
            </span>
            <span className="font-display text-[1.05rem] tracking-tight font-semibold">
              Sudoku
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3 text-sm">
          {profile ? (
            <>
              {streakCurrent > 0 && (
                <Link
                  href="/sudoku/daily"
                  className={
                    "hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors duration-75 " +
                    (streakCompletedToday
                      ? "bg-success-soft text-success hover:bg-success-soft/80"
                      : "bg-warning-soft text-warning hover:bg-warning-soft/80")
                  }
                  title={
                    streakCompletedToday
                      ? `${streakCurrent}-day streak — today done`
                      : `${streakCurrent}-day streak — solve today to keep it`
                  }
                >
                  <span aria-hidden>🔥</span>
                  <span className="tabular-nums">{streakCurrent}</span>
                </Link>
              )}
              <NavLink href="/sudoku/daily">Daily</NavLink>
              <NavLink href="/sudoku/leaderboard">Leaderboard</NavLink>
              <NavLink href="/sudoku/friends" pendingCount={pendingCount}>
                Friends
              </NavLink>
              <NavLink href="/sudoku/profile">
                {profile.display_name ?? profile.username}
              </NavLink>
              <ThemeToggle />
              <Link
                href="/sudoku/settings"
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
                aria-label="Settings"
                title="Settings"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
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
              <NavLink href="/sudoku/daily">Daily</NavLink>
              <NavLink href="/sudoku/leaderboard">Leaderboard</NavLink>
              <ThemeToggle />
              <Link
                href="/sudoku/auth/sign-in"
                className="px-3 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
              >
                Sign in
              </Link>
              <Link
                href="/sudoku/auth/sign-up"
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

function NavLink({
  href,
  children,
  pendingCount,
}: {
  href: string;
  children: React.ReactNode;
  pendingCount?: number;
}) {
  return (
    <Link
      href={href}
      className="relative px-2.5 py-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper-raised transition-colors duration-75"
    >
      {children}
      {pendingCount && pendingCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full bg-brand text-brand-ink text-[10px] font-semibold">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      ) : null}
    </Link>
  );
}
