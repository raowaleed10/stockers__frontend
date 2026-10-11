# CLAUDE.md: Stockers snooker club app (frontend)

Stockers is a snooker club at Mian Plaza, owned by Aqil Farooq and Adil Farooq. The app has three surfaces:

1. **Counter app** (`apps/web/src/counter`): the worker touch screen at the counter, 1440×900, dark theme. Used by Shabir and Zain. It runs games, timers, checkout, canteen, drawer expenses and closing the sheet.
2. **Owner portal** (`apps/web/src/owner`): opens only at a private address. Light theme, desktop sidebar. It covers money, sheets, players, prices, canteen, expenses, workers, settings and activity.
3. **Owner portal on phones**: the same owner app, responsive down to 390 px wide with a bottom tab bar.

The backend is built later. Until then all data comes from a mock API (MSW) loaded from `mock/seed.json`.

## Where the truth is

| Question | Look in |
|---|---|
| What does screen NN look like? | `design/screens/NN-*.png` (picture) and `design/html/NN-*.html` (exact sizes, colours, copy) |
| What route, which components, which states? | `docs/03_ROUTES_AND_SCREENS.md` |
| Colours, fonts, spacing, table tiles | `docs/04_DESIGN_SYSTEM.md`, `design/tokens.css`, `design/tailwind.preset.ts` |
| Shared components and props | `docs/05_COMPONENTS.md` |
| Types, API calls, live events, mock data | `docs/06_DATA_AND_API.md`, `mock/seed.json` |
| Money and game rules shown on screens | `docs/07_RULES_FOR_SCREENS.md` |
| Owner address, worker PINs, sign-in times, locking | `docs/08_AUTH_AND_ACCESS.md` |
| Urdu and right-to-left | `docs/09_URDU_RTL.md` |
| How to test against the images | `docs/10_TESTING_AND_QA.md` |
| Why a rule exists | `docs/02_DECISIONS.md` (D1–D53, Q1–Q19) |

Always read the PNG **and** the HTML of every screen you build or change. Match layout, sizes, colours and the exact words. If a design and a doc disagree, stop and ask.

## Stack

- npm workspaces: `apps/web` (frontend), `packages/shared` (types and pure rules, reused by the backend later)
- Node.js 20+, npm 10+. Major versions are fixed: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5, MSW 2, Vitest 2. Don't upgrade a major version without asking.
- React 18 + TypeScript (strict) + Vite, with **two HTML entries**: `counter.html` and `owner.html`
- Tailwind CSS with the preset in `design/tailwind.preset.ts`. Use tokens only, never raw hex in components.
- React Router, TanStack Query for server data, Zustand for small UI and session state
- react-i18next with `en` and `ur`; right-to-left for Urdu
- Recharts for owner charts; lucide-react for icons (stroke 2, rounded)
- MSW for the mock API; a fake Socket.IO-style event emitter for live updates in mock mode
- Vitest + Testing Library for units, Playwright for flows and visual comparison, axe for accessibility
- Fonts bundled locally (offline club): Barlow, Barlow Condensed, Noto Nastaliq Urdu (`@fontsource/*`)

## Commands

```bash
npm install
npm run dev            # both apps: counter at /, owner at /owner-dev/ (dev only)
npm run build          # two bundles: dist/counter and dist/owner
npm run typecheck
npm run lint
npm test               # vitest
npm run test:e2e       # playwright flows
npm run test:visual    # playwright screenshots vs design/screens
```

## Golden rules

1. **Match the designs.** The PNGs are approved by the owners. Do not invent layouts, colours, words or extra features. Copy is sentence case, plain words, and the same action name through a flow ("Close sheet" → "Sheet closed").
2. **Keep the two apps apart.**
   - Never import anything from `src/owner` into `src/counter`.
   - The counter bundle must not contain the owner path, owner screens or owner API calls.
   - The owner app reads its base path at runtime; it is never hard-coded. See `docs/08_AUTH_AND_ACCESS.md`.
3. **Touch first.**
   - Counter targets are at least 56 px tall, and main actions are 60–80 px.
   - Owner targets are at least 44 px.
   - Nothing depends on hover.
4. **Tokens only.** Colours, radii, shadows and fonts come from the preset. The table tiles follow `docs/04_DESIGN_SYSTEM.md` exactly.
5. **Status colours (decision D7):**
   - Green: free.
   - Red: playing.
   - Yellow: paused.
   - Grey dashed: out of order.
   - Over 30 minutes: a red ring plus a solid red "red card" timer.
   - Pool, foosball, carrom, ludo and PlayStation without a price: shown, but locked.
6. **Money.**
   - Whole rupees as integers.
   - Format with `formatRs()` → `Rs 1,350`.
   - Calculations live in `packages/shared/rules` with unit tests. Components never do money maths inline.
7. **Time.**
   - Components read time from `useNow()` / `clock.now()`, never `Date.now()` or `new Date()` directly, so the demo clock and tests work.
   - The demo clock starts at `2026-10-03T21:42:00+05:00`. Each design shows its own moment of that night: use `now` and `scenario` from `design/screens.json` (`?now=…&scenario=…`) when you check a screen.
8. **Every action has a name.** Each write sends no user id from the client: the session decides who did it. Every list shows `doneBy` names (Shabir, Zain, Aqil, Adil).
9. **Data access.** Use only the typed API client and TanStack Query hooks in `src/*/api`. No `fetch` in components.
10. **Urdu.**
    - Every string goes through `t()`.
    - Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`, `text-start`).
    - Numbers stay Western digits.
    - Check every screen in Urdu before calling it done.
11. **Accessibility.**
    - Real `<button>`, `<a>`, `<label>`; no clickable divs.
    - Visible focus ring; `aria-label` on icon buttons; dialogs trap focus and close with Escape.
    - Status is never shown by colour alone: pills have text.
12. **Do not build** what the owners removed:
    - bookings, receipts or printing, WhatsApp;
    - credit limits or warnings, player self-service;
    - tournaments, member or time-of-day prices, Century scores.
13. **Small steps.** One prompt per conversation. When you finish a step:
    1. Run typecheck, lint and tests (and visual tests from P05 on).
    2. Update `PROGRESS.md`: what you built, which screens, what is left, any question for the developer.
    3. Then say you are done.

## Folder layout (target)

```
apps/web/
  counter.html, owner.html, vite.config.ts
  src/
    counter/   app.tsx, routes/, screens/, components/, api/
    owner/     app.tsx, routes/, screens/, components/, api/
    ui/        shared design-system components (no data access)
    tiles/     table tiles (snooker, room, pool, carrom, foosball, ludo, playstation, mini)
    lib/       clock, format, i18n, query client, events
    mocks/     msw handlers, seed loader, live-event simulator
    locales/   en/common.json, ur/common.json (words both apps use; counter-only words in counter/locales, owner-only in owner/locales)
  tests/       e2e/, visual/
packages/shared/
  src/types.ts, src/rules/*.ts (+ *.test.ts)
```
