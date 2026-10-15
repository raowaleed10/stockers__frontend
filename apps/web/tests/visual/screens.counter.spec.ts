import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';
import { BUDGET, comparePngs, saveComparison, type Rect } from './compare';

/**
 * The full-screen visual tests (docs/10 §3). One test for each counter screen that is built: open its route with
 * the moment of the design (`now` in design/screens.json), put the page in the state the PNG shows, take a
 * screenshot at the design size and compare it with the approved PNG. Each steps adds its screens here.
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

/**
 * What a screen needs before its picture is taken, and what to leave out of the comparison.
 * - Screen 1 is drawn with Zain picked and two digits typed.
 * - Screen 34's PNG shows 11:06 PM, a moment when Zain's time is already over (it ends at 11:00 PM), so the
 *   design's clock is a slip. Our big clock follows the app's clock (9:42 PM); that block is left out.
 */
const BUILT: Record<
  number,
  {
    prepare?: (page: Page) => Promise<void>;
    masks?: (page: Page) => Promise<Rect[]>;
  }
> = {
  1: {
    prepare: async (page) => {
      await page.getByRole('button', { name: /Zain/ }).click();
      await page.getByRole('button', { name: '1', exact: true }).click();
      await page.getByRole('button', { name: '1', exact: true }).click();
      // The pad keeps focus on the key that was tapped; the PNG has no focus ring.
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    },
  },
  2: {},
  34: {
    masks: async (page) => {
      const box = await page.getByTestId('big-clock').boundingBox();
      return box ? [box] : [];
    },
  },
};

/** The route of the design with the demo clock added. Some routes show more than the path ("/  (= /board/snooker)"). */
function urlOf(screen: ScreenEntry): string {
  const route = screen.route.split(/\s/)[0];
  const query = [`now=${encodeURIComponent(screen.now)}`];
  if (screen.scenario) query.push(`scenario=${screen.scenario}`);
  return route + (route.includes('?') ? '&' : '?') + query.join('&');
}

const screens = ALL.filter((screen) => screen.app === 'counter' && BUILT[screen.n]);

test.describe('counter screens against their PNGs', () => {
  let scratch: Page;
  test.beforeAll(async ({ browser }) => {
    scratch = await browser.newPage();
  });
  test.afterAll(async () => {
    await scratch.close();
  });

  for (const screen of screens) {
    test(`screen ${screen.n}: ${screen.name}`, async ({ page }) => {
      const [width, height] = screen.size.split('×').map(Number);
      await page.setViewportSize({ width, height });
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
          problems.push(message.text());
        }
      });

      await page.goto(urlOf(screen));
      await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
      await settle(page);
      await BUILT[screen.n].prepare?.(page);
      await settle(page);

      const masks = (await BUILT[screen.n].masks?.(page)) ?? [];
      const png = readFileSync(path.join(REPO, 'design/screens', `${screen.file}.png`));
      const shot = await page.screenshot({ fullPage: true });
      const result = await comparePngs(scratch, shot, png, { masks });
      saveComparison('screens', `${String(screen.n).padStart(2, '0')}-${screen.file}`, result);

      expect(problems, 'the page logged errors').toEqual([]);
      // The page must be the size the design draws; a different size means the layout moved.
      expect(result.ours, 'size of the page').toEqual(result.design);
      expect(
        result.ratio,
        `${(result.ratio * 100).toFixed(1)} % of the pixels differ (see test-results/screens)`,
      ).toBeLessThanOrEqual(BUDGET);
    });
  }
});
