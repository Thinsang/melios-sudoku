import {
  ACHIEVEMENTS,
  type AchievementProgress,
} from "@/lib/achievements";

/**
 * Renders the full achievement grid. Locked badges are grayscale + muted;
 * unlocked are full-color with a soft brand background. Tiered badges
 * show a progress bar underneath until they unlock.
 *
 * Pure presentational — give it a `progress` array (one entry per
 * ACHIEVEMENTS def, in any order). Missing IDs are treated as locked.
 */
export function AchievementsGrid({
  progress,
}: {
  progress: AchievementProgress[];
}) {
  const byId = new Map(progress.map((p) => [p.id, p]));
  const total = ACHIEVEMENTS.length;
  const unlockedCount = progress.filter((p) => p.unlocked).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-ink-soft">
        <span className="text-ink font-medium tabular-nums">
          {unlockedCount}
        </span>{" "}
        / {total} unlocked
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ACHIEVEMENTS.map((a) => {
          const p = byId.get(a.id) ?? { id: a.id, unlocked: false };
          const pct =
            a.target && p.current != null
              ? Math.min(100, Math.round((p.current / a.target) * 100))
              : null;
          return (
            <li
              key={a.id}
              title={a.description}
              className={
                "p-3 rounded-xl border transition-colors duration-75 " +
                (p.unlocked
                  ? "border-brand/30 bg-brand-soft"
                  : "border-edge bg-paper opacity-70")
              }
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={
                    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xl " +
                    (p.unlocked
                      ? "bg-paper text-brand"
                      : "bg-paper-raised grayscale opacity-60")
                  }
                  aria-hidden
                >
                  {a.glyph}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className={
                      "font-display text-sm leading-tight " +
                      (p.unlocked ? "text-ink" : "text-ink-soft")
                    }
                  >
                    {a.name}
                  </div>
                  <div className="text-[11px] text-ink-soft leading-snug mt-0.5">
                    {a.description}
                  </div>
                  {pct !== null && !p.unlocked && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-paper-raised overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-ink-faint mt-1 tabular-nums">
                        {p.current ?? 0} / {a.target}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
