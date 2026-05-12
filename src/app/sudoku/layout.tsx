import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Layout for the sudoku section. Adds the sudoku Header (with Friends,
 * Leaderboard, profile, etc.) on top of the root providers. Anything outside
 * `/sudoku/*` (e.g. the Melio's Games hub at `/`) doesn't get this header.
 */

export const metadata: Metadata = {
  title: {
    default: "Play Sudoku Online — Solo, Race, Co-op",
    template: "%s · Melio Sudoku",
  },
  description:
    "Play sudoku online for free. Five difficulties from Easy to Extreme. Race a friend across the same puzzle, solve one together, or play solo. Live multiplayer, scoring, leaderboards.",
  keywords: [
    "sudoku online",
    "free sudoku",
    "multiplayer sudoku",
    "sudoku with friends",
    "sudoku race",
    "sudoku co-op",
    "sudoku easy",
    "sudoku hard",
    "sudoku expert",
    "sudoku extreme",
    "daily sudoku",
    "melio sudoku",
  ],
  alternates: {
    canonical: "/sudoku",
  },
  openGraph: {
    title: "Play Sudoku Online — Solo, Race, Co-op",
    description:
      "Free online sudoku with friends. Five difficulties, live multiplayer, leaderboards.",
    url: "https://meliogames.com/sudoku",
    type: "website",
    siteName: "Melio Sudoku",
  },
  twitter: {
    card: "summary_large_image",
    title: "Melio Sudoku",
    description: "Free online sudoku. Race friends. Co-op. Five difficulties.",
  },
};

export default function SudokuLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <SiteFooter />
    </>
  );
}
