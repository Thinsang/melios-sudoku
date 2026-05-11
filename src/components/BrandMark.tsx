// A small 3x3 grid mark — a subtle nod to sudoku without being literal.
// Three cells are "filled" along the diagonal; the rest are tinted at low
// opacity, suggesting the puzzle pattern.

export function BrandMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const cell = 3.4;
  const gap = 0.6;
  const filled = new Set(["0,0", "1,1", "2,2"]);
  const tinted = new Set(["0,2", "2,0"]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const key = `${row},${col}`;
          const isFilled = filled.has(key);
          const isTinted = tinted.has(key);
          const x = col * (cell + gap);
          const y = row * (cell + gap);
          return (
            <rect
              key={key}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={0.6}
              fill="currentColor"
              opacity={isFilled ? 1 : isTinted ? 0.4 : 0.15}
            />
          );
        })
      )}
    </svg>
  );
}
