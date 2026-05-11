import Link from "next/link";
import { SignInForm } from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/";

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <SignInForm next={safeNext} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
          No account?{" "}
          <Link
            href={`/auth/sign-up${safeNext !== "/" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

