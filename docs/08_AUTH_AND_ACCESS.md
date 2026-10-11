# 08 · Sign-in, privacy and who did what

New owner rules from 12 Oct 2026 (D49–D53). The **server** enforces all of this. The frontend's job is to never leak the owner address, to show the right states, and to show names everywhere.

## 1. Two apps, two entries

| | Counter app | Owner app |
|---|---|---|
| URL | club address root, e.g. `https://stockers.pk/` | private address, e.g. `https://stockers.pk/owner-k7m2q9/` |
| Vite entry | `apps/web/counter.html` → `src/counter/main.tsx` | `apps/web/owner.html` → `src/owner/main.tsx` |
| Build output | `dist/counter/` | `dist/owner/` |
| API namespace | `/api/counter/*` (worker session) | `/api/owner/*` (owner session) |
| Who | Shabir, Zain (and any worker the owners add) | Aqil, Adil |

### How the private address stays private
1. **No link or button.** The counter app has no owner sign-in, no owner button, and no text mentioning an owner address. The lock screen offers only "Switch worker" (screen 34).
2. **Separate bundles.** The owner app is a separate bundle. Nothing in `src/counter` may import from `src/owner`; add an ESLint `no-restricted-imports` rule to stop it.
3. **Nothing in the counter files.** The secret address is **never** written into frontend code or `.env` files that end up in the counter bundle. Add a build check that greps `dist/counter` for `owner-` and `/api/owner` and fails if found.
4. **Base path at runtime.** The owner bundle is built with `base: './'` (relative asset paths). At runtime it reads its base path from `<meta name="app-base" content="/owner-k7m2q9/">`, which the server injects when it serves `owner.html` at the secret path. React Router uses that as `basename`.
5. **Everything else is "Page not found".** Any address that is not `/`, the counter routes, or the secret path shows a plain "Page not found", the same as for a mistyped address. Never answer "this is the owner area".
6. **In development** the owner app runs at `/owner-dev/`. A dev-only Vite plugin injects the meta tag. This path exists only in dev. (Dev assets use absolute paths, so dev needs no `<base>` tag.)
7. **Changing the address.** Owners can change it in Settings (screen 51). The server generates a new random slug and signs out every owner session. The app shows the new address once with a Copy button.

### How the server serves the owner app (deep links)

The owner bundle uses relative asset paths (`base: './'`). On a hard reload at a deep link such as `/<secret>/sheets/2026-10`, the browser would look for `/<secret>/sheets/assets/…` and find nothing. So the server follows these rules. The backend copies them exactly. `scripts/preview-owner.mjs` is a working example: `npm run preview:owner` serves `dist/owner` under the fake prefix `/owner-preview-x7/`, and `owner-deep-link.preview.spec.ts` tests it.

1. **Every address under the secret prefix that is not a file in `dist/owner/assets/`** returns `owner.html` (status 200) with these two tags injected as the first children of `<head>`, before the script and link tags:
   ```html
   <base href="/<secret>/" />
   <meta name="app-base" content="/<secret>/" />
   ```
   The `<base>` tag makes `./assets/…` resolve to `/<secret>/assets/…` from any depth. The meta tag gives the router its `basename`. Send `Cache-Control: no-cache`: the page names the hashed files and changes with every build.
2. **Files under `/<secret>/assets/`** come from `dist/owner/assets/`. Their names carry a hash, so they can be cached for a long time (`public, max-age=31536000, immutable`). A file that is not there returns **404**, not `owner.html`, so a stale script shows up as an error and not as a page of HTML read as JavaScript.
3. **Every other address shows "Page not found"** (status 404), the same page as for any mistyped address. Nothing in it hints that an owner area exists. This includes a longer word that only starts like the secret (`/<secret>x`), which is not under the prefix.
4. **`/<secret>` without the closing slash** redirects (302) to `/<secret>/` and keeps the query string.
5. **The slug is lower-case letters, digits and hyphens only.** The server checks this before it puts the slug into HTML.

Note: the private address hides the door; the **owner password** is the lock. The owner sign-in page waits 15 minutes after 5 wrong tries (copy on screen 35).

## 2. Owner sign-in (screens 35, 52)
- Choose Aqil or Adil, type the password, and tick "Keep me signed in on this computer" (or phone).
- The session is an HTTP-only secure cookie, scoped to the owner path. No tokens in localStorage.
- Owners never use the counter app to sign in. If an owner needs to work at the counter, a worker signs in, or the owners add themselves as a worker with a PIN.

## 3. Worker sign-in with sign-in times (screens 1, 2, 34, 50)
- **Screen 1:**
  - The sign-in page lists the workers from `GET /api/counter/workers/public`: name, sign-in time, and whether it is their time now ("Your time now" / "Not now").
  - The worker taps his name, then enters his 4-digit PIN on the keypad.
- **Screen 2 (outside his time):**
  - Before or after the PIN, the server answers `403 NOT_YOUR_TIME` with `{slot, now}`.
  - The screen shows "Not your time to sign in. Shabir can sign in from 2:00 AM to 10:00 AM. It is 9:42 PM now. Only an owner can change sign-in times." with an OK button.
- **Only the time of day counts**, never the date. Slots can cross midnight (`22:00–06:00`). The server clock decides; the device clock is never trusted.
- **Signed in:**
  - The top bar shows the worker chip "Zain, Until 11:00 PM". Tapping it offers "Switch worker", which signs out and returns to screen 1.
  - **10 minutes before the end:** a banner: "Your sign-in time ends at 11:00 PM. Finish what you are doing."
  - **At the end:** he is signed out to screen 1. Games keep running and stay recorded under him.
- **Lock (screen 34):**
  - After 5 minutes without a tap, the screen locks.
  - "Zain, enter your PIN" unlocks it, if he is still inside his time.
  - "Switch worker" lets the other worker sign in, if it is his time.
- **Wrong PIN:** the dots shake once and "Wrong PIN. Try again." appears. After 5 wrong tries, "Wait 5 minutes".
- **Gaps:** in the times between slots nobody can sign in (example 10 AM–2 PM and 11 PM–2 AM). The sign-in screen shows each worker as "Not now". This is an open question for the owners; build it as described.

## 4. Who did what (D52)
- The client never sends "who". The server takes it from the session and saves `doneBy` on every write.
- Every list and history shows the name:
  - Activity "Done by" column and filter (screen 38).
  - Sheet history lines "9:04 PM, Zain: started, rate Rs 15" (screen 42).
  - Sheet header "closed by Shabir" (screen 41).
  - Expenses "Added by" (screen 49).
  - Statements (screens 25, 30, 44).
- Dialogs that create money records show the actor, e.g. "Added by Zain" on the drawer expense (screen 29).

## 5. What each role can see

| Area | Worker | Owner |
|---|---|---|
| Live board, games, checkout, canteen, players, statements | ✓ | ✓ (read-only live view at `/live`) |
| Drawer expense (add) | ✓ | ✓ (edit or remove in Expenses) |
| Today's cash and online totals | ✓ | ✓ |
| Profit, reports, dashboard, expenses list | – | ✓ |
| Prices, games, canteen items and stock | – | ✓ |
| Correct sheets and statements | – | ✓ (with reason, saved in history) |
| Workers, sign-in times, PINs | – | ✓ |
| Settings, private address, backups | – | ✓ |

Hide what a role can't use; never show a disabled owner feature on the counter.
