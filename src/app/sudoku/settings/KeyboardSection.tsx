"use client";

/**
 * Tells the user the cheat sheet exists and how to open it. The actual
 * modal lives in the sudoku layout (KeyboardHelp), triggered by `?`.
 */
export function KeyboardSection() {
  function open() {
    // The modal's keydown handler is the canonical entry point; rather
    // than coupling it to a context, we synthesize a "?" keypress.
    const event = new KeyboardEvent("keydown", {
      key: "?",
      bubbles: true,
    });
    window.dispatchEvent(event);
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg text-ink">Keyboard</h2>
      <div className="rounded-xl border border-edge bg-paper p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-ink-soft">
          Press{" "}
          <kbd className="font-mono text-xs px-1.5 py-0.5 rounded border border-edge bg-paper-raised text-ink">
            ?
          </kbd>{" "}
          anywhere in sudoku to see all shortcuts.
        </div>
        <button
          type="button"
          onClick={open}
          className="px-3.5 py-1.5 rounded-md border border-edge bg-paper hover:bg-paper-raised text-ink text-sm font-medium transition-colors duration-75"
        >
          Show
        </button>
      </div>
    </section>
  );
}
