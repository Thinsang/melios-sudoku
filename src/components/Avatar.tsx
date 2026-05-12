/**
 * Tasteful set of monogram backgrounds. We pick deterministically from
 * `name`, so a given user always gets the same color across the site.
 * Colors are warm + saturated enough to read on both light and dark
 * page backgrounds. Foreground (text) color is paired per palette to
 * stay accessible.
 */
const PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "#ede4fe", fg: "#5b21b6" }, // brand purple (matches default)
  { bg: "#dbeafe", fg: "#1e3a8a" }, // blue
  { bg: "#dcfce7", fg: "#166534" }, // green
  { bg: "#fef3c7", fg: "#92400e" }, // amber
  { bg: "#fce7f3", fg: "#9d174d" }, // pink
  { bg: "#fee2e2", fg: "#991b1b" }, // red
  { bg: "#ccfbf1", fg: "#115e59" }, // teal
  { bg: "#f3e8ff", fg: "#6b21a8" }, // violet
  { bg: "#fed7aa", fg: "#9a3412" }, // orange
  { bg: "#e0e7ff", fg: "#3730a3" }, // indigo
];

/** Tiny FNV-1a hash so the same `name` always picks the same palette. */
function paletteFor(name: string): { bg: string; fg: string } {
  let h = 2166136261 >>> 0;
  const s = name || "?";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return PALETTES[h % PALETTES.length];
}

/**
 * User avatar. Falls back to a circular monogram (first letter of display
 * name or username) on a hash-of-name background color when no `src` is
 * provided or the image fails to load.
 *
 * Server-rendered: no client state. The fallback is always rendered as a
 * sibling at the same position; the <img> overlays it when present.
 */
export function Avatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const dim = `${size}px`;
  const { bg, fg } = paletteFor(name);

  return (
    <span
      className={
        "relative inline-flex items-center justify-center rounded-full overflow-hidden font-medium select-none ring-1 ring-edge " +
        className
      }
      style={{
        width: dim,
        height: dim,
        fontSize: Math.round(size * 0.42),
        backgroundColor: bg,
        color: fg,
      }}
      aria-hidden
    >
      <span>{initial}</span>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </span>
  );
}
