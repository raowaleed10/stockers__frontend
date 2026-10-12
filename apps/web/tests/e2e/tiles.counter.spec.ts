import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The checks on `/dev/tiles` (prompts/P02): every tile is there, nothing logs an error, axe finds no serious
 * issue in English or Urdu, and every control is big enough. The tiles are compared with the PNGs in
 * `tests/visual/tiles.counter.spec.ts`.
 */

const PATH = '/dev/tiles';
// screens 3, 4, 5, 6 and 16 (9 + 4 + 19 + 9 + 9), then 7 kinds in 7 statuses, in English and in Urdu
const TILES = 9 + 4 + 19 + 9 + 9 + 2 * 7 * 7;

async function openGallery(page: Page, path: string) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  await page.goto(path);
  await page.waitForSelector('[data-section="s03"]');
  await settle(page);
  return problems;
}

test.describe('/dev/tiles', () => {
  test('shows every tile of every kind in every status, in English and Urdu, without errors', async ({
    page,
  }) => {
    const problems = await openGallery(page, PATH);
    await expect(page.getByRole('heading', { level: 1, name: 'Table tiles' })).toBeVisible();
    await expect(page.locator('.tile')).toHaveCount(TILES);
    for (const section of ['s03', 's04', 's05', 's06', 's16', 's54']) {
      await expect(page.locator(`[data-section="${section}"]`)).toBeAttached();
    }
    // all seven kinds, in both languages
    for (const lang of ['en', 'ur']) {
      for (const kind of ['snooker', 'room', 'pool', 'carrom', 'foosball', 'ludo', 'playstation']) {
        await expect(page.locator(`[data-section="matrix-${lang}-${kind}"] .tile`)).toHaveCount(7);
      }
    }
    // Urdu reads right to left; English left to right
    await expect(page.locator('[data-lang="ur"]').first()).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('[data-lang="en"]').first()).toHaveAttribute('dir', 'ltr');
    expect(problems).toEqual([]);
  });

  for (const query of ['', '?lang=ur']) {
    test(`has no serious or critical accessibility issues${query ? ' (page in Urdu)' : ''}`, async ({
      page,
    }) => {
      // Axe reads all 148 tiles: about 19 s alone, three times that when several run at once.
      test.slow();
      await openGallery(page, PATH + query);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      const summary = serious.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        where: violation.nodes.slice(0, 4).map((node) => node.target.join(' ')),
      }));
      expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
    });
  }

  test('every control is at least 56 px, and Resume keeps its drawn size without moving anything', async ({
    page,
  }) => {
    await openGallery(page, PATH);
    const controls = await page.$$eval('main button', (buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        const shape = button.querySelector('[data-visible]') as HTMLElement | null;
        const style = getComputedStyle(button);
        return {
          what: (button.getAttribute('aria-label') ?? button.textContent ?? '').trim().slice(0, 40),
          height: box.height,
          drawn: button.getAttribute('data-drawn'),
          shapeHeight: shape?.getBoundingClientRect().height,
          layoutHeight: box.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
        };
      }),
    );
    expect(controls.length).toBeGreaterThan(100);
    expect(
      controls.filter((control) => control.height > 0 && control.height < 56),
      'controls under 56 px',
    ).toEqual([]);
    const resumes = controls.filter((control) => control.what === 'Resume');
    expect(resumes).toHaveLength(6);
    for (const resume of resumes) {
      expect(resume.drawn).toBe('50');
      expect(resume.height).toBeGreaterThanOrEqual(56);
      expect(resume.shapeHeight).toBeCloseTo(50, 0);
      expect(resume.layoutHeight).toBeCloseTo(50, 0);
    }
  });

  test('has no sideways scrolling at the counter size', async ({ page }) => {
    await openGallery(page, PATH);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('a tile that holds Resume is a group, and a locked tile is disabled with its reason', async ({
    page,
  }) => {
    await openGallery(page, PATH);
    const paused = page
      .locator('[data-section="s16"]')
      .getByRole('group', { name: 'Table 1, paused' });
    await expect(paused).toBeVisible();
    await expect(paused.getByRole('button', { name: 'Resume' })).toBeVisible();
    const locked = page.locator('[data-section="s04"]').getByRole('button', {
      name: 'Pool table 1, price not set',
    });
    await expect(locked).toBeDisabled();
    await expect(locked).toHaveAccessibleDescription('Locked until an owner sets the price');
  });

  test('every word on every tile has the text shadow of the design', async ({ page }) => {
    // The approved look relies on this shadow for the text on the cloth (the contrast numbers ignore it):
    // `.ct` in design/tiles.reference.css is 0 1px 2px rgba(0,0,0,.55). The carrom board swaps it for a light
    // halo behind its dark text and the foosball pitch has a stronger one (`.ff .ct`). The status pill and the
    // Resume button have none, as in the design.
    await openGallery(page, PATH);
    const tiles = await page.$$eval('.tile', (elements) =>
      elements.map((tile) => {
        const shadow = getComputedStyle(tile.querySelector('.tile-ct') as HTMLElement).textShadow;
        const holdsWords = (element: Element) =>
          [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim());
        const without = [...tile.querySelectorAll('*')]
          .filter((element) => holdsWords(element) && !element.closest('.tile-pill, .tile-btn'))
          .filter((element) => getComputedStyle(element).textShadow !== shadow)
          .map((element) => element.textContent?.trim().slice(0, 30));
        const exempt = [...tile.querySelectorAll('.tile-pill, .tile-btn')].map(
          (element) => getComputedStyle(element).textShadow,
        );
        return { kind: tile.getAttribute('data-kind'), shadow, without, exempt };
      }),
    );
    expect(tiles).toHaveLength(TILES);
    for (const tile of tiles) {
      expect(tile.without, `${tile.kind}: words without the tile shadow`).toEqual([]);
      for (const none of tile.exempt) expect(none).toBe('none');
      if (tile.kind === 'carrom') {
        expect(tile.shadow).toBe('rgb(243, 226, 188) 0px 0px 3px, rgb(243, 226, 188) 0px 0px 6px');
      } else if (tile.kind === 'foosball') {
        expect(tile.shadow).toBe('rgba(0, 0, 0, 0.7) 0px 1px 2px, rgba(0, 0, 0, 0.45) 0px 0px 6px');
      } else {
        expect(tile.shadow).toBe('rgba(0, 0, 0, 0.55) 0px 1px 2px');
      }
    }
  });

  test('the keyboard focus ring shows on a tile', async ({ page }) => {
    await openGallery(page, PATH);
    const tile = page.locator('[data-section="s03"] .tile').first();
    await tile.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(tile).toBeFocused();
    const outline = await tile.evaluate((element) => {
      const style = getComputedStyle(element);
      return { width: style.outlineWidth, style: style.outlineStyle, offset: style.outlineOffset };
    });
    expect(outline).toEqual({ width: '3px', style: 'solid', offset: '6px' });
  });
});
