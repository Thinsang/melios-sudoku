import { redirect } from "next/navigation";
import { DIFFICULTIES, Difficulty } from "@/lib/sudoku";
import { SoloGame } from "@/components/sudoku/SoloGame";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const difficulty = (DIFFICULTIES as readonly string[]).includes(d ?? "")
    ? (d as Difficulty)
    : null;

  if (!difficulty) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-start px-4 py-6 sm:py-10">
      <SoloGame difficulty={difficulty} />
    </main>
  );
}
