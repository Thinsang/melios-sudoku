import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Minesweeper — Classic Logic Puzzle",
    template: "%s · Melio Minesweeper",
  },
  description:
    "Play the classic Minesweeper online for free. Beginner, Intermediate, and Expert grids. Tap to reveal, flag the mines, race the clock. Part of Melio Games.",
  keywords: [
    "minesweeper",
    "minesweeper online",
    "free minesweeper",
    "play minesweeper",
    "melio games",
  ],
  alternates: { canonical: "/minesweeper" },
  openGraph: {
    title: "Melio Minesweeper",
    description: "Classic Minesweeper online — free, three difficulties.",
    url: "https://meliogames.com/minesweeper",
    type: "website",
    siteName: "Melio Minesweeper",
  },
};

export default function MinesweeperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
