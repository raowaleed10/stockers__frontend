# Stockers

Frontend for the Stockers snooker club: the counter touch screen, the owner portal on a computer, and the owner portal on a phone. The backend is built later; until then a mock API (MSW, from `mock/seed.json`) answers every call.

Start with `CLAUDE.md` (the rules) and `START_HERE.md` (how the build steps work). `PROGRESS.md` shows what is done.

## Install

You need Node.js 20 or newer (npm 10 or newer) and Git.

```bash
npm install
npx playwright install chromium   # once, for the browser tests
```

## Run

```bash
npm run dev
```

One dev server serves both apps:

| App         | Address                         |
| ----------- | ------------------------------- |
| Counter     | http://localhost:5173/          |
| Owner (dev) | http://localhost:5173/owner-dev/ |

The owner path `/owner-dev/` exists only in development. Add `?now=2026-10-03T21:42:00%2B05:00` to an address to move the demo clock, and `?lang=ur` for Urdu. Settings are in `apps/web/.env.example`.

## Check

```bash
npm run typecheck     # TypeScript, all workspaces
npm run lint          # ESLint (including the counter/owner import rule) and Prettier
npm test              # Vitest: shared rules and components
npm run build         # two bundles: apps/web/dist/counter and apps/web/dist/owner
npm run check:bundles # fails if dist/counter contains any owner code
npm run preview:owner # serves dist/owner under a fake secret address (http://localhost:4173/owner-preview-x7/); run the build first
npm run test:e2e      # Playwright flows (starts the dev server and the owner preview by itself)
npm run test:visual   # Playwright screenshots against design/screens (from P05 on)
```

## Layout

```
apps/web/        the frontend: counter.html and owner.html, each with its own entry in src/
packages/shared/ types and pure rules, reused by the backend later
design/          approved screens (PNG and HTML), tokens, Tailwind preset
docs/            product, decisions, routes, design system, data, rules
mock/seed.json   sample data for the mock API
prompts/         the build steps P00 to P20
```
