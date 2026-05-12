import type { MetadataRoute } from "next";

/**
 * Web App Manifest — emitted at /manifest.webmanifest. Makes the site
 * installable as a standalone app on Chrome, Edge, and Safari iOS.
 *
 * We use the existing icon.svg for `any` purpose so we don't need to
 * ship a PNG set. Chrome accepts SVG; Safari falls back to its own
 * snapshot of the home page. Add 192x192 + 512x512 PNGs later if we
 * want a richer iOS install icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Melio Games",
    short_name: "Melio",
    description:
      "Free online puzzle games. Multiplayer sudoku with friends, daily wordle, leaderboards.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf6ee",
    theme_color: "#6d28d9",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["games", "entertainment", "puzzles"],
    lang: "en-US",
    dir: "ltr",
  };
}
