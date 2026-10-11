# npm audit notes

Written 12 Oct 2026, at the end of P00 (follow-up). Re-run `npm audit` at P20 and update this file.

**Result today:** 15 packages flagged (7 moderate, 6 high, 2 critical) from 12 advisories. `npm audit fix` cannot clear any of them without a major upgrade.

**Decision (developer, 12 Oct 2026):** no major upgrades now. We decide on upgrades in **P20**, once the visual tests exist and can catch anything an upgrade breaks. Majors stay fixed as in CLAUDE.md until then.

## How to read this

- **Ships to the browser?** Is the package in the files the club loads (`dist/counter`, `dist/owner`)? Checked three ways: `npm audit --omit=dev` (production packages only), `npm ls --omit=dev --all`, and a search of both `dist` folders for each package name.
- **Applies to us?** I read each advisory on GitHub and compared it with how we use the package. We are a client-only app: no server rendering, no server of our own, and the club never runs a dev tool.

**Short version:** one package ships (`react-router-dom` 6, with `react-router`). Its two advisories do not hit us today. Everything else is a build or test tool on a developer PC.

## All 15 warnings

| Package | npm severity | Advisory | Comes from | Ships? | Applies to us? | Fix needs |
|---|---|---|---|---|---|---|
| `react-router-dom` | moderate | (via `react-router`) | our dependency | **Yes** | See `react-router` | `react-router-dom` 7 |
| `react-router` | moderate | GHSA-wrjc-x8rr-h8h6: open redirect with a backslash in `<Link>` / `useNavigate` (CVE-2026-53669, a bypass of CVE-2025-68470). GHSA-337j-9hxr-rhxg: constructor injection when hydrating server-rendered errors (CVE-2026-53666) | `react-router-dom` | **Yes** (both bundles) | **Redirect: not today.** Only if text an outsider can control reaches `<Link to>` or `navigate()`. Our code has no such call yet; see the rule below. **Hydration: no.** The advisory says Declarative Mode is not affected; we use `BrowserRouter` and have no server rendering. | 7.18.0 or later |
| `vitest` | critical | GHSA-5xrq-8626-4rwp: file read when the Vitest UI server runs, on Windows. GHSA-82fw-gwwq-j7x9 (below) | our dev dependency (`apps/web`, `packages/shared`) | No | **No.** We do not run Vitest UI or browser mode, and we do not set `api.host`. | 3.2.6 fixes the first; 4.1.11 the second; npm suggests 5.0.3 |
| `@vitest/mocker` | moderate | GHSA-82fw-gwwq-j7x9: file read through a "redirect mock" | `vitest` | No | **No.** Reachable only through the mocker plugin used by third-party dev servers, or Vitest browser mode (which authenticates). We use neither. | 4.1.11 or later |
| `tinypool` | critical | GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr: a prototype-pollution gadget leads to code running in test workers | `vitest` | No | **No.** Both need an attacker who can already pollute `Object.prototype` inside the test process. Tests run only our code and trusted dev packages, and read nothing from the network. | 2.1.2 or later (comes with a newer Vitest) |
| `vite-node` | moderate | (via `vite`) | `vitest` | No | Same as `vite` below. | Newer Vitest |
| `vite` | high | GHSA-4w7w-66w2-5vf9: `.map` files outside the project can be read. GHSA-fx2h-pf6j-xcff: `server.fs.deny` bypass on Windows. GHSA-v6wh-96g9-6wx3: `launch-editor` leaks the Windows NTLM hash | our dev dependency | No (only the files Vite builds ship) | **Dev server only.** The first two need the dev server open to the network (`--host`); we do not use it. The third can touch **this PC** on Windows while `npm run dev` is running and a hostile website is open. It never touches the club, which runs only the built files. | 6.4.3 (one major) or 8.x (npm's suggestion) |
| `esbuild` | moderate | GHSA-67mh-4wv8-2f99: any website can read esbuild's own dev server | `vite` | No (it compiles the code; its output ships, not esbuild) | **No.** This is about esbuild's built-in `serve` server. Vite has its own dev server and does not start esbuild's. | 0.25.0 or later (comes with Vite 6+) |
| `tailwindcss` | high | (via the five packages below) | our dev dependency | No (only the CSS it writes ships) | **No**, see below. | `tailwindcss` 4 |
| `braces` | high | GHSA-vfj7-8cjw-p6xm: a deeply nested `{a,{b,{c…}}}` pattern can crash a Node process | `chokidar`, `micromatch` | No | **No.** The patterns come from our own Tailwind and file-watch settings, never from outside input. Worst case is a crash of a build on a developer PC. **No fixed `braces` release exists yet**, so even a minor update cannot fix it. | Dropped by Tailwind 4 |
| `chokidar` | high | (via `braces`) | `tailwindcss` | No | No, as `braces`. | Tailwind 4 |
| `micromatch` | high | (via `braces`) | `fast-glob` | No | No, as `braces`. | Tailwind 4 |
| `fast-glob` | high | (via `micromatch`) | `tailwindcss` | No | No, as `braces`. npm lists no fix at all. | Tailwind 4 |
| `postcss-selector-parser` | moderate | GHSA-rj75-hqrm-r3gf: a huge flat CSS selector makes parsing very slow | `postcss-nested`, `tailwindcss` | No | **No.** The advisory itself says only code that parses untrusted selectors is exposed, and "ordinary build-time use on trusted sources is not affected". We feed it our own CSS. | 7.1.6 or later (Tailwind 4) |
| `postcss-nested` | moderate | (via `postcss-selector-parser`) | `tailwindcss` | No | No, as above. | Tailwind 4 |

## Evidence for "Ships?"

- `npm audit --omit=dev` reports **2 moderate**, both in `react-router`, and nothing else.
- `npm ls --omit=dev --all` shows `react-router-dom@6.30.6` and `react-router@6.30.6` as the only flagged packages in the production tree.
- A search of `dist/counter` and `dist/owner` (js, css, html) for `tinypool`, `vitest`, `vite-node`, `esbuild`, `tailwindcss`, `postcss`, `braces`, `micromatch`, `chokidar`, `fast-glob` and `launch-editor` found no matches. `react-router` is in both bundles.

## Rules this gives us until the upgrade

1. **Navigation targets are fixed.** Never pass text typed by a person, or taken from a URL query such as `?for=t2`, straight into `<Link to>`, `<Navigate to>` or `navigate()`. Build the path from a known route and a checked id. This keeps the open-redirect advisory from applying, and is worth keeping after the upgrade.
2. **Stay on the plain `BrowserRouter`.** No server-rendered pages and no hydration data, which is also why the second advisory does not apply.
3. **Dev server hygiene on a Windows PC.** Do not start it with `--host`. Stop `npm run dev` when you are not using it. Do not browse unknown websites while it runs.

## For P20: upgrade candidates

Each one is a major version change, so it needs the developer's approval and an update to the stack list in CLAUDE.md.

| Upgrade | Clears | What to retest |
|---|---|---|
| React Router 6 → 7 | Both shipping advisories | All routes, deep links (`owner-deep-link.preview.spec.ts`), the `routerFuture` flags in `src/lib/router-future.ts` (they exist to prepare for v7) |
| Vitest 2 → 4.1.11 or later (npm: 5.0.3) | Vitest, mocker, tinypool, vite-node | All unit tests in `apps/web` and `packages/shared`; the separate `packages/shared/vitest.config.ts` |
| Vite 5 → 6.4.3 or 8.x | Vite, esbuild | `npm run dev`, both builds, `check:bundles`, the dev plugin in `apps/web/vite/dev-entries.ts` |
| Tailwind 3 → 4 | The whole `braces` / `postcss` chain | The largest change: the config moves into CSS and our shared preset (`design/tailwind.preset.ts`) needs to be carried over. Run every visual test. Do this last, and only if the visual tests are green first. |

Suggested order: React Router first (it is the only one that ships), then Vitest and Vite together, then Tailwind.

## Commands

```bash
npm audit                 # everything, 15 today
npm audit --omit=dev      # only what ships, 2 today
npm ls --omit=dev --all   # the production tree
```
