import { ImageResponse } from "next/og";

export const alt = "Melio Games — Sudoku, Wordle, Crossword & more";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Open Graph card for the Melio Games hub. 1200x630. Composition: bold serif
 * title block on the left, a fanned stack of three game-preview tiles on
 * the right (Sudoku in front, Wordle and Crossword behind). Built with
 * nested flex layouts — next/og's Satori renderer doesn't support CSS grid.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#faf6ee",
          display: "flex",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* ===== LEFT: Text block ===== */}
        <div
          style={{
            width: 640,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px 0 70px 80px",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#a39a8a",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "flex",
            }}
          >
            Melio Games
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 108,
              color: "#1c1916",
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <span>Melio&rsquo;s</span>
            <span style={{ color: "#6d28d9", fontStyle: "italic" }}>Games</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              color: "#6b6358",
              maxWidth: 480,
              lineHeight: 1.3,
              display: "flex",
            }}
          >
            Free puzzle games. Sudoku, Wordle, Crossword & more.
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 22,
              color: "#a39a8a",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: "#6d28d9",
                display: "flex",
              }}
            />
            meliogames.com
          </div>
        </div>

        {/* ===== RIGHT: Game-tile shelf ===== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "#f0eadc",
            borderLeft: "1px solid #ebe4d3",
          }}
        >
          {/* Wordle tiles — top, rotated left, behind */}
          <div
            style={{
              position: "absolute",
              top: 80,
              left: 40,
              display: "flex",
              gap: 6,
              transform: "rotate(-7deg)",
            }}
          >
            {[
              { l: "M", bg: "#6aaa64", fg: "#ffffff" },
              { l: "E", bg: "#6aaa64", fg: "#ffffff" },
              { l: "L", bg: "#c9b458", fg: "#ffffff" },
              { l: "I", bg: "#ffffff", fg: "#1c1916" },
              { l: "O", bg: "#ffffff", fg: "#1c1916" },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  width: 60,
                  height: 60,
                  background: t.bg,
                  color: t.fg,
                  border:
                    t.bg === "#ffffff"
                      ? "2px solid #d4cab1"
                      : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                  fontFamily: "sans-serif",
                  borderRadius: 4,
                  boxShadow: "0 6px 16px rgba(28,25,22,0.12)",
                }}
              >
                {t.l}
              </div>
            ))}
          </div>

          {/* Crossword — bottom, slight left rotation, middle z */}
          <div
            style={{
              position: "absolute",
              bottom: 80,
              right: 40,
              display: "flex",
              flexDirection: "column",
              transform: "rotate(6deg)",
              border: "3px solid #1c1916",
              borderRadius: 6,
              background: "#1c1916",
              boxShadow: "0 10px 24px rgba(28,25,22,0.14)",
            }}
          >
            {[
              [{ v: "M", bg: "#ffffff" }, { v: "", bg: "#ffffff" }, { v: "", bg: "#1c1916" }, { v: "C", bg: "#ffffff" }],
              [{ v: "E", bg: "#ffffff" }, { v: "", bg: "#1c1916" }, { v: "", bg: "#ffffff" }, { v: "A", bg: "#ffffff" }],
              [{ v: "L", bg: "#ffffff" }, { v: "I", bg: "#ffffff" }, { v: "F", bg: "#ffffff" }, { v: "T", bg: "#ffffff" }],
              [{ v: "I", bg: "#ffffff" }, { v: "", bg: "#1c1916" }, { v: "", bg: "#ffffff" }, { v: "S", bg: "#ffffff" }],
            ].map((row, r) => (
              <div
                key={r}
                style={{ display: "flex", marginBottom: r < 3 ? 1 : 0 }}
              >
                {row.map((c, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: 36,
                      height: 36,
                      background: c.bg,
                      color: "#1c1916",
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: ci < 3 ? 1 : 0,
                    }}
                  >
                    {c.v}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Sudoku grid — center, front, slight right rotation */}
          <SudokuStackPreview />
        </div>
      </div>
    ),
    { ...size }
  );
}

/**
 * 9x9 sudoku grid for the OG hero. Big "Solved partway" snapshot rendered as
 * nested flex rows because Satori doesn't do CSS grid.
 */
function SudokuStackPreview() {
  type Kind = "g" | "u" | "s" | "";
  const cells: Array<[number, Kind]> = [
    [5, "g"], [3, "g"], [0, ""], [0, ""], [7, "g"], [0, ""], [0, ""], [0, ""], [0, ""],
    [6, "g"], [0, ""], [0, ""], [1, "g"], [9, "g"], [5, "g"], [0, ""], [0, ""], [0, ""],
    [0, ""], [9, "u"], [8, "g"], [0, ""], [0, ""], [0, ""], [0, ""], [6, "g"], [0, ""],
    [8, "g"], [0, ""], [0, ""], [0, ""], [6, "u"], [0, ""], [0, ""], [0, ""], [3, "g"],
    [4, "g"], [0, ""], [0, ""], [8, "g"], [0, "s"], [3, "g"], [0, ""], [0, ""], [1, "g"],
    [7, "g"], [0, ""], [0, ""], [0, ""], [2, "g"], [0, ""], [0, ""], [0, ""], [6, "g"],
    [0, ""], [6, "g"], [0, ""], [0, ""], [0, ""], [0, ""], [2, "u"], [8, "g"], [0, ""],
    [0, ""], [0, ""], [0, ""], [4, "g"], [1, "g"], [9, "u"], [0, ""], [0, ""], [5, "g"],
    [0, ""], [0, ""], [0, ""], [0, ""], [8, "g"], [0, ""], [0, ""], [7, "g"], [9, "g"],
  ];

  const rows: typeof cells[] = [];
  for (let r = 0; r < 9; r++) rows.push(cells.slice(r * 9, r * 9 + 9));

  const CELL = 36;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "3px solid #1c1916",
        borderRadius: 8,
        background: "#1c1916",
        transform: "rotate(4deg)",
        boxShadow: "0 28px 48px rgba(28,25,22,0.22)",
      }}
    >
      {rows.map((row, r) => (
        <div
          key={r}
          style={{ display: "flex", marginBottom: r < 8 ? 1 : 0 }}
        >
          {row.map(([value, kind], c) => {
            const isSelected = kind === "s";
            const isGiven = kind === "g";
            const isUser = kind === "u" || kind === "s";
            const bg = isSelected ? "#ede4fe" : "#ffffff";
            const color = isGiven
              ? "#1c1916"
              : isUser
                ? "#6d28d9"
                : "transparent";
            return (
              <div
                key={c}
                style={{
                  width: CELL,
                  height: CELL,
                  background: bg,
                  color,
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: c < 8 ? 1 : 0,
                }}
              >
                {value || ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
