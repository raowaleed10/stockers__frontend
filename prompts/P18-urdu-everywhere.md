# P18-urdu-everywhere · Urdu on every screen

**Goal:** Finish Urdu and right-to-left across both apps.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/09_URDU_RTL.md` (all)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 6, Live board in Urdu (1440×1040, clock 9:42 PM): `design/screens/06-live-board-in-urdu.png` and `design/html/06-live-board-in-urdu.html` → `/?lang=ur`
- Screen 1, Worker sign-in (1440×900, clock 9:42 PM): `design/screens/01-worker-sign-in.png` and `design/html/01-worker-sign-in.html` → `/sign-in`
- Screen 3, Live board (1440×952, clock 9:42 PM): `design/screens/03-live-board.png` and `design/html/03-live-board.html` → `/`
- Screen 25, A player’s bill (1440×900, clock 10:20 PM, scenario `checkout`): `design/screens/25-a-players-bill.png` and `design/html/25-a-players-bill.html` → `/checkout/bilal`
- Screen 36, Dashboard (1440×1479, clock 10:30 PM): `design/screens/36-dashboard.png` and `design/html/36-dashboard.html` → `/owner-dev/`
- Screen 51, Settings (1440×1936, clock 10:30 PM): `design/screens/51-settings.png` and `design/html/51-settings.html` → `/owner-dev/settings`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`

## Build
1. Move every remaining English string into `en.json`, and add `ur.json` entries using the word list. For the rest, use short spoken Urdu.
2. Check each route in Urdu at its design size. Fix:
   - clipped Nastaliq (line-height);
   - wrong alignment (use logical properties);
   - icons that should flip;
   - numbers that must stay Western.
3. Money `1,350 روپے`, times `رات 9:42`, dates in Urdu month names.
4. Write `docs/URDU_TO_CHECK.md` listing new Urdu strings for the owners to check.
5. Add a Playwright run of every route with `?lang=ur` that saves screenshots to `test-results/urdu` (no baseline).

## Done when
- Screen 6 still matches.
- Every other route looks right in Urdu, with nothing clipped or overlapping.
- The Urdu strings to check are listed.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P18 Urdu on every screen"`.
