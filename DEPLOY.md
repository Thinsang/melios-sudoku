# Deployment runbook — Melio's Sudoku

End-to-end steps to take the project from local code to a live URL on Vercel + Supabase. Roughly **20-30 minutes** start to finish, mostly waiting for project provisioning. Estimated cost: **$0** on free tiers (sufficient for hundreds of players).

---

## 0. Prerequisites

- A **GitHub** account.
- A **Supabase** account — free tier is fine. <https://supabase.com>
- A **Vercel** account — free tier is fine. <https://vercel.com>
- **Node.js 20+** locally if you want to test before deploying.
- The project is at `C:\Users\thins\melios-sudoku`.

---

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name it `melios-sudoku` (or whatever you like).
3. **Set a database password** — save it in a password manager. You'll rarely use it directly, but you can't recover it later.
4. Pick a **region** close to where most players will be (US East / EU West are reasonable defaults).
5. Click **Create new project**. Wait ~2 minutes for provisioning.

---

## 2. Apply the database schema

This creates every table, trigger, RLS policy, and realtime registration.

1. In the Supabase dashboard, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` in your editor, **copy the entire file**, paste into the SQL editor.
3. Click **Run** (or `Ctrl/Cmd + Enter`).
4. You should see `Success. No rows returned`.

**Verify** in the **Table Editor**:

- ✅ `profiles`
- ✅ `games`
- ✅ `game_players`
- ✅ `player_progress`
- ✅ `moves`
- ✅ `cell_locks`
- ✅ `friendships`
- ✅ `friend_requests`
- ✅ `game_invites`

If any are missing, re-run the script — it's safe to re-run (idempotent).

---

## 3. Configure Supabase Auth

### 3a. Email confirmation

By default Supabase requires email confirmation. **For initial testing, turn it off** so you can sign up without setting up SMTP:

1. **Authentication → Providers → Email**.
2. Uncheck **Confirm email**.
3. **Save**.

For real production, leave it on and configure custom SMTP — see [Custom SMTP (production)](#custom-smtp-production) below.

### 3b. URL configuration

Set this **before** you sign up locally so password-reset and confirmation links point at the right place:

1. **Authentication → URL Configuration**.
2. **Site URL**: `http://localhost:3000` (we'll change this after deploy).
3. **Redirect URLs**: add
   - `http://localhost:3000/sudoku/auth/callback`
   - (after deploy) `https://<your-domain>/sudoku/auth/callback`

> ⚠️ The sudoku app is mounted under `/sudoku/*` (the bare `/` is the
> Melio's Games hub). Auth callback paths therefore live at
> `/sudoku/auth/callback` — *not* `/auth/callback`. If you wired it up
> before, update the existing redirect URLs in Supabase.

---

## 4. Get your env values

1. **Project Settings → API** (gear icon, bottom of sidebar).
2. Copy two values:
   - **Project URL** → goes into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ Do **not** copy the `service_role` key. It's not needed and is dangerous to expose.

---

## 5. Test locally

```bash
cd C:\Users\thins\melios-sudoku
copy .env.local.example .env.local
# (or `cp` on macOS/Linux)
```

Open `.env.local` and paste the two values from step 4:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Then:

```bash
npm install   # only the first time
npm run dev
```

Open <http://localhost:3000>. Smoke-test in this order:

| # | Test | What to verify |
|---|------|----------------|
| 1 | Click any solo difficulty | Puzzle loads, you can solve a cell |
| 2 | Sign up | Header shows your username; redirected to home |
| 3 | New game → Race → Medium → Create | Lands on `/play/<uuid>`; invite code visible |
| 4 | "Copy invite link" | Link copied; paste into a private/incognito window |
| 5 | In incognito, join as guest | Both clients show each other in the side panel |
| 6 | Make moves on each side | Race progress bars tick up live |
| 7 | Sign out / sign in | Saved games appear under "Resume" |
| 8 | Create another account, send friend request | Header badge increments live without refresh |

If any fail, see [Troubleshooting](#troubleshooting).

---

## 6. Push to GitHub

```bash
cd C:\Users\thins\melios-sudoku
git add .
git commit -m "Initial commit — Melio's Sudoku"
```

Create an empty repo on github.com (no README, no .gitignore — we already have those). Then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/melios-sudoku.git
git push -u origin main
```

> ⚠️ Confirm `.env.local` is **not** committed (it should be ignored by `.gitignore`). If you accidentally pushed it, [rotate the anon key](https://supabase.com/dashboard/project/_/settings/api) — though the anon key is meant to be public-ish, your real risk is committing the `service_role` key (which we never use).

---

## 7. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pick `melios-sudoku`.
2. **Framework preset**: should auto-detect "Next.js". Leave defaults.
3. **Root directory**: `./` (default).
4. Expand **Environment Variables** and add both:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy**. First build takes ~2 minutes.
6. Vercel gives you a URL like `melios-sudoku-xxxx.vercel.app`. Visit it.

The home page should load. **Don't sign up yet** — first do step 8.

---

## 8. Update Supabase auth URLs for production

Now that you have a public URL, point Supabase at it.

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: `https://<your-vercel-url>` (the one Vercel gave you).
3. **Redirect URLs**: keep the localhost entries and **add**:
   - `https://<your-domain>/sudoku/auth/callback`
4. **Save**.

This is what makes:
- Confirmation emails (if enabled) link back to your live site, not localhost.
- Password-reset emails point at production.
- The OAuth/email-link callback at `/auth/callback` is allowed.

---

## 9. Smoke test production

Same flow as step 5, on your Vercel URL. Pay extra attention to:

- **Sign up + sign in** — confirms env vars are wired and auth callback URL is correct.
- **Multiplayer with a friend on a different network** — confirms Realtime works through the Vercel edge.
- **Mobile** — open on your phone too. Touch input on the board should feel right.

---

## Custom SMTP (production)

Supabase's **built-in email is rate-limited and meant for testing only** — typically 3-4 emails per hour per project, with no SLA. As soon as you have real users, signups, password resets, and game-invite emails will silently fail when you hit the cap. **Set up custom SMTP before going public.**

You need this for: sign-up confirmation emails, password resets, and any future email features (game-invite emails, magic links).

**Cheapest reliable option: [Resend](https://resend.com).** Free tier is 3,000 emails/month and 100/day, which is enough for a small game. Setup takes ~10 minutes.

### Resend setup (recommended)

1. **Sign up** at [resend.com](https://resend.com).
2. **Verify a domain** under **Domains → Add Domain**:
   - Add the DNS records they show you to your domain registrar (Cloudflare, Namecheap, etc.).
   - Wait a few minutes; Resend will mark the domain "Verified" once DNS propagates.
   - If you don't have a domain yet, you can test with the shared `onboarding@resend.dev` sender, but you can only send to your *own* verified email address until you verify a domain.
3. **Create an API key** at **API Keys → Create API Key**. Copy it (`re_...`).
4. In **Supabase → Project Settings → Auth → SMTP Settings**:
   - Toggle on **Enable Custom SMTP**.
   - **Sender email:** `noreply@yourdomain.com` (must match your verified Resend domain).
   - **Sender name:** `Melio's Sudoku`.
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** the API key from step 3.
   - **Save**.
5. **Test it.** Trigger a password-reset email from `/settings` on your site. It should arrive within a minute.

### Other providers

The same fields work for any SMTP provider — you just change the host, port, username, and password. Common alternatives:

| Provider | Host | Port | Free tier |
|---|---|---|---|
| Resend | `smtp.resend.com` | 465 | 100/day, 3000/month |
| SendGrid | `smtp.sendgrid.net` | 587 | 100/day forever |
| AWS SES | `email-smtp.<region>.amazonaws.com` | 587 | $0.10 per 1000 once verified |
| Postmark | `smtp.postmarkapp.com` | 587 | Paid only ($15/mo) — but best deliverability |
| Mailgun | `smtp.mailgun.org` | 587 | 100/day for 30 days, then paid |

### Customize the email templates

While you're in **Authentication → Email Templates**, take a minute to edit the **Confirm signup** and **Reset password** templates so they:

- Say "Melio's Sudoku" instead of generic Supabase wording.
- Use your production URL in the link (it should already, since you set Site URL in step 8).
- Have a friendly tone — Supabase's defaults are very plain.

### Verifying it works

After setup, in production:

1. Sign up with a test email you own.
2. The confirmation email should arrive within ~30 seconds.
3. Check the Resend (or your provider's) dashboard — there should be a "Delivered" entry. If you see "Bounced" or "Soft bounce", the recipient address is wrong; if "Failed", check the SMTP credentials.

### When to do this

- **Before launching to anyone but yourself** — even a small group will hit the built-in limits fast.
- **After custom domain (step 10)** — so emails come from `noreply@yourdomain.com` and not a Supabase address.

---

## 10. (Optional) Custom domain

1. Vercel project → **Settings → Domains** → add e.g. `sudoku.example.com`.
2. Set the DNS record they tell you to set.
3. Update Supabase **Site URL** + **Redirect URLs** to use the custom domain.

---

## Troubleshooting

### "Sign up" succeeds but I never get a confirmation email

If email confirmation is **on**, Supabase's built-in email service is throttled to ~3-4 emails per hour and may silently drop. Either:

- **For testing:** turn email confirmation off (step 3a).
- **For production:** configure custom SMTP — see [Custom SMTP (production)](#custom-smtp-production).

If a confirmation email *did* arrive previously but now doesn't, you've likely hit the rate limit. Same fix.

### Multiplayer race progress doesn't update live

- **Database → Replication** — confirm tables `games`, `game_players`, `moves`, `cell_locks`, `friend_requests`, `game_invites` are listed under the `supabase_realtime` publication. The schema script registers them; if they're missing, re-run the publication block.
- **Browser console** — if you see Realtime connect/disconnect loops, check that the project URL has `https://` and no trailing slash.

### "Permission denied" / RLS errors when joining a game

- Confirm the **schema is fully applied** (step 2). Specifically, the `is_game_player` function and the policies on `games`, `game_players`, `player_progress`, and `cell_locks` must exist.
- If you ran an earlier version of the schema and edited it, drop the schema and reapply, or run only the changed sections.

### "Invalid JWT" or 401 errors after a few hours

The proxy at `src/proxy.ts` refreshes the session cookie on every navigation. If it stops working after deploy, check that the proxy is included in the build output ("Proxy (Middleware)" should appear in `npx next build`).

### Players see opponents' actual numbers in race mode

That would be a real privacy bug — `player_progress` should be RLS-locked to `auth.uid()`. Confirm the policy `"player_progress own"` exists in **Authentication → Policies**. If not, re-run the schema.

### Settings page password reset email points at localhost

Site URL in Supabase is still `localhost:3000`. Update step 8.

### Build fails on Vercel: "Module not found: '@/lib/...'"

Path alias should be auto-detected from `tsconfig.json`. If not, ensure `tsconfig.json` includes `"baseUrl": "."` is implicit and `"paths": { "@/*": ["./src/*"] }` is set (it should be — scaffolded that way).

---

## Updating after deploy

```bash
git add .
git commit -m "..."
git push
```

Vercel auto-deploys on every push to `main`. The build takes ~1-2 minutes.

For schema changes:
1. Edit `supabase/schema.sql`.
2. Run the changed section in the Supabase SQL editor.
3. (Optional) regenerate the Database TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
   ```

---

## Quotas and costs (free tier)

| Resource | Free tier limit | Per active player roughly |
|---|---|---|
| Supabase database storage | 500 MB | A row per game (~150 bytes) + a row per move |
| Supabase realtime concurrent connections | 200 | One per open game tab |
| Supabase realtime messages | 2M / month | A few per move |
| Vercel bandwidth | 100 GB / month | Maybe 10 KB per page load |

You won't hit any of these with friends-and-family use. If the game ever takes off, the next paid tiers are ~$25/month each.

---

That's the runbook. The most common rough edge is forgetting step 8 (production auth URLs) — once that's done, everything else tends to "just work."
