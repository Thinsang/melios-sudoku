import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BoardThemeProvider } from "@/components/BoardThemeProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { EmbedMode } from "@/components/EmbedMode";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

// metadataBase makes every relative URL in metadata (OG images, canonical, etc.)
// resolve to an absolute URL. Required for OG/Twitter cards to work.
const SITE_URL = "https://meliogames.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Melio Games — Sudoku, Wordle, Connections, Minesweeper, 2048",
    template: "%s · Melio Games",
  },
  description:
    "Free online puzzle games at Melio Games. Multiplayer sudoku, daily wordle, daily connections, classic minesweeper, and 2048. No ads, no tracking, just calm puzzles.",
  keywords: [
    "sudoku online",
    "multiplayer sudoku",
    "play sudoku with friends",
    "free sudoku",
    "sudoku race",
    "sudoku co-op",
    "wordle online",
    "free wordle",
    "connections puzzle",
    "minesweeper online",
    "2048 game",
    "puzzle games",
    "melio games",
    "melio sudoku",
  ],
  applicationName: "Melio Games",
  creator: "Melio",
  publisher: "Melio Games",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Melio Games — Sudoku, Wordle, Connections, Minesweeper, 2048",
    description:
      "Free online puzzle games. Multiplayer sudoku, daily wordle, connections, minesweeper, 2048.",
    url: SITE_URL,
    type: "website",
    siteName: "Melio Games",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Melio Games",
    description:
      "Free online puzzle games. Sudoku, Wordle, Connections, Minesweeper, 2048.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "games",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#100f0d" },
  ],
};

/**
 * Root layout. Wraps every route — both the Melio's Games hub at `/` and
 * the sudoku app under `/sudoku/*`. Holds only providers + analytics so
 * each section can ship its own chrome (header, footer).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {/* Reads ?embed=1 and toggles a body attribute so the CSS below
            hides our header/footer. Lets schools/Google Sites/Notion
            iframe a game cleanly. Wrapped in Suspense because
            useSearchParams forces opt-out of static rendering. */}
        <Suspense fallback={null}>
          <EmbedMode />
        </Suspense>
        <ThemeProvider>
          <BoardThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </BoardThemeProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
