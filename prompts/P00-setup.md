# P00-setup · Install everything and set up the project

**Goal:** First check this computer and install everything the project needs (Node.js, Git, every library, the test browser). Then create the project skeleton: an npm workspace with the web app (two entries: counter and owner) and a shared package, with fonts, i18n, routing, data fetching, mocks and tests ready. No screens yet.

## Read first
- `CLAUDE.md` (rules) and `PROGRESS.md` (what is done)
- `docs/03_ROUTES_AND_SCREENS.md`, `docs/06_DATA_AND_API.md`, `docs/08_AUTH_AND_ACCESS.md` §1, `docs/10_TESTING_AND_QA.md`

## Build
### Part A: check the computer and install the tools (do this before any code)
Run each check yourself and show me the results in a short table (tool, version found, OK or installed).

1. **Which computer is this?** Find the operating system (Windows, macOS or Linux) and use the right commands for it in every step below.
2. **Node.js 20 or newer and npm 10 or newer.** Run `node -v` and `npm -v`.
   - If Node is missing or older than 20, install the LTS version:
     - Windows: `winget install --id OpenJS.NodeJS.LTS -e`
     - macOS: `brew install node` (if Homebrew is missing, stop and tell me)
     - Linux: use the NodeSource LTS package or `nvm install --lts`
   - After installing, run `node -v` again. If the new version is not found, tell me to close and reopen VS Code, then stop. I will start this prompt again.
3. **Git.** Run `git --version`.
   - If it is missing, install it: Windows `winget install --id Git.Git -e`, macOS `xcode-select --install` or `brew install git`, Linux the system package manager.
   - Run `git config user.name` and `git config user.email`. If either is empty, **ask me** for my name and email and set them with `git config --global`. Don't invent them.
4. **If an install needs administrator rights, a password, or fails,** stop and tell me exactly what to install and from where (nodejs.org, git-scm.com). Don't try other ways around it.
5. **Check the kit is here.** The project root must contain `CLAUDE.md`, `PROGRESS.md`, `START_HERE.md`, `docs/` (11 files), `design/screens/` (58 PNGs), `design/html/` (58 HTML files), `design/tokens.css`, `design/tailwind.preset.ts`, `design/tiles.reference.css`, `design/screens.json`, `mock/seed.json` and `prompts/`. If the files are one folder too deep (for example inside `Stockers_Frontend_Kit_for_Claude_Code/`), move them up to the root. If anything is missing, stop and tell me.
6. **Git repository.**
   - If this folder is not a Git repository yet, run `git init`.
   - Create `.gitignore` with: `node_modules/`, `dist/`, `coverage/`, `test-results/`, `playwright-report/`, `blob-report/`, `.env`, `.env.*`, `!.env.example`, `.DS_Store`, `Thumbs.db`.
   - If there are no commits yet, commit the kit: `git add -A` and `git commit -m "Add Stockers frontend kit"`.
7. **Internet for packages.** Run `npm ping`. If it fails, stop and tell me.

### Part B: create the project and install every library
Use these major versions. They match the kit (the Tailwind preset is written for Tailwind 3). Don't upgrade a major version without asking me.

8. Root `package.json` (private) with npm workspaces `apps/*` and `packages/*`, `"engines": {"node": ">=20"}`, and the scripts from CLAUDE.md (`dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `test:visual`, `check:bundles`) that run in the workspaces.
9. `packages/shared` (create its `package.json` first, named `@stockers/shared`): a TypeScript library with `src/types.ts` (copy the types from `docs/06_DATA_AND_API.md` §1), an empty `src/rules/index.ts`, and Vitest.
   - Install: `npm install -D typescript@^5 vitest@^2 -w packages/shared`
10. `apps/web` (create its `package.json` first, named `@stockers/web`, depending on `@stockers/shared`): Vite + React 18 + TypeScript strict. Install the libraries with npm (run from the root):
    - Runtime: `npm install react@^18 react-dom@^18 react-router-dom@^6 @tanstack/react-query@^5 zustand i18next react-i18next lucide-react recharts@^2 @fontsource/barlow @fontsource/barlow-condensed @fontsource/noto-nastaliq-urdu -w apps/web`
    - Build and types: `npm install -D vite@^5 @vitejs/plugin-react@^4 typescript@^5 @types/react@^18 @types/react-dom@^18 @types/node tailwindcss@^3 postcss autoprefixer -w apps/web`
    - Mocks and tests: `npm install -D msw@^2 vitest@^2 jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright -w apps/web`
    - Lint and format: `npm install -D eslint@^9 @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-jsx-a11y prettier -w apps/web`
    - If npm reports a peer-dependency conflict, pick versions that fit together within the majors above. Don't use `--force` or `--legacy-peer-deps` without telling me why.
11. One-time setup commands:
    - MSW service worker: `npx msw init apps/web/public --save`
    - Test browser: `npx playwright install chromium` (on Linux add `--with-deps`)
12. Vite config:
    - Two HTML entries, `counter.html` and `owner.html`, and a build that outputs `dist/counter` and `dist/owner`. The owner build uses `base: './'`.
    - Dev server: counter at `/`. Owner at `/owner-dev/` through a small dev-only Vite plugin that serves `owner.html` there and injects `<meta name="app-base" content="/owner-dev/">`.
13. Tailwind CSS 3:
    - Copy `design/tailwind.preset.ts` into `apps/web/` and use it as a preset in `tailwind.config.ts` (content: both HTML entries and `src/**/*.{ts,tsx}`), with `postcss.config.js`.
    - Copy `design/tokens.css` to `src/styles/tokens.css` and import it in both entries.
    - Base styles: body font Barlow, counter body background `--c-page`, owner `--o-page`.
14. Fonts are bundled locally from the `@fontsource` packages: Barlow (400, 500, 600, 700), Barlow Condensed (500, 600, 700), Noto Nastaliq Urdu (400, 700). No Google Fonts links in the app; the club may be offline.
15. Wire up the libraries: React Router, TanStack Query, Zustand, react-i18next (with `en.json` and `ur.json` and a `useLanguage()` hook that sets `lang`/`dir` on `<html>`), lucide-react, Recharts, MSW (browser worker; on by default in dev with `VITE_MOCKS=on` in `.env.development`, plus an `.env.example`).
16. `src/lib/clock.ts`:
    - A clock with `now()`, a `useNow(intervalMs = 1000)` hook, and a demo mode that starts at `2026-10-03T21:42:00+05:00` (counter) or `2026-10-03T22:30:00+05:00` (owner) and ticks.
    - It can be overridden with `?now=` and turned off with `VITE_DEMO_CLOCK=off`.
17. Folder layout exactly as in CLAUDE.md, with an `App` per entry and an `ErrorBoundary`. Add a plain "Page not found" route in both apps.
18. ESLint (flat config) + Prettier:
    - A `no-restricted-imports` rule so `src/counter/**` cannot import `src/owner/**` and the reverse.
    - A rule that forbids `Date.now()` and `new Date()` with no arguments in `src/counter`, `src/owner` and `src/ui`; they must use the clock.
19. `scripts/check-bundles.mjs`: after build, fail if any file in `dist/counter` contains `owner-`, `/api/owner` or `owner.html`.
20. Vitest + Testing Library (jsdom). Playwright with three projects: `counter` (1440×900), `owner` (1440×900), `phone` (390×844, owner app), and a `webServer` that starts the dev server.
21. A short `README.md` at the root: how to install (`npm install`), run (`npm run dev`) and test.
22. `PROGRESS.md` is already in the kit (a checklist of P00–P20 and screens 1–58). Keep it at the project root and tick P00 when done.

### Part C: prove it works
23. From a clean state run `npm install`, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:bundles` and `npx playwright test --list`. Fix anything that fails.
24. Start `npm run dev` and tell me the exact addresses for the counter and the owner app.

## Done when
- Part A table shows Node 20+, npm 10+ and Git, with my name and email set.
- `npm install && npm run dev` shows a placeholder counter page at `/` and a placeholder owner page at `/owner-dev/`, both in Barlow on the right background.
- `npm run build && npm run check:bundles` passes, and `dist/counter` has no owner code.
- typecheck, lint and test all pass (with one sample test each in `shared` and `web`), and Playwright lists its three projects.
- `.gitignore` keeps `node_modules` and `dist` out of Git.

## Don't
- Don't invent colours, fonts, spacing or words. Use the tokens and the exact copy from the design.
- Don't add features the owners removed (see `docs/02_DECISIONS.md`, "Removed on purpose").
- Don't import owner code into the counter app, or the other way round (except `src/ui`, `src/tiles`, `src/lib`, `packages/shared`).
- Don't build screens yet.
- Don't put the real owner address anywhere.
- Don't install anything globally except Node.js and Git (Part A). Every library goes in `package.json`.
- Don't use `sudo` or administrator rights without asking me first.

## When you finish
1. Run `npm run typecheck`, `npm run lint`, `npm test`. Fix everything until they pass.
2. Start the app and check that what you built works. List anything you could not finish.
3. Update `PROGRESS.md`: what you built (files, routes, screens), tests added, what is left, questions for the developer.
4. Tell me the routes to open to check your work.
5. When everything passes, commit: `git add -A` and `git commit -m "P00 Install everything and set up the project"`.
