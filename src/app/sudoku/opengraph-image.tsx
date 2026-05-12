import { ImageResponse } from "next/og";

export const alt = "Melio Sudoku — Play online sudoku with friends";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG card for the sudoku section. Note: next/og uses Satori which only
 * supports CSS `display: flex | block | none`. No CSS Grid — the sudoku
 * snapshot below is built with nested flex rows.
 */
export default async function SudokuOpenGraphImage() {
  // 9x9 cells. Each: [value, "g"=given | "u"=user | "s"=selected | ""=empty]
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

  const CELL_SIZE = 44; // 9 * 44 = 396, plus borders
  const rows: Array<Array<[number, Kind]>> = [];
  for (let r = 0; r < 9; r++) {
    rows.push(cells.slice(r * 9, r * 9 + 9));
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#faf6ee",
          display: "flex",
          padding: 70,
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Sudoku grid — built as a stack of flex rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "3px solid #1c1916",
            borderRadius: 12,
            overflow: "hidden",
            background: "#1c1916",
            alignSelf: "center",
          }}
        >
          {rows.map((row, r) => (
            <div
              key={r}
              style={{
                display: "flex",
                marginBottom: r < 8 ? 1 : 0,
              }}
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
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: bg,
                      color,
                      fontSize: 28,
                      fontWeight: 700,
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

        {/* Right side: title, tagline, pills */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 70,
          }}
        >
          <div
            style={{
              fontSize: 26,
              color: "#a39a8a",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "flex",
            }}
          >
            Melio Sudoku
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 84,
              color: "#1c1916",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <span>Play</span>
            <span style={{ color: "#6d28d9", fontStyle: "italic" }}>sudoku</span>
            <span>online.</span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              color: "#6b6358",
              maxWidth: 560,
              display: "flex",
            }}
          >
            Five difficulties. Solo, race a friend, or co-op.
          </div>
          <div
            style={{
              marginTop: 26,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {["Solo", "Race", "Co-op", "Leaderboard"].map((t) => (
              <div
                key={t}
                style={{
                  background: "#ffffff",
                  border: "1px solid #ebe4d3",
                  borderRadius: 999,
                  padding: "6px 16px",
                  fontSize: 22,
                  color: "#6b6358",
                  display: "flex",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 22,
            color: "#a39a8a",
            display: "flex",
          }}
        >
          meliogames.com/sudoku
        </div>
      </div>
    ),
    { ...size }
  );
}
