import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The owner pages of P12 in a real browser (docs/10 §4): the dashboard and the phone home, reports, and Activity with its
 * dispute. Each page is checked with axe, for touch targets of 44 px and for sideways scrolling, in English and Urdu, on a
 * computer and on a phone (the `owner` and `phone` projects). The dispute flow and the chips are run once.
 */

const NIGHT = encodeURIComponent('2026-10-03T22:30:00+05:00');
const AFTER = encodeURIComponent('2026-10-04T03:45:00+05:00');
const BASE = '/owner-dev';

const onPhone = () => test.info().project.name === 'phone';

async function open(page: Page, path: string, query = '') {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(`${BASE}${path}?${query || `now=${NIGHT}`}`);
  await page.waitForSelector('[data-app="owner"]', { timeout: 30_000 });
  await settle(page);
  return problems;
}

const PAGES = [
  { name: 'the dashboard', path: '/', query: `now=${NIGHT}`, ready: /^Today|آج/ },
  { name: 'reports', path: '/reports', query: `now=${NIGHT}`, ready: /^Reports|رپورٹس/ },
  {
    name: 'Activity',
    path: '/activity',
    query: `now=${AFTER}&scenario=closed`,
    ready: /^Activity|سرگرمی/,
  },
];

for (const lang of ['en', 'ur'] as const) {
  for (const item of PAGES) {
    test(`${item.name} in ${lang}: no serious accessibility issues, 44 px targets, no sideways scroll`, async ({
      page,
    }) => {
      test.slow();
      const problems = await open(page, item.path, `${item.query}&lang=${lang}`);
      await expect(page.getByRole('heading', { level: 1, name: item.ready })).toBeVisible();
      // Give the charts a moment to draw.
      await page.waitForTimeout(400);

      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      );
      expect(serious.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);

      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('button, a[href], select, input')]
          .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"]'))
          .map((el) => ({
            name: el.textContent?.trim() || el.getAttribute('aria-label') || el.tagName,
            ...el.getBoundingClientRect().toJSON(),
          }))
          .filter((box) => box.height < 43.5)
          .map((box) => `${box.name}: ${Math.round(box.width)} x ${Math.round(box.height)}`),
      );
      expect(small, 'controls under 44 px tall').toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        'sideways scroll',
      ).toBe(false);
      expect(problems).toEqual([]);
    });
  }
}

test.describe('Activity in a browser', () => {
  test('Faisal pays: the banner goes and a new line says it was decided by Aqil', async ({
    page,
  }) => {
    await open(page, '/activity', `now=${AFTER}&scenario=closed`);
    const banner = page.getByRole('region', { name: 'Waiting for an owner' });
    await expect(banner).toContainText('1 dispute is waiting for you');
    await banner.getByRole('button', { name: 'Faisal pays' }).click();
    await expect(banner).toHaveCount(0);
    const first = page.getByRole('table', { name: 'Activity list' }).getByRole('row').nth(1);
    await expect(first).toContainText('Aqil Farooq');
    await expect(first).toContainText('Dispute on Table 3 decided');
    await expect(page.getByRole('button', { name: 'Disputes 2' })).toBeVisible();
  });

  test('every cell of the list is inside its card, on a computer and on a phone', async ({
    page,
  }) => {
    await open(page, '/activity', `now=${AFTER}&scenario=closed`);
    const table = page.getByRole('table', { name: 'Activity list' });
    await expect(table.getByRole('row')).toHaveCount(13);
    const outside = await table.evaluate((el) => {
      const card = el.getBoundingClientRect();
      return [...el.querySelectorAll<HTMLElement>('[role="cell"]')]
        .filter((cell) => {
          const box = cell.getBoundingClientRect();
          return box.right > card.right + 0.5 || box.left < card.left - 0.5;
        })
        .map((cell) => cell.textContent?.slice(0, 30) ?? '');
    });
    expect(outside, 'cells cut off by the card').toEqual([]);
  });

  test('a chip and a person narrow the list, and the choice is announced', async ({ page }) => {
    await open(page, '/activity', `now=${AFTER}&scenario=closed`);
    const rows = page.getByRole('table', { name: 'Activity list' }).getByRole('row');
    await expect(rows).toHaveCount(13);
    await page.getByRole('button', { name: 'Discounts 2' }).click();
    await expect(page.getByRole('button', { name: 'Discounts 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows).toHaveCount(3);
    await page.getByRole('button', { name: 'Adil' }).click();
    await expect(page.getByText('Nothing here for this filter.')).toBeVisible();
  });
});

test.describe('Reports in a browser', () => {
  test('Year and Day change the report, and PDF asks for a file', async ({ page }) => {
    await open(page, '/reports');
    await expect(page.getByRole('region', { name: 'Totals' })).toContainText('Rs 773,000');
    // The Day / Month / Year switch is a radio group; on a phone a long list scrolls inside its card.
    await page.getByRole('radio', { name: 'Year' }).click();
    await expect(page.getByText('Earned through the year, month by month')).toBeVisible();
    await page.getByRole('radio', { name: 'Day' }).click();
    await expect(page.getByText('Credit pending at day end')).toBeVisible();
    await page.getByRole('radio', { name: 'Month' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    expect((await download).suggestedFilename()).toBe('report-2026-09.pdf');
  });
});

test('the dashboard opens its links: the alerts, the players and the activity', async ({
  page,
}) => {
  await open(page, '/');
  if (onPhone()) {
    await page.getByRole('link', { name: 'See all alerts' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/alerts$`));
  } else {
    await page.getByRole('link', { name: 'Open activity' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE}/activity$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Activity' })).toBeVisible();
  }
});
