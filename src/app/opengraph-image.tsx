import { ImageResponse } from "next/og";

export const alt = "Melio Games — A small collection of carefully made games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Open Graph card for the Melio Games hub. 1200×630 (the Facebook /
 * LinkedIn / Twitter recommended ratio). Rendered at the edge via
 * Vercel's @vercel/og.
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
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Wordmark in the top-left */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 32,
            color: "#1c1916",
            fontWeight: 600,
          }}
        >
          Melio <span style={{ color: "#6d28d9", fontStyle: "italic" }}>Games</span>
        </div>

        {/* Center: title */}
        <div
          style={{
            fontSize: 140,
            color: "#1c1916",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textAlign: "center",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <span>Melio&rsquo;s</span>
          <span style={{ color: "#6d28d9", fontStyle: "italic" }}>Games</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 32,
            fontSize: 36,
            color: "#6b6358",
            maxWidth: 800,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
          }}
        >
          Sudoku, Wordle, Crossword & more. Think and have fun.
        </div>

        {/* URL footer */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            right: 60,
            fontSize: 24,
            color: "#a39a8a",
            display: "flex",
          }}
        >
          meliogames.com
        </div>
      </div>
    ),
    { ...size }
  );
}
