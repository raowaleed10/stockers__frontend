import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { settle } from '../e2e/settle';
import { BUDGET, comparePngs, saveComparison, type Rect } from './compare';

/**
 * The frame of screen 3 (P04): the top bar and the action bar, cut out of the approved PNG and compared with
 * ours. The board between them is P05's, so the full screen cannot be compared yet; this proves the two bars,
 * and that the action bar sits at the bottom of a 952 px screen as the design draws it.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const PNG = path.join(REPO, 'design/screens/03-live-board.png');
const NOW = encodeURIComponent('2026-10-03T21:42:00+05:00');

const BARS: { name: string; crop: Rect }[] = [
  { name: 'top-bar', crop: { x: 0, y: 0, width: 1440, height: 84 } },
  { name: 'action-bar', crop: { x: 0, y: 855, width: 1440, height: 97 } },
];

test.describe('screen 3: the top bar and the action bar against the PNG', () => {
  let scratch: Page;
  test.beforeAll(async ({ browser }) => {
    scratch = await browser.newPage();
  });
  test.afterAll(async () => {
    await scratch.close();
  });

  for (const bar of BARS) {
    test(bar.name, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 952 });
      await page.goto(`/?now=${NOW}`);
      await page.waitForSelector('[data-app="counter"] header');
      // The bell badge and the sheet come from the board: wait until they are there.
      await page.getByText('Sheet 48').waitFor();
      await page.getByRole('button', { name: 'Notifications, 3 new' }).waitFor();
      await settle(page);

      const shot = await page.screenshot({ fullPage: true });
      const result = await comparePngs(scratch, shot, readFileSync(PNG), { crop: bar.crop });
      saveComparison('frame', bar.name, result);

      expect(result.ours, 'size of the page').toEqual(result.design);
      expect(
        result.ratio,
        `${(result.ratio * 100).toFixed(1)} % of the pixels differ (see test-results/frame)`,
      ).toBeLessThanOrEqual(BUDGET);
    });
  }
});
