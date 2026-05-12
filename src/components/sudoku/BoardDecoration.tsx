"use client";

import { BoardThemeId } from "@/lib/board-themes";

/**
 * Decorative SVG illustrations that frame the sudoku board without covering
 * the playable cells. Positioned absolutely BEHIND the board (negative z) so
 * the cells (which are opaque) sit on top of any overlap — meaning the user
 * only sees decoration in the area immediately surrounding the board's outer
 * border.
 *
 * Each theme that has decoration ships its own SVG. Themes that are meant to
 * be clean (Paper, Slate, Mono) return null.
 */
export function BoardDecoration({ theme }: { theme: BoardThemeId }) {
  switch (theme) {
    case "sakura":
      return <SakuraDecoration />;
    case "midnight":
      return <MidnightDecoration />;
    case "forest":
      return <ForestDecoration />;
    case "coral":
      return <CoralDecoration />;
    default:
      return null;
  }
}

const FRAME_CLS =
  "pointer-events-none absolute -inset-3 sm:-inset-6 lg:-inset-10 -z-10 overflow-visible";

/* =========================================================================
 * Sakura — cherry blossom branches anchored at top-right and bottom-left,
 * with scattered falling petals along the sides.
 * =======================================================================*/

function SakuraDecoration() {
  return (
    <div className={FRAME_CLS} aria-hidden>
      {/* Top-right branch */}
      <svg
        viewBox="0 0 120 120"
        className="absolute right-0 -top-1 w-24 sm:w-32 lg:w-40"
        preserveAspectRatio="xMaxYMin meet"
      >
        <Branch d="M120,0 Q90,15 70,40 Q55,60 35,75 Q20,85 0,90" />
        <Blossom cx={70} cy={40} size={10} />
        <Blossom cx={92} cy={20} size={8} />
        <Blossom cx={45} cy={68} size={9} />
        <Blossom cx={28} cy={80} size={7} bud />
        <Blossom cx={110} cy={6} size={6} bud />
        <FallingPetal cx={58} cy={48} rotate={-20} />
        <FallingPetal cx={20} cy={95} rotate={40} opacity={0.6} />
      </svg>

      {/* Bottom-left branch (mirrored, smaller) */}
      <svg
        viewBox="0 0 120 120"
        className="absolute left-0 -bottom-1 w-20 sm:w-28 lg:w-36"
        preserveAspectRatio="xMinYMax meet"
      >
        <Branch d="M0,120 Q25,110 45,90 Q60,75 80,65 Q100,55 120,55" />
        <Blossom cx={45} cy={90} size={9} />
        <Blossom cx={80} cy={65} size={8} />
        <Blossom cx={20} cy={113} size={6} bud />
        <Blossom cx={108} cy={58} size={7} bud />
        <FallingPetal cx={62} cy={100} rotate={120} opacity={0.5} />
      </svg>

      {/* Scattered petals along the right edge */}
      <svg
        viewBox="0 0 40 200"
        className="absolute right-0 top-1/4 h-1/2 w-6 sm:w-8"
        preserveAspectRatio="xMaxYMid meet"
      >
        <FallingPetal cx={20} cy={30} rotate={45} opacity={0.55} />
        <FallingPetal cx={10} cy={90} rotate={120} opacity={0.4} />
        <FallingPetal cx={28} cy={150} rotate={-30} opacity={0.5} />
      </svg>
    </div>
  );
}

function Branch({ d }: { d: string }) {
  return (
    <path
      d={d}
      stroke="#6b3a1a"
      strokeWidth={2.5}
      strokeLinecap="round"
      fill="none"
      opacity={0.85}
    />
  );
}

function Blossom({
  cx,
  cy,
  size = 8,
  bud,
}: {
  cx: number;
  cy: number;
  size?: number;
  bud?: boolean;
}) {
  const petalColor = bud ? "#ffd1dc" : "#ffb7c5";
  const centerColor = bud ? "#ffb6c8" : "#fff7a8";
  return (
    <g transform={`translate(${cx},${cy})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx={0}
          cy={-size * 0.6}
          rx={size * 0.45}
          ry={size * 0.7}
          fill={petalColor}
          transform={`rotate(${angle})`}
          opacity={0.95}
        />
      ))}
      <circle r={size * 0.22} fill={centerColor} />
    </g>
  );
}

function FallingPetal({
  cx,
  cy,
  rotate = 0,
  opacity = 0.7,
}: {
  cx: number;
  cy: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={3.5}
      ry={5}
      fill="#ffc6d4"
      opacity={opacity}
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  );
}

/* =========================================================================
 * Midnight — scattered stars and a crescent moon.
 * =======================================================================*/

function MidnightDecoration() {
  // A handful of stars at fixed-feeling-random positions around the board.
  const stars: Array<{ x: number; y: number; r: number; o: number }> = [
    { x: 5, y: 12, r: 1.4, o: 0.9 },
    { x: 18, y: 4, r: 0.8, o: 0.6 },
    { x: 32, y: 9, r: 1.0, o: 0.75 },
    { x: 96, y: 6, r: 1.2, o: 0.85 },
    { x: 82, y: 14, r: 0.7, o: 0.5 },
    { x: 92, y: 22, r: 1.1, o: 0.75 },
    { x: 3, y: 50, r: 1.3, o: 0.8 },
    { x: 8, y: 78, r: 0.9, o: 0.6 },
    { x: 97, y: 55, r: 1.0, o: 0.7 },
    { x: 94, y: 85, r: 1.5, o: 0.9 },
    { x: 88, y: 95, r: 0.7, o: 0.5 },
    { x: 15, y: 95, r: 1.1, o: 0.75 },
    { x: 36, y: 97, r: 0.8, o: 0.55 },
    { x: 60, y: 3, r: 0.9, o: 0.6 },
    { x: 70, y: 96, r: 1.0, o: 0.7 },
  ];

  return (
    <div className={FRAME_CLS} aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#dbe4ff"
            opacity={s.o}
          />
        ))}
        {/* Four-point stars for a bit of sparkle */}
        <FourPointStar cx={12} cy={28} size={3} opacity={0.7} />
        <FourPointStar cx={88} cy={40} size={4} opacity={0.85} />
        <FourPointStar cx={6} cy={88} size={2.5} opacity={0.65} />
      </svg>

      {/* Crescent moon in the top-right corner area, outside the board */}
      <svg
        viewBox="0 0 60 60"
        className="absolute -top-2 -right-2 w-10 sm:w-14 lg:w-16"
      >
        <defs>
          <mask id="moon-mask">
            <rect width="60" height="60" fill="white" />
            <circle cx="36" cy="22" r="20" fill="black" />
          </mask>
        </defs>
        <circle
          cx={30}
          cy={26}
          r={20}
          fill="#f5f0d8"
          opacity={0.92}
          mask="url(#moon-mask)"
        />
      </svg>
    </div>
  );
}

function FourPointStar({
  cx,
  cy,
  size,
  opacity,
}: {
  cx: number;
  cy: number;
  size: number;
  opacity: number;
}) {
  // Diamond + perpendicular thin diamond, both centered at cx,cy.
  return (
    <g transform={`translate(${cx},${cy})`} opacity={opacity}>
      <path
        d={`M0,-${size} L${size * 0.35},0 L0,${size} L-${size * 0.35},0 Z`}
        fill="#f5f0d8"
      />
      <path
        d={`M-${size},0 L0,-${size * 0.35} L${size},0 L0,${size * 0.35} Z`}
        fill="#f5f0d8"
      />
    </g>
  );
}

/* =========================================================================
 * Forest — pine branches at corners.
 * =======================================================================*/

function ForestDecoration() {
  return (
    <div className={FRAME_CLS} aria-hidden>
      <svg
        viewBox="0 0 120 120"
        className="absolute -top-2 -right-2 w-24 sm:w-32 lg:w-40"
        preserveAspectRatio="xMaxYMin meet"
      >
        <PineBranch transform="translate(20,5) rotate(20)" />
      </svg>
      <svg
        viewBox="0 0 120 120"
        className="absolute -bottom-2 -left-2 w-20 sm:w-28 lg:w-36"
        preserveAspectRatio="xMinYMax meet"
      >
        <PineBranch transform="translate(15,90) rotate(-160)" />
      </svg>
      {/* A couple of falling leaves */}
      <svg
        viewBox="0 0 40 200"
        className="absolute right-0 top-1/4 h-1/2 w-5"
        preserveAspectRatio="xMaxYMid meet"
      >
        <Leaf cx={20} cy={40} rotate={30} />
        <Leaf cx={12} cy={100} rotate={-25} opacity={0.6} />
        <Leaf cx={26} cy={160} rotate={70} opacity={0.5} />
      </svg>
    </div>
  );
}

function PineBranch({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      {/* Branch */}
      <path
        d="M0,0 L70,0"
        stroke="#5a3f23"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Needle clusters (groups of small lines fanning out) */}
      {[10, 25, 40, 55, 68].map((x, i) => (
        <g key={i} transform={`translate(${x},0)`}>
          {[-35, -20, -5, 10, 25, 40, 55].map((a, j) => (
            <line
              key={j}
              x1={0}
              y1={0}
              x2={9 * Math.cos((a * Math.PI) / 180)}
              y2={9 * Math.sin((a * Math.PI) / 180)}
              stroke="#5e8a4f"
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

function Leaf({
  cx,
  cy,
  rotate = 0,
  opacity = 0.75,
}: {
  cx: number;
  cy: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rotate})`} opacity={opacity}>
      <path
        d="M0,-6 Q4,-3 4,3 Q0,6 -4,3 Q-4,-3 0,-6 Z"
        fill="#a0c878"
      />
      <line x1={0} y1={-6} x2={0} y2={6} stroke="#5e8a4f" strokeWidth={0.5} />
    </g>
  );
}

/* =========================================================================
 * Coral — sun rays + simple waves.
 * =======================================================================*/

function CoralDecoration() {
  return (
    <div className={FRAME_CLS} aria-hidden>
      {/* Sun rays radiating from upper-right corner */}
      <svg
        viewBox="0 0 100 100"
        className="absolute -top-2 -right-2 w-24 sm:w-32 lg:w-40"
        preserveAspectRatio="xMaxYMin meet"
      >
        <g transform="translate(100,0)">
          <circle r={14} fill="#fbb88e" opacity={0.65} />
          {[200, 215, 230, 245].map((a) => (
            <line
              key={a}
              x1={0}
              y1={0}
              x2={36 * Math.cos((a * Math.PI) / 180)}
              y2={36 * Math.sin((a * Math.PI) / 180)}
              stroke="#fbb88e"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.7}
            />
          ))}
        </g>
      </svg>

      {/* Wave at bottom edge */}
      <svg
        viewBox="0 0 200 30"
        className="absolute -bottom-2 left-2 right-2 h-6 sm:h-8 w-[calc(100%-1rem)]"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 Q25,8 50,20 T100,20 T150,20 T200,20"
          fill="none"
          stroke="#fbb88e"
          strokeWidth={2}
          opacity={0.7}
        />
        <path
          d="M0,26 Q25,16 50,26 T100,26 T150,26 T200,26"
          fill="none"
          stroke="#fbb88e"
          strokeWidth={1.5}
          opacity={0.45}
        />
      </svg>
    </div>
  );
}
