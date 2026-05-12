"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  body: string;
  /** Epoch ms when received. */
  at: number;
}

/**
 * Co-op ephemeral chat. Messages live only in-channel — no DB write,
 * no history for late joiners. Renders a scrollable thread + a small
 * input. Auto-scrolls to bottom on new message.
 *
 * Mobile: shows a "Chat (N)" toggle pill that expands a fixed-height
 * panel. Desktop: always visible in the sidebar.
 */
export function CoopChat({
  messages,
  onSend,
  meId,
}: {
  messages: ChatMessage[];
  onSend: (body: string) => void;
  meId: string;
}) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to newest message when the list grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, expanded]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > 280) return;
    onSend(trimmed);
    setDraft("");
  }

  return (
    <div className="rounded-2xl border border-edge bg-paper flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-paper-raised transition-colors duration-75 text-left"
        aria-expanded={expanded}
      >
        <div className="font-display text-base text-ink">
          Chat
          {messages.length > 0 && (
            <span className="ml-2 text-xs text-ink-faint font-sans">
              {messages.length}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            "text-ink-faint transition-transform duration-150 " +
            (expanded ? "rotate-180" : "")
          }
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <>
          <div
            ref={scrollRef}
            className="flex-1 px-4 py-2 max-h-56 sm:max-h-72 overflow-y-auto flex flex-col gap-2 border-t border-edge"
          >
            {messages.length === 0 ? (
              <p className="text-xs text-ink-faint text-center py-6">
                Say hi. Co-ordinate. Trash-talk. Messages aren&rsquo;t saved.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.playerId === meId;
                return (
                  <div
                    key={m.id}
                    className={
                      "flex items-start gap-2 " +
                      (mine ? "flex-row-reverse" : "")
                    }
                  >
                    <Avatar src={null} name={m.name} size={22} />
                    <div
                      className={
                        "max-w-[80%] rounded-xl px-3 py-1.5 text-sm " +
                        (mine
                          ? "bg-brand text-brand-ink"
                          : "bg-paper-raised text-ink border border-edge")
                      }
                    >
                      {!mine && (
                        <div className="text-[10px] uppercase tracking-[0.1em] text-ink-faint font-medium mb-0.5">
                          {m.name}
                        </div>
                      )}
                      <div className="break-words whitespace-pre-wrap leading-snug">
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-stretch gap-2 px-3 py-2.5 border-t border-edge"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={280}
              placeholder="Type a message…"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-md border border-edge bg-paper text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="px-3 py-1.5 rounded-md bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-brand-ink text-sm font-medium transition-colors duration-75"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
