import type { MetadataRoute } from "next";

const SITE_URL = "https://meliogames.com";

/**
 * Emitted at /robots.txt. Public game pages are crawlable; user-specific and
 * session-specific routes are blocked so Google doesn't try to crawl them
 * (it can't anyway — they require auth — but explicit disallow keeps the
 * crawl budget on content that matters).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sudoku", "/sudoku/play", "/sudoku/leaderboard"],
        disallow: [
          "/sudoku/auth/",
          "/sudoku/settings",
          "/sudoku/profile",
          "/sudoku/friends",
          "/sudoku/new-game",
          "/sudoku/play/", // /sudoku/play/<game-id> — private game rooms
          "/sudoku/u/", // public profiles — optional; can flip to allow once user count is meaningful
          "/sudoku/i/", // invite-code redirects, not pages
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
