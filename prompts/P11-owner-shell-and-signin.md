# P11-owner-shell-and-signin · Owner app: private address, sign-in, layout

**Goal:** Build the owner app frame: it runs only at its own base path, has its own sign-in, a desktop sidebar and a phone bottom tab bar.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/08_AUTH_AND_ACCESS.md` (all), `docs/04_DESIGN_SYSTEM.md` §7 (sidebar, phone tabs)

## Look at these screens before you write code
Open each PNG (it is the approved design) and read its HTML for exact sizes, colours and copy.
- Screen 35, Owner sign-in at the private address (1440×900, clock 10:30 PM): `design/screens/35-owner-sign-in-at-the-private-address.png` and `design/html/35-owner-sign-in-at-the-private-address.html` → `/owner-dev/sign-in`
- Screen 36, Dashboard (1440×1479, clock 10:30 PM): `design/screens/36-dashboard.png` and `design/html/36-dashboard.html` → `/owner-dev/`
- Screen 52, Sign in (390×844, clock 10:30 PM): `design/screens/52-sign-in.png` and `design/html/52-sign-in.html` → `/owner-dev/sign-in`
- Screen 53, Home (390×1715, clock 10:30 PM): `design/screens/53-home.png` and `design/html/53-home.html` → `/owner-dev/`

## Build
1. The owner entry reads its base path from `<meta name="app-base">` and passes it to React Router as `basename`. Nothing in the code knows the real address.
2. `/sign-in` (screen 35 desktop, screen 52 phone):
   - Desktop: the walnut brand panel with "Owner portal" and the private-address note, and the white sign-in card on the right.
   - Phone: the single-column version.
   - Aqil or Adil, password, keep me signed in. Wrong password and "wait 15 minutes" states.
3. Layout for signed-in routes:
   - `OwnerSidebar` (240 px) with the 11 items in the order in `04_DESIGN_SYSTEM.md` §7 (including **Workers**) and the owner's name and language switch at the bottom.
   - Main area padding 26/30.
   - Under 768 px: `PhoneTopBar` (brand plus bell with the unread count) and `PhoneTabBar` (Home, Live, Sheets, Players, More). "More" opens a sheet listing Prices, Canteen, Expenses, Activity, Workers and Settings.
4. Placeholder pages for every owner route in `docs/03_ROUTES_AND_SCREENS.md`, with the right titles, so navigation works.
5. Route guard: every owner route except `/sign-in` needs an owner session. Signing out returns to `/sign-in` at the same base path.
6. Confirm again that the counter build has no owner strings (`npm run check:bundles`).

## Done when
- `/owner-dev/sign-in` matches screen 35 at 1440×900 and screen 52 at 390×844.
- The sidebar and phone tabs navigate every owner route.
- `check:bundles` passes.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).


## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run test:visual` for the screens above. Fix everything until they pass.
2. Start the app and compare each screen above with its PNG at the design size. List any difference you could not fix.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P11 Owner app: private address, sign-in, layout"`.
