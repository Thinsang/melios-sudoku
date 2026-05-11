"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        <main className="flex min-h-screen items-center justify-center px-6 py-20 font-sans">
          <div className="text-center max-w-md">
            <div className="text-5xl font-bold">Something broke.</div>
            <p className="mt-3 text-zinc-600">
              {error.message || "An unexpected error occurred."}
            </p>
            {/* global-error replaces the root layout, so the Next router context
                may be unavailable. Use a plain anchor that does a full reload. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="mt-6 inline-block px-5 py-2.5 rounded-md bg-blue-600 text-white font-medium"
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
