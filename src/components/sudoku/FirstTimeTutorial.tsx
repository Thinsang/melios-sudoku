"use client";

import { useEffect, useState } from "react";

/**
 * First-time tutorial. Shows a 4-step walkthrough modal once per device.
 * Dismissal is stored in localStorage under `melio_tutorial_seen`. Users
 * can re-open it from the settings page (Replay tutorial) which clears
 * the key.
 *
 * Designed as a single floating card so it's the same on mobile and
 * desktop. Doesn't pin to specific UI elements — copy describes them by
 * name, which is robust across screen sizes and themes.
 */

const STORAGE_KEY = "melio_tutorial_seen_v1";

interface Step {
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Tap a cell, then a number",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
    body: (
      <>
        Pick any empty cell, then choose a digit from the pad below the board.
        Same column, row, and 3×3 box can&rsquo;t repeat.
      </>
    ),
  },
  {
    title: "Notes mode for hypotheses",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    body: (
      <>
        Tap the <strong className="text-ink">notes</strong> button on the pad to
        toggle pencil-mark mode. Then tap digits to add small candidates inside
        a cell. Tap again to remove.
      </>
    ),
  },
  {
    title: "Hints when you&rsquo;re stuck",
    icon: <span aria-hidden>💡</span>,
    body: (
      <>
        You get <strong className="text-ink">3 hints</strong> per puzzle.
        Selecting a cell and tapping the hint button fills it with the right
        digit — but each hint costs 25% of your final score.
      </>
    ),
  },
  {
    title: "Pause anytime",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
    body: (
      <>
        The pause button above the board freezes the timer. Your score blends
        time, mistakes, and hints used — push for speed, then chase a higher
        score on a replay.
      </>
    ),
  },
];

export function FirstTimeTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // localStorage isn't available during SSR/initial render, so we must
    // read it post-mount. The "no setState in effect" rule doesn't fit here
    // — there's no other way to gate on a client-only value.
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!seen) setOpen(true);
    } catch {
      // localStorage may throw in private modes; just show the tutorial then.
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="bg-paper border border-edge rounded-2xl shadow-[var(--shadow-lifted)] w-full max-w-sm p-6 sm:p-7 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center text-2xl">
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint font-medium">
              Step {step + 1} of {STEPS.length}
            </div>
            <h2
              id="tutorial-title"
              className="font-display text-xl text-ink leading-snug"
            >
              {s.title}
            </h2>
          </div>
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "w-1.5 h-1.5 rounded-full transition-colors duration-150 " +
                (i === step ? "bg-brand" : "bg-edge")
              }
              aria-hidden
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 rounded-md text-ink-soft hover:text-ink text-sm font-medium transition-colors duration-75"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-3.5 py-1.5 rounded-md border border-edge bg-paper hover:bg-paper-raised text-ink text-sm font-medium transition-colors duration-75"
              >
                Back
              </button>
            )}
            {last ? (
              <button
                type="button"
                onClick={dismiss}
                className="px-4 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
              >
                Got it
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-brand-ink text-sm font-medium transition-colors duration-75"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to reset the tutorial-seen flag — wired into Settings so users
 * can replay the walkthrough if they want.
 */
export function resetTutorial() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
