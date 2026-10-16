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
 * - Screens 4 and 5 draw an older action bar (no Expense, no Pause all, no "Backed up"). The developer chose the
 *   full bar everywhere (P05 plan), so the action bar is left out of those two comparisons.
 * - Screen 6 is Urdu: the names (players, the worker) and the "what for" lines of the waiting list are stored in English
 *   script, and the PNG draws them in Urdu script (P05 answer 2), so that text is left out of the comparison.
 */
const BUILT: Record<
  number,
  {
    prepare?: (page: Page) => Promise<void>;
    masks?: (page: Page) => Promise<Rect[]>;
    /** The seed's scenario that gives the screen its state (a game that is already running, for instance). */
    scenario?: string;
    /** A moment other than the one in design/screens.json: the PNG's clock is whole minutes, its countdowns are not. */
    now?: string;
    /**
     * A dialog covers the whole screen, so what a person sees is the 1440 x 900 window, not the page behind it (the
     * board is taller than the screen and scrolls). The picture is taken of the window.
     */
    window?: boolean;
  }
> = {
  3: {},
  4: { masks: actionBar },
  5: { masks: actionBar },
  6: {
    // The names and the "what for" lines of the waiting list, and the worker's name, are stored in English script, and
    // the PNG draws them in Urdu script (P05 answer 2): that text is left out, so the amounts, the header, the total
    // and the rows are compared.
    masks: async (page) => {
      const boxes = await page.locator('aside li button > span:first-child').evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return { x, y: y + window.scrollY, width, height };
        }),
      );
      // The worker's name in the top bar is stored the same way (Zain, not زین).
      const chip = await page.getByRole('button', { name: /^سائن اِن/ }).boundingBox();
      return chip ? [...boxes, chip] : boxes;
    },
  },
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
  // Screens 7 to 12 are dialogs over the board. The PNG draws the header at 55 % behind them; a real dialog dims the whole
  // page with one layer (docs: Differences), so the comparison covers the dialog and a thin dark band for the page.
  7: {
    window: true,
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await blur(page);
    },
  },
  8: {
    window: true,
    prepare: async (page) => {
      const search = page.getByRole('searchbox', { name: 'Search players by name or phone' });
      await search.fill('ahmed');
      await page.getByRole('button', { name: /^Ahmed Nawaz/ }).click();
      await search.fill('ali');
      await page.getByRole('button', { name: /^Ali Akbar/ }).waitFor();
      await blur(page);
    },
    // "4 found" is a count the PNG got wrong for this seed ("ali" is also in Hamid Ali and Rizwan Ali).
    masks: async (page) => {
      const box = await page.getByRole('status').boundingBox();
      return box ? [box] : [];
    },
  },
  9: {
    window: true,
    prepare: async (page) => {
      const search = page.getByRole('searchbox', { name: /^Search a name or phone for side/ });
      for (const [typed, who] of [
        ['ahmed', /^Ahmed Nawaz/],
        ['ali ak', /^Ali Akbar/],
        ['imran', /^Imran Shah/],
      ] as const) {
        await search.fill(typed);
        await page.getByRole('button', { name: who }).click();
      }
      await blur(page);
    },
  },
  10: {
    window: true,
    prepare: async (page) => {
      await page.getByLabel('Full name').fill('Ali Shahzad');
      for (const digit of '030281') {
        await page.getByRole('button', { name: digit, exact: true }).click();
      }
      await blur(page);
    },
  },
  12: {
    window: true,
    scenario: 'newGame',
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Century/ }).click();
      await blur(page);
    },
  },
  34: {
    masks: async (page) => {
      const box = await page.getByTestId('big-clock').boundingBox();
      return box ? [box] : [];
    },
  },
};

/** What a tap leaves behind: focus on the control. The PNG shows the screen, not a focus ring. */
const blur = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

/** The action bar's box, to leave it out of a comparison. */
async function actionBar(page: Page): Promise<Rect[]> {
  const box = await page.locator('footer').last().boundingBox();
  return box ? [box] : [];
}

/** The route of the design with the demo clock added. Some routes show more than the path ("/  (= /board/snooker)"). */
function urlOf(screen: ScreenEntry): string {
  const route = screen.route.split(/\s/)[0];
  const built = BUILT[screen.n];
  const query = [`now=${encodeURIComponent(built?.now ?? screen.now)}`];
  const scenario = built?.scenario ?? screen.scenario;
  if (scenario) query.push(`scenario=${scenario}`);
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
      const shot = await page.screenshot({ fullPage: !BUILT[screen.n].window });
      const result = await comparePngs(scratch, shot, png, { masks });
      const picture = `${String(screen.n).padStart(2, '0')}-${screen.file}`;
      saveComparison('screens', picture, result);

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
