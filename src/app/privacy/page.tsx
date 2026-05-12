import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Melio Games collects, how we use it, and what we don't do. Short, plain English.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "May 2026";

export default function PrivacyPage() {
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
              Privacy
            </h1>
            <p className="text-sm text-ink-faint mt-2">
              Last updated {LAST_UPDATED}.
            </p>
          </header>

          <div className="text-ink-soft leading-relaxed flex flex-col gap-6 text-base">
            <p>
              This is the short, plain-English version. If anything below is
              unclear, email{" "}
              <a
                href="mailto:hello@meliogames.com"
                className="text-brand hover:underline"
              >
                hello@meliogames.com
              </a>
              .
            </p>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                What we collect
              </h2>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>
                  <strong className="text-ink">Account info:</strong> if you
                  sign up, we store your email (for sign-in) and a username +
                  optional display name (shown on leaderboards and to friends).
                </li>
                <li>
                  <strong className="text-ink">Game data:</strong> your
                  finished games, scores, times, mistakes, hints used, and
                  daily-puzzle history — so you can see your stats and we can
                  rank the leaderboard.
                </li>
                <li>
                  <strong className="text-ink">Social graph:</strong> the
                  friends you connect with and pending requests/invites.
                </li>
                <li>
                  <strong className="text-ink">Anonymous analytics:</strong>{" "}
                  page loads and performance metrics via Vercel Analytics and
                  Vercel Speed Insights. No personal profile is built; no data
                  is sold.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                What we don&rsquo;t do
              </h2>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>We don&rsquo;t sell or rent your data.</li>
                <li>
                  We don&rsquo;t run third-party ads or ad-tracking trackers.
                </li>
                <li>
                  We don&rsquo;t share your email with other players. Other
                  players only see your username + display name.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">Cookies</h2>
              <p>
                We use a small set of cookies that are strictly necessary to
                keep you signed in (Supabase auth) and to remember your theme
                preference. No advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                Sub-processors
              </h2>
              <p>
                The site runs on Vercel (hosting + analytics) and Supabase
                (auth + database + realtime). Email magic links go through
                Supabase&rsquo;s email provider.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                Your rights
              </h2>
              <p>
                You can sign out, delete your account, or request a copy /
                deletion of your data at any time. Email{" "}
                <a
                  href="mailto:hello@meliogames.com"
                  className="text-brand hover:underline"
                >
                  hello@meliogames.com
                </a>{" "}
                and we&rsquo;ll handle it within a reasonable window (a few
                business days).
              </p>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
