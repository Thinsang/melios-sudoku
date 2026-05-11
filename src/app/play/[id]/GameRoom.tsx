"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import {
  BOARD_SIZE,
  Board,
  CellValue,
  DIFFICULTY_LABEL,
  decodeBoard,
  encodeBoard,
  findConflicts,
  isBoardComplete,
  progressPercent,
} from "@/lib/sudoku";
import { SudokuBoard } from "@/components/sudoku/SudokuBoard";
import { NumberPad } from "@/components/sudoku/NumberPad";
import { finishCoop, finishRace, recordMove, startRace } from "@/lib/games/actions";

type Game = Database["public"]["Tables"]["games"]["Row"];
type Player = Database["public"]["Tables"]["game_players"]["Row"];

interface OppProgress {
  percent: number;
  finishedAt: string | null;
  finishTimeMs: number | null;
}

const MODE_LABEL: Record<string, string> = {
  solo: "Solo",
  coop: "Co-op",
  race: "Race",
};

function fmtTime(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const LOCALSTORAGE_BOARD_PREFIX = "melio_board_";

export function GameRoom({
  game: g0,
  me,
  initialPlayers,
  initialBoard,
  isGuest,
}: {
  game: Game;
  me: Player;
  initialPlayers: Player[];
  initialBoard: string | null;
  isGuest: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [game, setGame] = useState<Game>(g0);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [oppProgress, setOppProgress] = useState<Record<string, OppProgress>>({});
  const [cellLocks, setCellLocks] = useState<
    Record<number, { playerId: string; name: string }>
  >({});

  const [selected, setSelected] = useState<number | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<Record<number, number[]>>({});
  const [paused, setPaused] = useState(false);
  const [mistakes, setMistakes] = useState<number>(me.mistakes ?? 0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  // Race-only: lobby state. `raceReady` is the live broadcast view; once all
  // joined players are ready, any client calls startRace() which sets
  // game.started_at to a few seconds in the future for a synchronized 3-2-1.
  const [raceReady, setRaceReady] = useState<Set<string>>(new Set());
  const [countdownSec, setCountdownSec] = useState<number | null>(null);

  // For all modes: game is "live" once game.started_at is set and in the past.
  const startMs = game.started_at ? Date.parse(game.started_at) : null;

  // `phase` is state (not a direct Date.now() comparison) so that it transitions
  // deterministically and re-renders the right overlay at the right moment.
  const [phase, setPhase] = useState<"waiting" | "countdown" | "live">("waiting");

  useEffect(() => {
    // Derive phase from startMs whenever it changes. The lint rule only
    // flags the first sync setState; the others within the same effect are
    // implicitly covered.
    if (startMs === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("waiting");
      return;
    }
    const diff = startMs - Date.now();
    if (diff <= 0) {
      setPhase("live");
      return;
    }
    setPhase("countdown");
    const id = window.setTimeout(() => setPhase("live"), diff);
    return () => window.clearTimeout(id);
  }, [startMs]);

  const isWaiting = game.mode === "race" && phase === "waiting";
  const isCountingDown = phase === "countdown";
  const isLive = phase === "live";

  const [board, setBoard] = useState<Board>(() => {
    try {
      if (g0.mode === "coop") return decodeBoard(g0.current_board ?? g0.puzzle);
      return decodeBoard(initialBoard ?? g0.puzzle);
    } catch (err) {
      console.warn("Initial board decode failed, falling back to puzzle:", err);
      return decodeBoard(g0.puzzle);
    }
  });

  // For guests in race/solo, hydrate from localStorage on mount. We can't do
  // this in the useState initializer because that runs on the server too,
  // which would cause a hydration mismatch when localStorage differs from the
  // server-rendered initial board.
  useEffect(() => {
    if (!isGuest) return;
    if (g0.mode === "coop") return;
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALSTORAGE_BOARD_PREFIX + g0.id);
    if (stored && stored.length === 81) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBoard(decodeBoard(stored));
    }
    // We only want to read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const finishedRef = useRef(false);

  // Puzzle and solution never change for a given game, so derive them once from
  // the initial server-rendered props. This also insulates us from any garbled
  // realtime payloads that might overwrite `game.puzzle`/`game.solution`.
  const given = useMemo(() => decodeBoard(g0.puzzle), [g0.puzzle]);
  const solution = useMemo(() => decodeBoard(g0.solution), [g0.solution]);
  const conflicts = useMemo(() => findConflicts(board), [board]);
  const complete = useMemo(
    () => isBoardComplete(board, solution),
    [board, solution]
  );
  const myPercent = useMemo(
    () => progressPercent(given, board, solution),
    [given, board, solution]
  );

  // Timer: ticks only while game is live (started_at set and in the past).
  // Race waits in the lobby until all ready; the countdown phase shows the
  // overlay but doesn't tick the elapsed counter.
  useEffect(() => {
    if (paused || complete) return;
    if (!isLive || startMs === null) return;
    const tick = () => setElapsed(Date.now() - startMs);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [paused, complete, isLive, startMs]);

  // Countdown phase — show "3 / 2 / 1 / Go" while startMs is in the future.
  useEffect(() => {
    if (startMs === null || startMs <= Date.now()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (countdownSec !== null) setCountdownSec(null);
      return;
    }
    const update = () => {
      const diff = startMs - Date.now();
      if (diff <= 0) setCountdownSec(null);
      else setCountdownSec(Math.ceil(diff / 1000));
    };
    update();
    const id = window.setInterval(update, 100);
    return () => window.clearInterval(id);
    // We deliberately don't include countdownSec — it's set inside this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`game:${game.id}`, {
      config: { broadcast: { self: false }, presence: { key: me.id } },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          const next = payload.new as Game;
          setGame(next);
          if (next.mode === "coop" && next.current_board) {
            try {
              setBoard(decodeBoard(next.current_board));
            } catch (err) {
              console.warn(
                "Realtime current_board decode failed, ignoring:",
                err,
                next.current_board
              );
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          const p = payload.new as Player;
          setPlayers((cur) =>
            cur.find((x) => x.id === p.id) ? cur : [...cur, p]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_players",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          const p = payload.new as Player;
          setPlayers((cur) => cur.map((x) => (x.id === p.id ? p : x)));
        }
      )
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        if (!payload || typeof payload !== "object") return;
        const {
          player_id,
          percent,
          finished_at,
          finish_time_ms,
        } = payload as {
          player_id: string;
          percent: number;
          finished_at: string | null;
          finish_time_ms: number | null;
        };
        setOppProgress((cur) => ({
          ...cur,
          [player_id]: {
            percent,
            finishedAt: finished_at,
            finishTimeMs: finish_time_ms,
          },
        }));
      })
      .on("broadcast", { event: "coop_board" }, ({ payload }) => {
        if (g0.mode !== "coop") return;
        if (!payload || typeof payload !== "object") return;
        const { board } = payload as { board?: string };
        if (!board) return;
        try {
          setBoard(decodeBoard(board));
        } catch (err) {
          console.warn("coop_board broadcast decode failed:", err);
        }
      })
      .on("broadcast", { event: "coop_notes" }, ({ payload }) => {
        if (g0.mode !== "coop") return;
        if (!payload || typeof payload !== "object") return;
        const next = (payload as { notes?: Record<number, number[]> }).notes;
        if (next) setNotes(next);
      })
      .on("broadcast", { event: "ready" }, ({ payload }) => {
        if (!payload || typeof payload !== "object") return;
        const { player_id, ready } = payload as {
          player_id: string;
          ready: boolean;
        };
        setRaceReady((s) => {
          const n = new Set(s);
          if (ready) n.add(player_id);
          else n.delete(player_id);
          return n;
        });
      })
      .on("broadcast", { event: "cell_lock" }, ({ payload }) => {
        if (!payload || typeof payload !== "object") return;
        const { player_id, name, cell_index } = payload as {
          player_id: string;
          name: string;
          cell_index: number | null;
        };
        setCellLocks((cur) => {
          const next: typeof cur = {};
          for (const [k, v] of Object.entries(cur)) {
            if (v.playerId !== player_id) next[Number(k)] = v;
          }
          if (cell_index !== null && cell_index !== undefined) {
            next[cell_index] = { playerId: player_id, name };
          }
          return next;
        });
      });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [supabase, game.id, me.id, g0.mode]);

  // Broadcast cell lock on selection change (coop only)
  useEffect(() => {
    if (game.mode !== "coop") return;
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({
      type: "broadcast",
      event: "cell_lock",
      payload: {
        player_id: me.id,
        name: me.display_name,
        cell_index: selected,
      },
    });
  }, [selected, game.mode, me.id, me.display_name]);

  const broadcastProgress = useCallback(
    (percent: number, finished = false, finishMs: number | null = null) => {
      const ch = channelRef.current;
      if (!ch) return;
      void ch.send({
        type: "broadcast",
        event: "progress",
        payload: {
          player_id: me.id,
          percent,
          finished_at: finished ? new Date().toISOString() : null,
          finish_time_ms: finished ? finishMs : null,
        },
      });
    },
    [me.id]
  );

  const lastSavedRef = useRef<string>(encodeBoard(board));

  const persist = useCallback(
    (cellIndex: number, value: number, newBoard: Board) => {
      const enc = encodeBoard(newBoard);
      if (enc === lastSavedRef.current) return;
      lastSavedRef.current = enc;

      // For coop, broadcast the new shared board to all live participants.
      // This is the primary live-sync channel — postgres_changes also fires,
      // but only if Realtime is fully configured on the table.
      if (game.mode === "coop") {
        const ch = channelRef.current;
        if (ch) {
          void ch.send({
            type: "broadcast",
            event: "coop_board",
            payload: { board: enc, by: me.id },
          });
        }
      }

      // Guests in race/solo persist locally instead of to the DB.
      if (isGuest && game.mode !== "coop") {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCALSTORAGE_BOARD_PREFIX + game.id, enc);
        }
        return;
      }

      const pct = progressPercent(given, newBoard, solution);
      void recordMove(
        game.id,
        me.id,
        cellIndex,
        value,
        enc,
        game.mode as "solo" | "coop" | "race",
        pct
      );
    },
    [game.id, me.id, game.mode, isGuest, given, solution]
  );

  const isLockedByOther = useCallback(
    (idx: number) => {
      const l = cellLocks[idx];
      return Boolean(l && l.playerId !== me.id);
    },
    [cellLocks, me.id]
  );

  // setNotes wrapper that also broadcasts to other co-op players. In co-op
  // mode notes are shared (both players see the same pencil marks); in race /
  // solo modes this is just a pass-through to setNotes.
  const updateNotes = useCallback(
    (
      updater: (
        prev: Record<number, number[]>
      ) => Record<number, number[]>
    ) => {
      setNotes((prev) => {
        const next = updater(prev);
        if (game.mode === "coop") {
          const ch = channelRef.current;
          if (ch) {
            void ch.send({
              type: "broadcast",
              event: "coop_notes",
              payload: { notes: next },
            });
          }
        }
        return next;
      });
    },
    [game.mode]
  );

  // Auto-start the race when all currently-joined players are ready.
  // Multiple clients may fire this; startRace() is idempotent (it checks
  // the current status before flipping it).
  useEffect(() => {
    if (game.mode !== "race") return;
    if (game.status !== "waiting") return;
    if (startMs !== null) return; // already started/counting down
    if (players.length === 0) return;
    const allReady = players.every((p) => raceReady.has(p.id));
    if (!allReady) return;
    void startRace(game.id);
  }, [game.mode, game.status, game.id, players, raceReady, startMs]);

  const toggleReady = useCallback(() => {
    setRaceReady((prev) => {
      const isReady = prev.has(me.id);
      const next = new Set(prev);
      if (isReady) next.delete(me.id);
      else next.add(me.id);
      const ch = channelRef.current;
      if (ch) {
        void ch.send({
          type: "broadcast",
          event: "ready",
          payload: { player_id: me.id, ready: !isReady },
        });
      }
      return next;
    });
  }, [me.id]);

  const handleInput = useCallback(
    (value: CellValue) => {
      if (selected === null) return;
      if (given[selected] !== 0) return;
      if (game.mode === "coop" && isLockedByOther(selected)) return;
      if (board[selected] === value) return;

      const newBoard = board.slice() as Board;
      newBoard[selected] = value;
      setBoard(newBoard);
      updateNotes((n) => {
        if (!n[selected]) return n;
        const c = { ...n };
        delete c[selected];
        return c;
      });

      if (value !== 0 && solution[selected] !== value) {
        setMistakes((m) => m + 1);
      }

      persist(selected, value, newBoard);
      if (game.mode === "race") {
        broadcastProgress(progressPercent(given, newBoard, solution));
      }
    },
    [
      selected,
      given,
      board,
      solution,
      game.mode,
      isLockedByOther,
      persist,
      broadcastProgress,
      updateNotes,
    ]
  );

  const handleClear = useCallback(() => {
    if (selected === null) return;
    if (given[selected] !== 0) return;
    if (game.mode === "coop" && isLockedByOther(selected)) return;
    if (board[selected] === 0 && !notes[selected]) return;
    const newBoard = board.slice() as Board;
    newBoard[selected] = 0 as CellValue;
    setBoard(newBoard);
    updateNotes((n) => {
      if (!n[selected]) return n;
      const c = { ...n };
      delete c[selected];
      return c;
    });
    persist(selected, 0, newBoard);
    if (game.mode === "race") {
      broadcastProgress(progressPercent(given, newBoard, solution));
    }
  }, [
    selected,
    given,
    board,
    notes,
    game.mode,
    isLockedByOther,
    persist,
    broadcastProgress,
    solution,
    updateNotes,
  ]);

  const handleToggleNote = useCallback(
    (value: number) => {
      if (selected === null) return;
      if (given[selected] !== 0) return;
      if (board[selected] !== 0) return;
      if (game.mode === "coop" && isLockedByOther(selected)) return;
      updateNotes((n) => {
        const existing = new Set(n[selected] ?? []);
        if (existing.has(value)) existing.delete(value);
        else existing.add(value);
        const c = { ...n };
        if (existing.size === 0) delete c[selected];
        else c[selected] = Array.from(existing).sort();
        return c;
      });
    },
    [selected, given, board, game.mode, isLockedByOther, updateNotes]
  );

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isLive) return; // lobby + countdown swallow keypresses
      if (selected === null) return;
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        handleInput(Number(e.key) as CellValue);
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected(Math.max(0, selected - 9));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected(Math.min(BOARD_SIZE - 1, selected + 9));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selected % 9 !== 0) setSelected(selected - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selected % 9 !== 8) setSelected(selected + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, handleInput, handleClear, isLive]);

  // Game complete
  useEffect(() => {
    if (!complete || finishedRef.current) return;
    finishedRef.current = true;
    if (game.mode === "race") {
      void finishRace(game.id, me.id, elapsed, mistakes);
      broadcastProgress(100, true, elapsed);
    } else {
      void finishCoop(game.id, mistakes);
    }
  }, [complete, game.id, game.mode, me.id, elapsed, mistakes, broadcastProgress]);

  const lockedByMap = useMemo(() => {
    const out: Record<number, string> = {};
    for (const [idx, lock] of Object.entries(cellLocks)) {
      if (lock.playerId !== me.id) out[Number(idx)] = lock.name;
    }
    return out;
  }, [cellLocks, me.id]);

  const opponents = useMemo(
    () => players.filter((p) => p.id !== me.id),
    [players, me.id]
  );

  function copyInvite() {
    if (typeof window === "undefined") return;
    const link = `${window.location.origin}/play/${game.id}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="text-ink-soft hover:text-ink transition-colors duration-75"
          >
            ← Home
          </Link>
          <span className="text-ink-faint">·</span>
          <span className="font-display text-base text-ink">
            {MODE_LABEL[game.mode]} ·{" "}
            {DIFFICULTY_LABEL[game.difficulty as keyof typeof DIFFICULTY_LABEL]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="px-3 py-1.5 rounded-md border border-edge bg-paper hover:bg-paper-raised text-sm text-ink-soft hover:text-ink transition-colors duration-75"
          >
            {copied ? "Link copied" : "Copy invite link"}
          </button>
          {game.invite_code && (
            <span className="font-mono text-xs px-2 py-1.5 rounded-md bg-paper-raised border border-edge text-ink tracking-widest">
              {game.invite_code}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-start">
        <div className="w-full max-w-[min(94vw,560px)] mx-auto lg:mx-0 flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">
              <span className="text-ink-faint">Mistakes</span>{" "}
              <span className="font-medium text-ink tabular-nums">{mistakes}</span>
            </span>
            <span className="font-mono tabular-nums text-ink">{fmtTime(elapsed)}</span>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              disabled={!isLive}
              className="px-2.5 py-1 rounded-md border border-edge bg-paper text-ink-soft hover:text-ink hover:bg-paper-raised disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors duration-75"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>

          <div className="relative">
            <SudokuBoard
              given={given}
              current={board}
              solution={solution}
              notes={notes}
              selected={selected}
              conflicts={conflicts}
              lockedBy={lockedByMap}
              onSelect={(idx) => isLive && setSelected(idx)}
            />

            {/* Race lobby — shown until all players are ready and the
                 countdown is triggered. */}
            {isWaiting && (
              <RaceLobby
                me={me}
                players={players}
                readySet={raceReady}
                onToggleReady={toggleReady}
                onCopyInvite={copyInvite}
                copied={copied}
                inviteCode={game.invite_code}
              />
            )}

            {/* 3-2-1 countdown — shown once startMs is set but still in the
                 future. The big number is derived from countdownSec. */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-canvas/95 backdrop-blur-sm rounded-xl">
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium mb-2">
                    Get ready
                  </div>
                  <div className="font-display text-[6rem] sm:text-[8rem] leading-none text-brand">
                    {countdownSec ?? "Go"}
                  </div>
                </div>
              </div>
            )}

            {paused && isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-canvas/85 backdrop-blur-sm rounded-xl">
                <div className="text-center">
                  <div className="font-display text-2xl text-ink mb-3">Paused</div>
                  <button
                    type="button"
                    onClick={() => setPaused(false)}
                    className="px-5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
                  >
                    Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          <NumberPad
            current={board}
            noteMode={noteMode}
            onInput={handleInput}
            onToggleNote={handleToggleNote}
            onClear={handleClear}
            onToggleNoteMode={() => setNoteMode((n) => !n)}
            onUndo={() => {}}
            disabled={!isLive}
          />
        </div>

        <aside className="w-full lg:w-72 flex flex-col gap-3">
          {game.mode === "coop" ? (
            // Co-op: one shared progress bar (the team's progress on the
            // shared board) and a simple player roster underneath.
            <div className="rounded-2xl border border-edge bg-paper p-4">
              <div className="font-display text-base text-ink mb-3">
                Team
              </div>
              <PlayerRow
                name="Shared progress"
                percent={myPercent}
                finished={complete}
                finishMs={complete ? elapsed : null}
                mode="coop"
              />
              <div className="mt-4 pt-3 border-t border-edge">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint font-medium mb-2">
                  Players
                </div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {players.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 text-ink"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span className="truncate">
                        {p.display_name}
                        {p.id === me.id && (
                          <span className="text-ink-faint"> (you)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {opponents.length === 0 && (
                  <p className="text-xs text-ink-faint mt-2">
                    Waiting for someone to join. Share the invite link.
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Race / solo-saved: per-player progress bars.
            <div className="rounded-2xl border border-edge bg-paper p-4">
              <div className="font-display text-base text-ink mb-3">
                {game.mode === "race" ? "Race" : "Players"}
              </div>
              <PlayerRow
                name={`${me.display_name} (you)`}
                percent={myPercent}
                finished={complete}
                finishMs={complete ? elapsed : null}
                mode={game.mode}
              />
              {opponents.map((opp) => {
                const prog = oppProgress[opp.id];
                const finished =
                  Boolean(opp.finished_at) || prog?.finishedAt != null;
                const finishMs =
                  opp.finish_time_ms ?? prog?.finishTimeMs ?? null;
                const percent = finished
                  ? 100
                  : prog?.percent ?? opp.progress_pct ?? 0;
                return (
                  <PlayerRow
                    key={opp.id}
                    name={opp.display_name}
                    percent={percent}
                    finished={finished}
                    finishMs={finishMs}
                    mode={game.mode}
                  />
                );
              })}
              {opponents.length === 0 && game.mode !== "solo" && (
                <p className="text-xs text-ink-faint mt-2">
                  Waiting for someone to join. Share the invite link.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      {complete && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-paper border border-edge rounded-2xl p-7 sm:p-8 max-w-md w-full text-center shadow-[var(--shadow-lifted)]">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-soft text-success flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-ink mb-1">Solved</h2>
            <div className="text-sm text-ink-soft mb-6">
              {DIFFICULTY_LABEL[game.difficulty as keyof typeof DIFFICULTY_LABEL]} ·{" "}
              {fmtTime(elapsed)} · {mistakes} mistake{mistakes === 1 ? "" : "s"}
            </div>
            <div className="flex gap-2.5 justify-center">
              <Link
                href="/new-game"
                className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
              >
                New game
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RaceLobby({
  me,
  players,
  readySet,
  onToggleReady,
  onCopyInvite,
  copied,
  inviteCode,
}: {
  me: Player;
  players: Player[];
  readySet: Set<string>;
  onToggleReady: () => void;
  onCopyInvite: () => void;
  copied: boolean;
  inviteCode: string | null;
}) {
  const meReady = readySet.has(me.id);
  const allReady =
    players.length > 0 && players.every((p) => readySet.has(p.id));
  const readyCount = players.filter((p) => readySet.has(p.id)).length;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-canvas/95 backdrop-blur-sm rounded-xl p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-faint font-medium">
            Race lobby
          </div>
          <h2 className="font-display text-2xl text-ink mt-1">
            {allReady ? "Starting…" : "Ready up"}
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            {players.length < 2
              ? "Waiting for an opponent. Share the link below."
              : `${readyCount} of ${players.length} ready`}
          </p>
        </div>

        <ul className="flex flex-col gap-1.5 mb-4">
          {players.map((p) => {
            const isReady = readySet.has(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-edge bg-paper"
              >
                <span className="text-sm text-ink truncate">
                  {p.display_name}
                  {p.id === me.id && (
                    <span className="text-ink-faint"> (you)</span>
                  )}
                </span>
                <span
                  className={
                    isReady
                      ? "text-xs font-medium text-success"
                      : "text-xs text-ink-faint"
                  }
                >
                  {isReady ? "✓ Ready" : "Not ready"}
                </span>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onToggleReady}
          className={
            meReady
              ? "w-full py-2.5 rounded-lg border border-edge bg-paper text-ink hover:bg-paper-raised font-medium text-sm transition-colors duration-75"
              : "w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-ink font-medium text-sm transition-colors duration-75"
          }
        >
          {meReady ? "Cancel ready" : "I'm ready"}
        </button>

        <div className="mt-4 flex items-center gap-2 justify-center">
          <button
            type="button"
            onClick={onCopyInvite}
            className="text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline"
          >
            {copied ? "Link copied" : "Copy invite link"}
          </button>
          {inviteCode && (
            <>
              <span className="text-ink-faint text-xs">·</span>
              <span className="font-mono text-xs px-2 py-1 rounded-md bg-paper-raised border border-edge text-ink tracking-widest">
                {inviteCode}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({
  name,
  percent,
  finished,
  finishMs,
  mode,
}: {
  name: string;
  percent: number;
  finished: boolean;
  finishMs: number | null;
  mode: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink truncate">{name}</span>
        <span className="text-xs text-ink-soft tabular-nums">
          {finished
            ? mode === "race" && finishMs !== null
              ? fmtTime(finishMs)
              : "Done"
            : `${percent}%`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-paper-sunken overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            backgroundColor: finished ? "var(--success)" : "var(--brand)",
          }}
        />
      </div>
    </div>
  );
}
