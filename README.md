# Melio's Sudoku

A multiplayer sudoku game. Solo, co-op (shared board), or race (same puzzle, separate boards, fastest wins).

Built with Next.js (App Router), Tailwind, Supabase, and deployed on Vercel.

## Status

- **M1 — Solo play:** done. Generator + solver, four difficulties, board UI with notes, hints, undo, mistake tracking, timer.
- **M2 — Auth + saved progress:** done. Email/password sign-up + sign-in, header with account menu, saved games list on landing, profile page with stats and best times.
- **M3 — Multiplayer rooms:** done. Server-side puzzle generation, invite links + 6-char codes, race mode with live opponent progress bars, co-op shared board with cell-locks-while-typing, guest play via cookie.
- **M4 — Friends:** done. Add by username, friend requests, friends list, public profile pages (`/u/<username>`), challenge button (creates game + sends `game_invite`), invites inbox on `/friends`, header badge counts pending requests + invites. Race opponents can be invited at game-creation time too.
- **M5 — Polish:** in progress. Race-mode confidentiality is now hardened (per-player board moved to a private `player_progress` table protected by RLS). Short `/i/<code>` redirect for verbal sharing. Vercel deploy ready. **TODO before public launch:** set up custom SMTP (see [DEPLOY.md → Custom SMTP](DEPLOY.md#custom-smtp-production)) — Supabase's built-in email is rate-limited to a few per hour and unsuitable for real users.

## Local development

Requires Node 20+.

```bash
npm install
cp .env.local.example .env.local   # then fill in values from your Supabase project
npm run dev
```

The solo experience works without Supabase configured. Auth and multiplayer require the env vars.

## Supabase setup

1. Create a project at https://supabase.com.
2. From `Project Settings → API`, copy the Project URL and the `anon` public key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Open `Project → SQL Editor` and run the contents of `supabase/schema.sql`. This creates the tables, triggers, RLS policies, and adds the realtime publications.
4. (Optional) Generate up-to-date TypeScript types after the schema is applied:
   ```bash
   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
   ```

## Deploying to Vercel

The full step-by-step is in [DEPLOY.md](DEPLOY.md). Short version:

1. Push the repo to GitHub.
2. Import it on Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project's env vars.
4. Deploy.
5. Update Supabase **Authentication → URL Configuration** — set Site URL to your Vercel URL and add `<vercel-url>/auth/callback` to Redirect URLs.

## Architecture sketch

- **Client-side puzzle generation** for solo (`src/lib/sudoku/engine.ts`). The generator builds a fully solved board, then removes cells while verifying the puzzle still has exactly one solution.
- **Reducer-based game state** (`src/lib/sudoku/useSudokuGame.ts`) with notes, undo history, conflict detection, mistake counting, and a tick timer.
- **Server-side Supabase client** (`src/lib/supabase/server.ts`) for RSC and route handlers; **browser client** (`src/lib/supabase/client.ts`) for use inside `'use client'` components.
- **Proxy** (`src/proxy.ts`) keeps the session cookie warm on every navigation. (Next.js 16 renamed `middleware.ts` to `proxy.ts`.)
- **RLS** (`supabase/schema.sql`) enforces participant-only access to game state. Anonymous game reads are allowed so guest invite links work; writes require either the authed user or a `guest_id` matching the player row.

## Multiplayer design

- **Co-op:** one shared `current_board` on the `games` row, kept in sync via Supabase Realtime postgres_changes. Cell locks are sent as **broadcast events** (in-memory, low-latency) when a player selects a cell — the UI dims a cell when another player is editing it.
- **Race:** each player's board lives in a private `player_progress` table (RLS-locked to `auth.uid()`); opponents see only `game_players.progress_pct` (a 0-100 integer) plus live broadcast progress events — never the actual cell values. Server records `finish_time_ms` on the first player to finish; the game flips to `completed` immediately.
- **Invite links:** `/play/<game_id>` for the full link, plus a 6-char `invite_code` (omits ambiguous letters) at `/i/<code>` for share-by-voice. Authed users and guests can both join; guests get a `ms_guest_id` cookie and pick a display name.

## Friends

- Add by username at `/friends` (case-insensitive search). Reverse-pending requests auto-accept.
- Public profile at `/u/<username>` shows best times and the right CTA (Challenge / Add friend / Pending / Respond).
- "Challenge" creates a game and pre-sends a `game_invite` row to the friend; they see it on `/friends` and accept to join.
- The header pings a red badge with count of pending friend requests + game invites.

## Known limitations

- **Guest persistence is degraded by design.** Without `auth.uid()`, RLS blocks guest writes to `game_players`, `player_progress`, and `moves`. Guest race/solo boards are persisted to `localStorage` instead, and guest progress is only visible to opponents while they're online (live broadcast). For full persistence, sign in.
- **No live invite/request notifications yet.** The header badge updates on page navigation, not in real time. Realtime subscribe-to-own-invites is planned.
- **Hint button on solo quick-play only.** The full game room (`/play/<id>`) doesn't expose hints — partly because hints are server-known answers and we want race participants to earn the win.

## Project layout

```
src/
  app/
    layout.tsx
    page.tsx                  # landing (auth-aware: resume cards + new-game CTA)
    JoinByCodeForm.tsx
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
      callback/route.ts       # OAuth/email-link exchange
    new-game/
      page.tsx                # mode + difficulty + invite friends
      NewGameForm.tsx
    play/
      page.tsx                # solo quick-play: ?d=easy|medium|hard|expert
      [id]/
        page.tsx              # game room (RSC: loads game + me + private board)
        JoinForm.tsx
        GameRoom.tsx          # realtime sync, board, opponent panel
    friends/
      page.tsx                # friends + requests + invites inbox
      AddFriendForm.tsx
      FriendActions.tsx
    profile/page.tsx          # own profile: stats, best times, recent games
    u/[username]/
      page.tsx                # public profile + Add friend / Challenge
      ChallengeButton.tsx
    i/[code]/route.ts         # short invite-code redirect → /play/<id>
  components/
    Header.tsx                # auth state + Friends link + pending badge
    sudoku/
      SudokuBoard.tsx
      NumberPad.tsx
      SoloGame.tsx
  lib/
    sudoku/
      engine.ts               # generator + solver + progress %
      types.ts
      useSudokuGame.ts
    supabase/
      client.ts
      server.ts
      proxy.ts
      types.ts
    auth/
      actions.ts              # signIn / signUp / signOut
      server.ts               # getUser / getCurrentProfile
    games/
      actions.ts              # createGame / joinGame / joinByInviteCode / recordMove / finish*
    friends/
      actions.ts              # send/accept/decline friend request, accept/decline game invite, unfriend
    guest.ts                  # ms_guest_id + ms_guest_name cookies
  proxy.ts
supabase/
  schema.sql                  # source of truth for the public schema
```
