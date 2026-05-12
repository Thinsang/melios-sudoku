/**
 * Filled lightning bolt with a yellow→amber gradient and a subtle darker
 * outline so the shape pops against any background. Replaces the
 * stroke-only bolt used for "Race a friend" — that one was a thin
 * outline silhouette that disappeared inside the brand-soft container.
 *
 * Always renders in bolt colors regardless of currentColor.
 */
export function BoltIcon({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = "bolt-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M14 2 L 4 13.5 L 10.5 13.5 L 9 22 L 20 9 L 13.2 9 L 14 2 Z"
        fill={`url(#${id})`}
        stroke="#92400e"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
