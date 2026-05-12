import type { Metadata } from "next";

// Individual game rooms are private/session-specific — don't index.
export const metadata: Metadata = {
  title: "Game room",
  robots: { index: false, follow: false },
};

export default function GameRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
