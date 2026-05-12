import type { MetadataRoute } from "next";
import { DIFFICULTIES } from "@/lib/sudoku";

/**
 * Sitemap — emitted at /sitemap.xml. Lists every public, indexable route so
 * search crawlers can discover them. Private/auth routes are excluded here
 * AND blocked by robots.ts.
 */
const SITE_URL = "https://meliogames.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/sudoku`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/sudoku/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sudoku/daily`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Each difficulty's quick-play landing is its own indexable URL — useful for
  // long-tail searches like "sudoku expert online".
  const difficultyRoutes: MetadataRoute.Sitemap = DIFFICULTIES.map((d) => ({
    url: `${SITE_URL}/sudoku/play?d=${d}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Per-difficulty leaderboard pages — also good long-tail targets.
  const leaderboardRoutes: MetadataRoute.Sitemap = DIFFICULTIES.map((d) => ({
    url: `${SITE_URL}/sudoku/leaderboard?d=${d}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...difficultyRoutes, ...leaderboardRoutes];
}
