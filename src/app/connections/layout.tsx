import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "Connections — Group 16 Words Into 4 Sets",
    template: "%s · Melio Connections",
  },
  description:
    "Free daily Connections word puzzle. 16 words, 4 hidden themes — group them into 4 sets of 4. Same puzzle for everyone every day.",
  keywords: [
    "connections",
    "connections puzzle",
    "word puzzle",
    "daily connections",
    "melio games",
  ],
  alternates: { canonical: "/connections" },
  openGraph: {
    title: "Melio Connections",
    description: "Free daily Connections word puzzle.",
    url: "https://meliogames.com/connections",
    type: "website",
    siteName: "Melio Connections",
  },
};

export default function ConnectionsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
