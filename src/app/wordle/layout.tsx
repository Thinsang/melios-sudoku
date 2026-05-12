import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Wordle — Daily 5-letter Puzzle",
    template: "%s · Melio Wordle",
  },
  description:
    "A free, daily five-letter word puzzle. Six guesses, one answer, same word for everyone. Part of Melio Games.",
  keywords: [
    "wordle",
    "wordle online",
    "free wordle",
    "daily wordle",
    "5 letter word",
    "melio wordle",
  ],
  alternates: { canonical: "/wordle" },
  openGraph: {
    title: "Melio Wordle — Daily 5-letter Puzzle",
    description: "Free daily Wordle. Six guesses. New word every day.",
    url: "https://meliogames.com/wordle",
    type: "website",
    siteName: "Melio Wordle",
  },
};

export default function WordleLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
