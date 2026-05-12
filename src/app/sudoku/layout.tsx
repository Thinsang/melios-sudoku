import type { Metadata } from "next";
import { Header } from "@/components/Header";

/**
 * Layout for the sudoku section. Adds the sudoku Header (with Friends,
 * Leaderboard, profile, etc.) on top of the root providers. Anything outside
 * `/sudoku/*` (e.g. the Melio's Games hub at `/`) doesn't get this header.
 */

export const metadata: Metadata = {
  title: {
    default: "Melio's Sudoku",
    template: "%s · Melio's Sudoku",
  },
  description: "Sudoku — solo, co-op, or race. Play online with friends.",
  openGraph: {
    title: "Melio's Sudoku",
    description: "Solo, with friends, or against them.",
    type: "website",
    siteName: "Melio's Sudoku",
  },
  twitter: {
    card: "summary",
    title: "Melio's Sudoku",
    description: "Solo, with friends, or against them.",
  },
};

export default function SudokuLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
