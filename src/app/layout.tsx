import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BoardThemeProvider } from "@/components/BoardThemeProvider";
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
    default: "Melio Games — Sudoku, Wordle, Crossword & more",
    template: "%s · Melio Games",
  },
  description:
    "Play free online puzzle games at Melio Games. Multiplayer sudoku with friends, races, co-op, and leaderboards. More games coming.",
  keywords: [
    "sudoku online",
    "multiplayer sudoku",
    "play sudoku with friends",
    "free sudoku",
    "sudoku race",
    "sudoku co-op",
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
    title: "Melio Games — Sudoku, Wordle, Crossword & more",
    description:
      "Play free online puzzle games. Multiplayer sudoku with friends, races, co-op, leaderboards.",
    url: SITE_URL,
    type: "website",
    siteName: "Melio Games",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Melio Games",
    description:
      "Free online puzzle games. Multiplayer sudoku with friends. More games coming.",
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
        <ThemeProvider>
          <BoardThemeProvider>{children}</BoardThemeProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
