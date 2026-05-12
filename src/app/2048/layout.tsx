import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "2048 — Slide and Merge to Reach 2048",
    template: "%s · Melio 2048",
  },
  description:
    "Play 2048 online for free. Slide tiles, merge matching numbers, race to 2048 and beyond. Touch + keyboard controls.",
  keywords: [
    "2048",
    "2048 game",
    "play 2048",
    "free 2048",
    "melio games",
  ],
  alternates: { canonical: "/2048" },
  openGraph: {
    title: "Melio 2048",
    description: "Slide tiles, merge, race to 2048. Free, no ads.",
    url: "https://meliogames.com/2048",
    type: "website",
    siteName: "Melio 2048",
  },
};

export default function TwentyFortyEightLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
