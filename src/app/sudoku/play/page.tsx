import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DIFFICULTIES, Difficulty, DIFFICULTY_LABEL } from "@/lib/sudoku";
import { SoloGame } from "@/components/sudoku/SoloGame";

// Per-difficulty pages get a more specific title/description so they can rank
// for long-tail searches like "play expert sudoku online".
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}): Promise<Metadata> {
  const { d } = await searchParams;
  const difficulty = (DIFFICULTIES as readonly string[]).includes(d ?? "")
    ? (d as Difficulty)
    : null;
  if (!difficulty) {
    return {
      title: "Play Sudoku",
      description: "Play sudoku online — pick a difficulty and begin.",
      alternates: { canonical: "/sudoku/play" },
    };
  }
  const label = DIFFICULTY_LABEL[difficulty];
  return {
    title: `${label} Sudoku — Free Online`,
    description: `Play ${label.toLowerCase()} sudoku online for free. Hints, notes, mistake tracking, and a scoring system that rewards speed.`,
    alternates: { canonical: `/sudoku/play?d=${difficulty}` },
  };
}

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const difficulty = (DIFFICULTIES as readonly string[]).includes(d ?? "")
    ? (d as Difficulty)
    : null;

  if (!difficulty) redirect("/sudoku");

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-4 py-6 sm:py-10">
      <SoloGame difficulty={difficulty} />
    </main>
  );
}
