/**
 * User avatar. Falls back to a circular monogram (first letter of display
 * name or username) on a brand-soft background when no `src` is provided
 * or the image fails to load.
 *
 * Server-rendered: no client state. The fallback is always rendered as a
 * sibling at the same position, then hidden via CSS when the image
 * actually loads. If `src` is null/empty we skip the <img> entirely.
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

  return (
    <span
      className={
        "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-brand-soft text-brand font-medium select-none ring-1 ring-edge " +
        className
      }
      style={{ width: dim, height: dim, fontSize: Math.round(size * 0.42) }}
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
