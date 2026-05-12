/**
 * Multi-layer flame with a real fire gradient (deep red → orange →
 * yellow → bright tip). Replaces the 🔥 emoji in streak indicators —
 * the emoji renders inconsistently across platforms and looks generic
 * inside our brand-soft container; this is a proper graphic.
 *
 * Always renders in fire colors regardless of the surrounding text color,
 * so it works inside any container theme.
 */
export function FlameIcon({
  size = 24,
  className,
  /** When true, render in a muted/grayscale tone — for "streak broken" state. */
  dim = false,
}: {
  size?: number;
  className?: string;
  dim?: boolean;
}) {
  const idOuter = "flame-outer";
  const idInner = "flame-inner";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={idOuter} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor={dim ? "#9ca3af" : "#b91c1c"} />
          <stop offset="40%" stopColor={dim ? "#a3a3a3" : "#ea580c"} />
          <stop offset="80%" stopColor={dim ? "#d4d4d4" : "#f59e0b"} />
          <stop offset="100%" stopColor={dim ? "#e5e5e5" : "#fde68a"} />
        </linearGradient>
        <linearGradient id={idInner} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor={dim ? "#d4d4d4" : "#fbbf24"} />
          <stop offset="100%" stopColor={dim ? "#fafafa" : "#fef9c3"} />
        </linearGradient>
      </defs>
      {/* Outer flame — symmetric teardrop with a slight wave at the top */}
      <path
        d="M 12 1.8
           C 12 4.2 14 6 14.6 7.8
           C 15.2 9.3 17 11 17 14.5
           C 17 18.6 14.6 21.6 12 21.6
           C 9.4 21.6 7 18.6 7 14.5
           C 7 11.8 8.2 10 9.4 8.5
           C 10.5 7 11.4 5 12 1.8 Z"
        fill={`url(#${idOuter})`}
      />
      {/* Inner brighter heart — smaller, offset slightly up for hot-spot */}
      <path
        d="M 12 9.5
           C 12 11 13 11.8 13.4 13
           C 13.8 14 14.4 15 14.4 17
           C 14.4 19 13.2 20.4 12 20.4
           C 10.8 20.4 9.6 19 9.6 17
           C 9.6 15.5 10.4 14.5 11 13.5
           C 11.4 12.6 11.8 11 12 9.5 Z"
        fill={`url(#${idInner})`}
      />
    </svg>
  );
}
