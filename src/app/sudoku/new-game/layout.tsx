import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New game",
  robots: { index: false, follow: false },
};

export default function NewGameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
