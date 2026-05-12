import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for Melio Games. Play fair, don't break the site, we provide it as-is.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "May 2026";

export default function TermsPage() {
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
              Terms
            </h1>
            <p className="text-sm text-ink-faint mt-2">
              Last updated {LAST_UPDATED}.
            </p>
          </header>

          <div className="text-ink-soft leading-relaxed flex flex-col gap-6 text-base">
            <p>
              By using Melio Games (meliogames.com and any sub-routes) you
              agree to the following. Plain English, no legalese theatre.
            </p>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">Be decent</h2>
              <ul className="list-disc pl-5 flex flex-col gap-2">
                <li>
                  Don&rsquo;t harass other players. Don&rsquo;t use slurs in
                  your username or display name.
                </li>
                <li>
                  Don&rsquo;t cheat — no automated solvers, no script
                  submissions. Scores from cheaters get wiped.
                </li>
                <li>
                  Don&rsquo;t attempt to break, probe, or overload the service.
                  Standard penetration-testing rules of engagement apply if you
                  want to report vulnerabilities; email us first.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                Your account
              </h2>
              <p>
                You&rsquo;re responsible for keeping your sign-in credentials
                safe. We can suspend or terminate an account that violates
                these terms. You can delete your account at any time by
                emailing{" "}
                <a
                  href="mailto:hello@meliogames.com"
                  className="text-brand hover:underline"
                >
                  hello@meliogames.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">
                Your content
              </h2>
              <p>
                You own your username, display name, and any game data tied to
                your account. By posting it to a leaderboard you grant us a
                non-exclusive licence to display it where the game shows
                rankings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">As-is</h2>
              <p>
                The service is provided as-is, without warranties of any kind.
                We aim for high uptime but make no guarantees, and we&rsquo;re
                not liable for indirect or consequential damages. Where local
                law gives you stronger consumer rights, those still apply.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl text-ink mb-2">Changes</h2>
              <p>
                If we update these terms in a material way, we&rsquo;ll bump
                the date at the top and announce it in-app or by email if
                you&rsquo;re signed up. Continued use means you accept the
                update.
              </p>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
