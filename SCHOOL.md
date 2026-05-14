# Playing Melio Games at school

If your school's network filter blocks `meliogames.com`, the fix is a **mirror deployment on a different domain**. The browser sees a different URL, the filter doesn't recognize it, and you get to play. Same app, same backend, different front door.

This guide walks through the options ordered from easiest to most robust.

---

## How school filters actually block sites

Most school networks block in one of these ways. Knowing which one matters because they have different workarounds:

1. **DNS / domain blocking** — the filter sees `meliogames.com` in the URL and blocks it. The IP of the server is fine; only the name is bad. **Fix: a mirror on any other domain works.**
2. **Keyword in URL** — the filter blocks any URL containing "game" or similar. **Fix: pick an innocuous-sounding mirror domain.**
3. **Category-based** (Securly, GoGuardian, Bark, etc.) — the filter has a database of sites categorized as "games" and blocks the whole category. New domains usually take days–weeks to get classified. **Fix: a new mirror domain stays unclassified for a while.**
4. **IP-address blocking** — rare for student-facing networks, but the filter blocks the server's IP directly. **Fix: a mirror hosted on a different host (Cloudflare, Netlify, etc.) gets a new IP.**
5. **SSL inspection / deep packet** — the filter intercepts HTTPS and reads the SNI. Same as DNS blocking in practice. **Fix: same as #1.**

The common workaround for all of these: **a mirror on a non-gaming-named domain hosted somewhere different**.

---

## Option 1 — Cloudflare Pages mirror (recommended)

Cloudflare Pages gives you a free `*.pages.dev` subdomain. Cloudflare hosts a huge chunk of the legitimate web, so school filters rarely block the whole `pages.dev` namespace.

### Setup (≈ 10 minutes)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Authorize Cloudflare to read your GitHub. Pick the `melios-sudoku` repo.
4. **Project name**: choose something innocuous. Examples that have worked:
   - `puzzlepractice`
   - `studybreak`
   - `quickfocus`
   - `paperboard`
   - Avoid: anything with "game", "play", "sudoku", "wordle", etc. in the name. Project name becomes your subdomain (e.g. `puzzlepractice.pages.dev`).
5. **Framework preset**: Next.js.
6. **Environment variables** — add the same two from your Vercel project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. **Save and Deploy**. First build takes ≈ 3 minutes.
8. When done, you'll have `https://<your-name>.pages.dev` — bookmark it.

### One required Supabase tweak

The Supabase project needs to know about the new origin or auth will fail.

1. Supabase dashboard → **Authentication → URL Configuration**.
2. Under **Redirect URLs**, **add** (don't replace):
   - `https://<your-name>.pages.dev/sudoku/auth/callback`
3. Leave your existing `meliogames.com` URL there too — both will work.

Now the same app is reachable at the new URL, leaderboard and friends shared with your main site.

### About the Cloudflare build

Cloudflare Pages auto-detects Next.js and uses the [OpenNext](https://opennext.js.org/cloudflare) adapter to compile the app for Cloudflare Workers. OpenNext doesn't support Next.js Node.js-runtime middleware (Next 16 calls it `proxy.ts`), so this repo deliberately doesn't ship one — Supabase session refresh happens lazily inside `getUser()` on every authed page instead. You may see warnings about `nodejs_compat` flags or KV cache during the build; those are safe to ignore.

---

## Option 2 — Vercel second project, fresh subdomain

If you already have the project on Vercel, just create a **second Vercel project** pointing at the same repo. Each Vercel project gets its own `<name>.vercel.app` subdomain.

1. [vercel.com/new](https://vercel.com/new) → import the same `melios-sudoku` repo.
2. **Project name**: pick something innocuous (as in option 1).
3. Add the same two Supabase env vars.
4. Deploy.
5. Update Supabase redirect URLs as in option 1.

This is even faster than Cloudflare if you're already on Vercel. The downside: `vercel.app` is sometimes blocked outright as a known dev-hosting domain. Try Cloudflare first if that's the case.

---

## Option 3 — Google Sites portal (only works if your main URL is still reachable)

If `meliogames.com` (or your mirror) is reachable but you just don't want a teacher seeing the URL bar say "meliogames.com", you can embed via Google Sites.

This **does not bypass blocking** — if the underlying URL is blocked, the iframe content won't load either. But it does hide the URL in the address bar (which will say `sites.google.com`).

1. Go to [sites.google.com](https://sites.google.com) → create a new blank site.
2. Name it something boring: "Study notes", "Math practice", "Period 3 review".
3. Insert → Embed → **Embed code** → paste:
   ```html
   <iframe
     src="https://meliogames.com/wordle?embed=1"
     width="100%"
     height="700"
     style="border: 0; border-radius: 12px"
     loading="lazy"
   ></iframe>
   ```
   (Swap the URL for any game: `/sudoku/daily`, `/connections`, `/minesweeper`, `/2048`. The `?embed=1` strips Melio's header/footer for a clean view.)
4. Publish. The URL is now `https://sites.google.com/view/<your-name>`.

`sites.google.com` is on the allowlist at virtually every school because it's a Google Workspace product. Pair this with option 1 or 2 — embed the *mirror's* URL in the Google Site, so even if `meliogames.com` is blocked, the underlying iframe still loads.

---

## Option 4 — Innocuous custom domain

If you own a domain or are willing to register one, you can point a non-gaming-named domain at your Vercel/Cloudflare project.

- Domain like `puzzles.example.com` or `studyboard.app` ≈ $10/year.
- Add it as a custom domain in Vercel/Cloudflare Pages.
- New domain takes a few weeks to get classified by school filters; in the meantime it just works.
- When it eventually gets categorized as "games", repeat with a new domain.

This is what most established "unblocked games" sites do.

---

## What works in an iframe vs. what doesn't

When you embed via Google Sites (or any other site), some features may not work because browsers restrict third-party cookies in cross-origin iframes:

| Feature | Works in iframe? |
|---|---|
| Solo Sudoku (any difficulty) | ✅ |
| Wordle | ✅ |
| Connections | ✅ |
| Minesweeper | ✅ |
| 2048 | ✅ |
| Daily Sudoku (guest play) | ✅ |
| Sign in / sign up | ⚠️ Some browsers block third-party auth cookies |
| Saving streaks across visits | ⚠️ localStorage in iframes is per-origin; works but tied to the iframe's origin |
| Multiplayer race / co-op | ⚠️ Best to open in a new tab (`target="_blank"`) |
| Leaderboard / friends | ⚠️ Same |

For full functionality, click into the actual site rather than playing inside the iframe.

---

## What we DON'T support (and won't)

- **Hosting on Google Sheets / Google Docs.** Sheets is a spreadsheet, not a hosting platform. The viral "unblocked games on Google Sheets" thing is misinformation.
- **Built-in VPN / proxy bypass.** A website can't tunnel its own traffic past a school filter — that requires VPN software running on your device. Plenty of free options exist (Cloudflare WARP, etc.) but installing a VPN at school may violate the AUP.
- **Hidden URL paths.** A path like `meliogames.com/study123` still hits the blocked domain.

The reliable path is always: **change the domain in front of the same code**.
