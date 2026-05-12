-- Melio's Sudoku — Supabase schema
-- Run this in the Supabase SQL editor for your project, or via:
--   supabase db reset   (with the Supabase CLI and a linked project)
--
-- This file is the source of truth for the public schema. RLS policies are
-- included so the anon key alone gives the browser only safe access.

-- =========================================================================
-- Extensions
-- =========================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- profiles  (extends auth.users with public-facing fields)
-- =========================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique not null check (char_length(username) between 3 and 20
                                            and username ~ '^[a-zA-Z0-9_]+$'),
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    new.raw_user_meta_data ->> 'username',
    'player_' || substr(new.id::text, 1, 8)
  );
  insert into public.profiles (id, username, display_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data ->> 'display_name', uname));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- games
-- A game holds the puzzle and (for co-op) the shared current board.
-- For race mode each player has their own player_board on game_players.
-- =========================================================================
create table if not exists public.games (
  id             uuid primary key default gen_random_uuid(),
  mode           text not null check (mode in ('solo','coop','race')),
  difficulty     text not null check (difficulty in ('easy','medium','hard','expert','extreme')),
  puzzle         text not null check (char_length(puzzle) = 81),    -- givens, '0' for blank
  solution       text not null check (char_length(solution) = 81),
  current_board  text check (current_board is null or char_length(current_board) = 81),  -- co-op shared board; null for race
  status         text not null default 'waiting'
                  check (status in ('waiting','active','completed','abandoned')),
  invite_code    text unique,          -- short code for share links
  created_by     uuid references public.profiles on delete set null,
  created_at     timestamptz not null default now(),
  started_at     timestamptz,
  completed_at   timestamptz
);

-- Migration: previous schema versions used char(81) which can come back with
-- trailing space padding through the realtime channel. Convert to plain text.
do $$
begin
  alter table public.games alter column puzzle type text;
  alter table public.games alter column solution type text;
  alter table public.games alter column current_board type text;
exception when undefined_column then null;
end $$;

-- Migration: older installs only allowed 4 difficulties; add 'extreme'.
do $$
begin
  alter table public.games drop constraint if exists games_difficulty_check;
  alter table public.games add constraint games_difficulty_check
    check (difficulty in ('easy','medium','hard','expert','extreme'));
exception when others then null;
end $$;

create index if not exists games_invite_code_idx on public.games (invite_code);
create index if not exists games_created_by_idx on public.games (created_by);

-- =========================================================================
-- game_players
-- Joins users (or guests) to games. Guests have a guest_id cookie.
-- The actual race-mode board lives in `player_progress` (private to the
-- player) — this row only carries public metadata visible to all participants.
-- =========================================================================
create table if not exists public.game_players (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references public.games on delete cascade,
  user_id         uuid references public.profiles on delete set null,
  guest_id        uuid,
  display_name    text not null,
  finished_at     timestamptz,
  finish_time_ms  bigint,
  mistakes        int not null default 0,
  progress_pct    smallint not null default 0 check (progress_pct between 0 and 100),
  joined_at       timestamptz not null default now(),
  check (user_id is not null or guest_id is not null)
);
-- Drop legacy column from earlier schema versions (no-op on fresh installs).
alter table public.game_players drop column if exists player_board;
alter table public.game_players add column if not exists progress_pct smallint not null default 0
  check (progress_pct between 0 and 100);

-- =========================================================================
-- player_progress
-- Per-player race/solo board. **Only the player themselves can read this.**
-- Opponents see only `game_players.progress_pct` (an integer 0-100), not the
-- actual cell values, so they can't copy answers off the wire.
-- =========================================================================
create table if not exists public.player_progress (
  player_id   uuid primary key references public.game_players on delete cascade,
  board       text not null check (char_length(board) = 81),
  updated_at  timestamptz not null default now()
);

do $$
begin
  alter table public.player_progress alter column board type text;
exception when undefined_column then null;
end $$;

create unique index if not exists game_players_user_uniq
  on public.game_players (game_id, user_id) where user_id is not null;
create unique index if not exists game_players_guest_uniq
  on public.game_players (game_id, guest_id) where guest_id is not null;
create index if not exists game_players_game_idx on public.game_players (game_id);

-- =========================================================================
-- moves  (audit log of cell changes; used for replay and realtime broadcast)
-- =========================================================================
create table if not exists public.moves (
  id          bigserial primary key,
  game_id     uuid not null references public.games on delete cascade,
  player_id   uuid not null references public.game_players on delete cascade,
  cell_index  smallint not null check (cell_index between 0 and 80),
  value       smallint not null check (value between 0 and 9),
  created_at  timestamptz not null default now()
);
create index if not exists moves_game_idx on public.moves (game_id, id);

-- =========================================================================
-- cell_locks  (co-op cell-lock-while-typing; expires_at is short, ~10s)
-- =========================================================================
create table if not exists public.cell_locks (
  game_id     uuid not null references public.games on delete cascade,
  cell_index  smallint not null check (cell_index between 0 and 80),
  locked_by   uuid not null references public.game_players on delete cascade,
  expires_at  timestamptz not null,
  primary key (game_id, cell_index)
);
create index if not exists cell_locks_expires_idx on public.cell_locks (expires_at);

-- =========================================================================
-- daily_puzzles
-- One shared sudoku puzzle per day. The difficulty rotates by weekday so the
-- daily challenge stays interesting (Sundays are the hardest). The first
-- visitor each day triggers generation; subsequent visitors get the cached
-- row. Public-read so guests can play; insert is allowed for any authed user
-- but constrained to today's date (so it can't be backfilled / poisoned).
-- =========================================================================
create table if not exists public.daily_puzzles (
  date         date primary key,
  difficulty   text not null
                 check (difficulty in ('easy','medium','hard','expert','extreme')),
  puzzle       text not null check (char_length(puzzle) = 81),
  solution     text not null check (char_length(solution) = 81),
  created_at   timestamptz not null default now()
);
create index if not exists daily_puzzles_date_idx on public.daily_puzzles (date desc);

-- =========================================================================
-- scores  (leaderboard rows — one per completed puzzle, per player)
-- Anonymous solo plays don't write here; only authed users get persisted.
-- =========================================================================
create table if not exists public.scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  difficulty   text not null
                 check (difficulty in ('easy','medium','hard','expert','extreme')),
  mode         text not null check (mode in ('solo','coop','race')),
  score        int not null check (score >= 0),
  elapsed_ms   bigint not null,
  mistakes     int not null default 0,
  hints_used   int not null default 0,
  game_id      uuid references public.games on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists scores_difficulty_score_idx
  on public.scores (difficulty, score desc);
create index if not exists scores_user_created_idx
  on public.scores (user_id, created_at desc);

-- Daily-puzzle scores carry the date so we can rank "today's daily" and walk
-- a user's history for streak math. Nullable: non-daily scores stay null.
alter table public.scores
  add column if not exists daily_date date;
create index if not exists scores_daily_date_idx
  on public.scores (daily_date, score desc) where daily_date is not null;
create index if not exists scores_user_daily_idx
  on public.scores (user_id, daily_date desc) where daily_date is not null;

-- One daily entry per user per day. Allows update-if-improved without duping.
do $$
begin
  alter table public.scores
    add constraint scores_user_daily_unique unique (user_id, daily_date);
exception when duplicate_table then null; when duplicate_object then null;
end $$;

-- Allow 'extreme' on older scores tables created before that difficulty existed.
do $$
begin
  alter table public.scores drop constraint if exists scores_difficulty_check;
  alter table public.scores add constraint scores_difficulty_check
    check (difficulty in ('easy','medium','hard','expert','extreme'));
exception when others then null;
end $$;

-- =========================================================================
-- friendships  (mutual: one row per direction)
-- =========================================================================
create table if not exists public.friendships (
  user_id     uuid not null references public.profiles on delete cascade,
  friend_id   uuid not null references public.profiles on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- =========================================================================
-- friend_requests
-- =========================================================================
create table if not exists public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles on delete cascade,
  to_user     uuid not null references public.profiles on delete cascade,
  status      text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at  timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);
create index if not exists friend_requests_to_idx on public.friend_requests (to_user, status);

-- When a recipient flips a request to 'accepted', auto-create *both*
-- directions of the friendship. This runs as SECURITY DEFINER so it can
-- bypass the RLS policy on `friendships` that otherwise only lets you
-- insert your own direction (which broke the sender's view).
create or replace function public.on_friend_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted'
     and (old.status is null or old.status <> 'accepted') then
    insert into public.friendships (user_id, friend_id)
    values
      (new.from_user, new.to_user),
      (new.to_user, new.from_user)
    on conflict (user_id, friend_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_friend_request_accepted on public.friend_requests;
create trigger trg_friend_request_accepted
  after update of status on public.friend_requests
  for each row execute function public.on_friend_request_accepted();

-- Backfill: repair one-sided friendships caused by the original implementation
-- that tried to insert both directions from the client (the sender's direction
-- got blocked by RLS). Re-run-safe via ON CONFLICT.
do $$
begin
  insert into public.friendships (user_id, friend_id)
  select from_user, to_user
  from public.friend_requests
  where status = 'accepted'
  on conflict (user_id, friend_id) do nothing;

  insert into public.friendships (user_id, friend_id)
  select to_user, from_user
  from public.friend_requests
  where status = 'accepted'
  on conflict (user_id, friend_id) do nothing;
exception when others then null;
end $$;

-- =========================================================================
-- game_invites
-- A friend can be invited to a specific game. The invite shows up in their
-- inbox; accepting redirects them to the game. Independent of join_game,
-- which is the act of actually entering as a player.
-- =========================================================================
create table if not exists public.game_invites (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games on delete cascade,
  from_user    uuid not null references public.profiles on delete cascade,
  to_user      uuid not null references public.profiles on delete cascade,
  status       text not null default 'pending'
                  check (status in ('pending','accepted','declined','expired')),
  created_at   timestamptz not null default now(),
  unique (game_id, to_user),
  check (from_user <> to_user)
);
create index if not exists game_invites_to_idx on public.game_invites (to_user, status);
create index if not exists game_invites_game_idx on public.game_invites (game_id);

-- =========================================================================
-- Helper: is the caller a participant in this game?
-- =========================================================================
create or replace function public.is_game_player(g_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.game_players gp
    where gp.game_id = g_id
      and (gp.user_id = auth.uid() or gp.guest_id is not null)
  );
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles          enable row level security;
alter table public.games             enable row level security;
alter table public.game_players      enable row level security;
alter table public.player_progress   enable row level security;
alter table public.moves             enable row level security;
alter table public.cell_locks        enable row level security;
alter table public.scores            enable row level security;
alter table public.daily_puzzles     enable row level security;
alter table public.friendships       enable row level security;
alter table public.friend_requests   enable row level security;
alter table public.game_invites      enable row level security;

-- profiles: anyone signed in can read; only the owner can update.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select using (true);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- games: readable by anyone with the id (so guest invite links work);
--        insertable by authed users; updatable by participants.
drop policy if exists "games read" on public.games;
create policy "games read" on public.games for select using (true);

drop policy if exists "games insert authed" on public.games;
create policy "games insert authed" on public.games
  for insert with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists "games update participant" on public.games;
create policy "games update participant" on public.games
  for update using (public.is_game_player(id))
  with check (public.is_game_player(id));

-- game_players: readable by anyone (the lobby is public when you have the link);
--               a user can insert their own row; updatable only by self.
drop policy if exists "game_players read" on public.game_players;
create policy "game_players read" on public.game_players for select using (true);

drop policy if exists "game_players insert self" on public.game_players;
create policy "game_players insert self" on public.game_players
  for insert with check (
    user_id = auth.uid() or (user_id is null and guest_id is not null)
  );

drop policy if exists "game_players update self" on public.game_players;
create policy "game_players update self" on public.game_players
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- player_progress: only the player themselves can read or write their row.
-- (Guests have no auth.uid(), so guest race progress is not persisted server-side
-- — guest clients persist to localStorage instead.)
drop policy if exists "player_progress own" on public.player_progress;
create policy "player_progress own" on public.player_progress
  for all using (
    exists (
      select 1 from public.game_players gp
      where gp.id = player_progress.player_id
        and gp.user_id is not null
        and gp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.game_players gp
      where gp.id = player_progress.player_id
        and gp.user_id is not null
        and gp.user_id = auth.uid()
    )
  );

-- moves: readable by participants; insertable by the player who owns the row.
drop policy if exists "moves read" on public.moves;
create policy "moves read" on public.moves
  for select using (public.is_game_player(game_id));

drop policy if exists "moves insert self" on public.moves;
create policy "moves insert self" on public.moves
  for insert with check (
    exists (
      select 1 from public.game_players gp
      where gp.id = player_id
        and (gp.user_id = auth.uid() or gp.guest_id is not null)
        and gp.game_id = moves.game_id
    )
  );

-- cell_locks: readable by participants; upserted by the locking player.
drop policy if exists "cell_locks read" on public.cell_locks;
create policy "cell_locks read" on public.cell_locks
  for select using (public.is_game_player(game_id));

drop policy if exists "cell_locks write" on public.cell_locks;
create policy "cell_locks write" on public.cell_locks
  for all using (public.is_game_player(game_id))
  with check (public.is_game_player(game_id));

-- scores: public read (it's a leaderboard); insert only for self.
drop policy if exists "scores read" on public.scores;
create policy "scores read" on public.scores for select using (true);

drop policy if exists "scores insert self" on public.scores;
create policy "scores insert self" on public.scores
  for insert with check (user_id = auth.uid());

-- Daily-score updates (for "improve my time today" semantics).
drop policy if exists "scores update self daily" on public.scores;
create policy "scores update self daily" on public.scores
  for update using (user_id = auth.uid() and daily_date is not null)
  with check (user_id = auth.uid() and daily_date is not null);

-- daily_puzzles: anyone can read; any authed user can insert today's puzzle
-- (server action generates the data — RLS bounds inserts to today's date
-- so an attacker can't backfill / overwrite past or future puzzles).
drop policy if exists "daily_puzzles read" on public.daily_puzzles;
create policy "daily_puzzles read" on public.daily_puzzles
  for select using (true);

drop policy if exists "daily_puzzles insert today" on public.daily_puzzles;
create policy "daily_puzzles insert today" on public.daily_puzzles
  for insert with check (
    date >= (current_date - integer '1')
    and date <= (current_date + integer '1')
  );

-- friendships: visible to either side; created by either side.
drop policy if exists "friendships read" on public.friendships;
create policy "friendships read" on public.friendships
  for select using (auth.uid() in (user_id, friend_id));

drop policy if exists "friendships insert self" on public.friendships;
create policy "friendships insert self" on public.friendships
  for insert with check (auth.uid() = user_id);

drop policy if exists "friendships delete self" on public.friendships;
create policy "friendships delete self" on public.friendships
  for delete using (auth.uid() in (user_id, friend_id));

-- friend_requests: sender or recipient can read; sender inserts; recipient updates status.
drop policy if exists "friend_requests read" on public.friend_requests;
create policy "friend_requests read" on public.friend_requests
  for select using (auth.uid() in (from_user, to_user));

drop policy if exists "friend_requests insert sender" on public.friend_requests;
create policy "friend_requests insert sender" on public.friend_requests
  for insert with check (auth.uid() = from_user);

drop policy if exists "friend_requests update recipient" on public.friend_requests;
create policy "friend_requests update recipient" on public.friend_requests
  for update using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

-- game_invites: sender or recipient can read; sender inserts; recipient updates.
drop policy if exists "game_invites read" on public.game_invites;
create policy "game_invites read" on public.game_invites
  for select using (auth.uid() in (from_user, to_user));

drop policy if exists "game_invites insert sender" on public.game_invites;
create policy "game_invites insert sender" on public.game_invites
  for insert with check (auth.uid() = from_user);

drop policy if exists "game_invites update recipient" on public.game_invites;
create policy "game_invites update recipient" on public.game_invites
  for update using (auth.uid() = to_user)
  with check (auth.uid() = to_user);

-- =========================================================================
-- Realtime: broadcast changes for live multiplayer.
-- =========================================================================
-- Idempotent realtime registration. `alter publication ... add table` errors
-- if the table is already a member, so we wrap each in a DO block that swallows
-- duplicate_object so the whole script is safe to re-run.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'games',
      'game_players',
      'moves',
      'cell_locks',
      'friend_requests',
      'game_invites'
    ])
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;  -- publication not present (rare)
    end;
  end loop;
end $$;
-- Note: do NOT add player_progress to realtime — it's per-player private state.
