import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';
import { BUDGET, comparePngs, saveComparison, type Rect } from './compare';

/**
 * The full-screen visual tests of the owner portal (docs/10 §3). One test for each owner screen that is built: open its
 * route under `/owner-dev` with the moment of the design (`now` in design/screens.json), put the page in the state the PNG
 * shows, take a screenshot at the design size and compare it with the approved PNG. The computer screens run in the
 * `owner` project (1440 wide) and the phone screens in the `phone` project (390 wide). Each step adds its screens here.
 *
 * The side-by-side pictures (ours, the design, the difference in red) are in `test-results/screens`.
 */

interface ScreenEntry {
  n: number;
  name: string;
  app: string;
  route: string;
  file: string;
  size: string;
  now: string;
  scenario?: string;
}

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const ALL: ScreenEntry[] = JSON.parse(
  readFileSync(path.join(REPO, 'design/screens.json'), 'utf8'),
) as ScreenEntry[];

const BASE = '/owner-dev';

/** What a screen needs before its picture is taken, and what to leave out of the comparison. */
const BUILT: Record<
  number,
  {
    prepare?: (page: Page) => Promise<void>;
    masks?: (page: Page) => Promise<Rect[]>;
    scenario?: string;
    now?: string;
  }
> = {
  // The PNG has Aqil picked, "stockers48" typed in the password and the field in focus (its blue 2 px border).
  35: {
    prepare: async (page) => {
      await page.locator('#owner-password').fill('stockers48');
      await page.locator('#owner-password').focus();
    },
    // The note says which address was opened: the PNG's is the real one (stockers.pk/owner-k7m2q9), ours is the dev one.
    masks: async (page) => {
      const box = await page.getByText(/You opened/).boundingBox();
      return box ? [box] : [];
    },
  },
  52: {
    prepare: async (page) => {
      await page.locator('#owner-password').fill('stockers48');
      await page.locator('#owner-password').focus();
    },
  },
};

const screens = ALL.filter((screen) => screen.app.startsWith('owner') && BUILT[screen.n]);

test.describe('owner screens against their PNGs', () => {
  let scratch: Page;
  test.beforeAll(async ({ browser }) => {
    scratch = await browser.newPage();
  });
  test.afterAll(async () => {
    await scratch.close();
  });

  for (const screen of screens) {
    test(`screen ${screen.n}: ${screen.name}`, async ({ page }, testInfo) => {
      const onPhone = screen.app.includes('phone');
      test.skip(
        onPhone !== (testInfo.project.name === 'phone'),
        'this screen is drawn for the other screen size',
      );
      const [width, height] = screen.size.split('×').map(Number);
      await page.setViewportSize({ width, height });
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
          problems.push(message.text());
        }
      });

      const built = BUILT[screen.n];
      const route = screen.route.split(/\s/)[0];
      const query = [`now=${encodeURIComponent(built.now ?? screen.now)}`];
      const scenario = built.scenario ?? screen.scenario;
      if (scenario) query.push(`scenario=${scenario}`);
      await page.goto(`${BASE}${route === '/' ? '/' : route}?${query.join('&')}`);
      await page.waitForSelector('[data-app="owner"]', { timeout: 30_000 });
      await settle(page);
      await built.prepare?.(page);
      await settle(page);

      const masks = (await built.masks?.(page)) ?? [];
      const png = readFileSync(path.join(REPO, 'design/screens', `${screen.file}.png`));
      const shot = await page.screenshot({ fullPage: true });
      const result = await comparePngs(scratch, shot, png, { masks });
      saveComparison('screens', `${String(screen.n).padStart(2, '0')}-${screen.file}`, result);

      expect(problems, 'the page logged errors').toEqual([]);
      expect(result.ours, 'size of the page').toEqual(result.design);
      expect(
        result.ratio,
        `${(result.ratio * 100).toFixed(1)} % of the pixels differ (see test-results/screens)`,
      ).toBeLessThanOrEqual(BUDGET);
    });
  }
});
