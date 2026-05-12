/**
 * Two overlapping circles — Venn-diagram style — in brand-purple shades.
 * Reads instantly as "two together / shared space" without the awkward
 * generic-Lucide silhouette feel of the old stroke-based 2-people icon.
 *
 * Used for "Co-op" mode card.
 */
export function PairIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      {/* Left circle — softer brand tone */}
      <circle cx="9" cy="12" r="6" fill="#a78bfa" opacity="0.85" />
      {/* Right circle — full brand */}
      <circle cx="15" cy="12" r="6" fill="#6d28d9" opacity="0.85" />
      {/* Overlap area — render via the two circles' opacity blending,
          plus a small accent dot in the center where they meet */}
      <circle cx="12" cy="12" r="0.9" fill="#fef3c7" opacity="0.95" />
    </svg>
  );
}
