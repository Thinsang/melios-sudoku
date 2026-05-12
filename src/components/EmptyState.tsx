import Link from "next/link";

/**
 * Friendly empty state with a glyph, heading, copy and an optional CTA.
 * Used wherever a list might be empty (friends, profile recent games,
 * leaderboard for a difficulty no one has played).
 *
 * Visual: warm soft-brand card with generous padding, dashed border to
 * read as "nothing here yet" rather than a styling mistake.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: { label: string; href: string };
  size?: "sm" | "md";
}) {
  return (
    <div
      className={
        "rounded-2xl border border-dashed border-edge-strong bg-paper text-center flex flex-col items-center " +
        (size === "sm" ? "p-6 gap-2" : "p-8 sm:p-10 gap-3")
      }
    >
      {icon && (
        <div
          className={
            "rounded-full bg-brand-soft text-brand flex items-center justify-center " +
            (size === "sm" ? "w-10 h-10 text-lg" : "w-14 h-14 text-2xl")
          }
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3
        className={
          "font-display text-ink leading-tight " +
          (size === "sm" ? "text-base" : "text-xl")
        }
      >
        {title}
      </h3>
      {description && (
        <p
          className={
            "text-ink-soft max-w-sm " +
            (size === "sm" ? "text-xs" : "text-sm")
          }
        >
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className={
            "mt-1 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium transition-colors duration-75 " +
            (size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm")
          }
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
