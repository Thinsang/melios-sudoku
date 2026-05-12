import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/sudoku";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <SignUpForm next={safeNext} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Already registered?{" "}
          <Link
            href={`/sudoku/auth/sign-in${safeNext !== "/sudoku" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
