import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BoardThemeProvider } from "@/components/BoardThemeProvider";

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
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#100f0d" },
  ],
};

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
          <BoardThemeProvider>
            <Header />
            {children}
          </BoardThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
