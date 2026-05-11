import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm">
        <div className="font-display text-7xl text-ink leading-none">404</div>
        <p className="mt-4 text-ink-soft">
          That page didn&rsquo;t lead anywhere. Maybe the game ended, or the link
          got mistyped.
        </p>
        <div className="mt-6 flex gap-2.5 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
          >
            Home
          </Link>
          <Link
            href="/new-game"
            className="px-5 py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
          >
            New game
          </Link>
        </div>
      </div>
    </main>
  );
}
