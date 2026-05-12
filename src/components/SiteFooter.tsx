import Link from "next/link";

/**
 * Shared site footer. Used by both the hub at `/` and the sudoku
 * sub-app under `/sudoku/*`. Links to About, Privacy, Terms, and the
 * GitHub source. Keeps the chrome consistent across sections.
 */
export function SiteFooter() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="border-t border-edge bg-canvas mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center sm:items-baseline gap-3 sm:gap-6">
        <div className="text-xs text-ink-faint">
          © {year} Melio Games. A small, carefully made games studio.
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <Link
            href="/about"
            className="hover:text-ink transition-colors duration-75"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="hover:text-ink transition-colors duration-75"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-ink transition-colors duration-75"
          >
            Terms
          </Link>
          <Link
            href="/sudoku"
            className="hover:text-ink transition-colors duration-75"
          >
            Sudoku
          </Link>
        </nav>
      </div>
    </footer>
  );
}
