import { expect, test } from '@playwright/test';

// The built owner bundle behind a fake secret address, served by scripts/preview-owner.mjs.
// The backend copies that behaviour: docs/08_AUTH_AND_ACCESS.md, section 1.
// The address below is fake. It exists only here, in that script and in playwright.config.ts,
// and must never appear in a bundle.
const PREFIX = '/owner-preview-x7/';
const DEEP_LINK = `${PREFIX}sheets/2026-10`;

type AssetResponse = { path: string; status: number; type: string };

test('a deep link loads the page and all of its files, also after a hard reload', async ({
  page,
}) => {
  const assets: AssetResponse[] = [];
  const requested: string[] = [];
  const failed: string[] = [];
  const crashes: string[] = [];
  page.on('request', (request) => requested.push(new URL(request.url()).pathname));
  page.on('requestfailed', (request) => failed.push(request.url()));
  page.on('pageerror', (error) => crashes.push(error.message));
  page.on('response', (response) => {
    const { pathname } = new URL(response.url());
    if (pathname.startsWith(`${PREFIX}assets/`)) {
      assets.push({
        path: pathname,
        status: response.status(),
        type: response.headers()['content-type'] ?? '',
      });
    }
  });

  // Same as Ctrl+Shift+R: nothing comes from the browser cache.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  for (const step of ['open', 'hard reload'] as const) {
    await test.step(step, async () => {
      assets.length = 0;
      const response = step === 'open' ? await page.goto(DEEP_LINK) : await page.reload();
      expect(response?.status()).toBe(200);

      // The built bundle has no API behind it here, so the guard sends the deep link to the sign-in page (P11). That the
      // app came up under the prefix, with its files, is what this test is about; P13 can open a real sheet.
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

      const look = await page.evaluate(async () => {
        await document.fonts.ready;
        return {
          baseURI: document.baseURI,
          baseHref: document.querySelector('base')?.getAttribute('href'),
          appBase: document.querySelector('meta[name="app-base"]')?.getAttribute('content'),
          background: getComputedStyle(document.body).backgroundColor,
          barlowLoaded: [...document.fonts].some(
            (face) => face.family.replace(/"/g, '') === 'Barlow' && face.status === 'loaded',
          ),
        };
      });
      expect(look.baseHref).toBe(PREFIX);
      expect(look.appBase).toBe(PREFIX);
      expect(new URL(look.baseURI).pathname).toBe(PREFIX);
      expect(look.background).toBe('rgb(238, 242, 239)'); // --o-page #EEF2EF: the CSS arrived
      expect(look.barlowLoaded).toBe(true); // the fonts inside the CSS arrived too

      // The script, the stylesheet and the fonts all came from /assets/ under the prefix.
      expect(assets.filter((a) => a.path.endsWith('.js')).length).toBeGreaterThan(0);
      expect(assets.filter((a) => a.path.endsWith('.css')).length).toBeGreaterThan(0);
      expect(assets.filter((a) => a.path.endsWith('.woff2')).length).toBeGreaterThan(0);
      for (const asset of assets) {
        expect(asset.status, asset.path).toBe(200);
        expect(asset.type, asset.path).not.toContain('text/html');
      }
      expect(requested.filter((path) => path.includes('/sheets/assets/'))).toEqual([]);
      expect(failed).toEqual([]);
      expect(crashes).toEqual([]);
    });
  }
});

test('the app takes its router base from the injected tag, not from the code', async ({ page }) => {
  // On a deep link "Page not found" is also what a wrong base would show, so check the home page: with no session it goes
  // to the sign-in page at the same base path.
  await page.goto(PREFIX);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(`${PREFIX}sign-in`);
});

test('the page has base and app-base injected before any script or stylesheet', async ({
  request,
}) => {
  const response = await request.get(DEEP_LINK);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  expect(response.headers()['cache-control']).toBe('no-cache');

  const html = await response.text();
  const base = html.indexOf(`<base href="${PREFIX}"`);
  const meta = html.indexOf(`<meta name="app-base" content="${PREFIX}"`);
  const firstFile = Math.min(html.indexOf('<script'), html.indexOf('<link'));
  expect(base).toBeGreaterThan(-1);
  expect(meta).toBeGreaterThan(-1);
  expect(Math.max(base, meta)).toBeLessThan(firstFile);
});

test('other addresses under the prefix that are not asset files get the app page', async ({
  request,
}) => {
  for (const path of [PREFIX, `${PREFIX}owner.html`, `${PREFIX}assets`, `${PREFIX}a/b/c.js`]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain(`<meta name="app-base" content="${PREFIX}"`);
  }
});

test('the prefix without its closing slash redirects and keeps the query', async ({ request }) => {
  const response = await request.get('/owner-preview-x7?x=1', { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  expect(response.headers()['location']).toBe(`${PREFIX}?x=1`);
});

test('every address outside the prefix shows "Page not found" and says nothing about owners', async ({
  request,
}) => {
  for (const path of ['/', '/elsewhere', '/owner-preview-x7x', '/owner-preview-x7x/sheets']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    const text = await response.text();
    expect(text, path).toContain('Page not found');
    expect(text.toLowerCase(), path).not.toContain('owner');
  }
});

test('a missing file under /assets/ is a 404, never the app page', async ({ request }) => {
  const response = await request.get(`${PREFIX}assets/nope.js`);
  expect(response.status()).toBe(404);
  expect(await response.text()).not.toContain('app-base');
});

test('nothing outside /assets/ can be read through /assets/', async ({ request }) => {
  for (const path of [
    `${PREFIX}assets/..%2f..%2f..%2f..%2f..%2fpackage.json`,
    `${PREFIX}assets/..%2fowner.html`,
    `${PREFIX}assets/%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2fpackage.json`,
    `${PREFIX}assets/%zz`,
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    const text = await response.text();
    expect(text, path).not.toContain('workspaces');
    expect(text, path).not.toContain('app-base');
  }
});
