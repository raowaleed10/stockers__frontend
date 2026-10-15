import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The bell's alerts panel (the owners' answer of 15 Oct 2026; docs/NO_DESIGN.md): it opens on the end side over the
 * board, lists the counter's alerts, "Mark all read" empties the bell, and closing goes back to the board.
 */

const NIGHT = encodeURIComponent('2026-10-03T21:42:00+05:00');

async function open(page: Page, url: string) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(url);
  await page.waitForSelector('[data-app="counter"]', { timeout: 30_000 });
  await settle(page);
  return problems;
}

test.describe('the alerts panel', () => {
  test('the bell opens it over the board, and closing goes back to /', async ({ page }) => {
    const problems = await open(page, `/?now=${NIGHT}`);
    await page.getByRole('button', { name: 'Notifications, 3 new' }).click();
    const panel = page.getByRole('dialog', { name: 'Alerts' });
    await expect(panel).toBeVisible();
    await expect(page).toHaveURL(/\/alerts$/);
    await expect(panel.getByRole('listitem')).toHaveCount(3);
    await expect(panel.getByText('Chips running low')).toBeVisible();
    await expect(panel.getByText('Table 7 marked out of order by Adil')).toBeVisible();
    // The finished board is still on the page behind it, with the bars around it.
    await expect(page.locator('[aria-label="Table 1, playing"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
    await panel.getByRole('button', { name: 'Close panel' }).click();
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    expect(problems).toEqual([]);
  });

  test('Escape closes it', async ({ page }) => {
    await open(page, `/alerts?now=${NIGHT}`);
    await expect(page.getByRole('dialog', { name: 'Alerts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Alerts' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test('Mark all read takes the number off the bell and the dots off the rows', async ({
    page,
  }) => {
    await open(page, `/alerts?now=${NIGHT}`);
    const panel = page.getByRole('dialog', { name: 'Alerts' });
    await expect(panel.getByText('Unread')).toHaveCount(3);
    await panel.getByRole('button', { name: 'Mark all read' }).click();
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications, 3 new' })).toHaveCount(0);
    await expect(panel.getByText('Unread')).toHaveCount(0);
    await expect(panel.getByRole('listitem')).toHaveCount(3);
    await expect(panel.getByRole('button', { name: 'Mark all read' })).toBeDisabled();
  });

  test('has "Alerts" and "Mark all read" in the header, and the time at the end of each row', async ({
    page,
  }) => {
    await open(page, `/alerts?now=${NIGHT}`);
    const panel = page.getByRole('dialog', { name: 'Alerts' });
    const header = panel.locator('header');
    await expect(header.getByRole('heading', { name: 'Alerts' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Mark all read' })).toBeVisible();
    const row = panel.getByRole('listitem').first();
    const rowBox = (await row.boundingBox())!;
    const timeBox = (await row.getByText('9:12 PM').boundingBox())!;
    // The time sits in the end half of the row (the right, in English).
    expect(timeBox.x).toBeGreaterThan(rowBox.x + rowBox.width / 2);
  });

  test('is on the right in English and on the left in Urdu, 560 px wide', async ({ page }) => {
    await open(page, `/alerts?now=${NIGHT}`);
    const english = (await page.getByRole('dialog', { name: 'Alerts' }).boundingBox())!;
    expect(english.x + english.width).toBeCloseTo(1440, 0);
    expect(english.width).toBeCloseTo(560, 0);

    await open(page, `/alerts?lang=ur&now=${NIGHT}`);
    const urdu = (await page.getByRole('dialog', { name: 'اطلاعات' }).boundingBox())!;
    expect(urdu.x).toBeCloseTo(0, 0);
    expect(urdu.width).toBeCloseTo(560, 0);
  });

  test('needs a worker session like every other counter screen', async ({ page }) => {
    await open(page, `/alerts?as=none&now=${NIGHT}`);
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

for (const lang of ['en', 'ur']) {
  const query = lang === 'ur' ? '&lang=ur' : '';
  const name = lang === 'ur' ? 'اطلاعات' : 'Alerts';

  test.describe(`the alerts panel, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
    test('has no serious or critical accessibility issues', async ({ page }) => {
      const problems = await open(page, `/alerts?now=${NIGHT}${query}`);
      await expect(page.getByRole('dialog', { name })).toBeVisible();
      await expect(page.getByRole('listitem')).toHaveCount(3);
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
      expect(problems).toEqual([]);
    });

    test('every control is at least 56 px and nothing scrolls sideways', async ({ page }) => {
      await open(page, `/alerts?now=${NIGHT}${query}`);
      await expect(page.getByRole('listitem')).toHaveCount(3);
      const controls = await page.$$eval('button', (buttons) =>
        buttons
          .map((button) => ({
            what: (button.getAttribute('aria-label') ?? button.textContent ?? '')
              .trim()
              .slice(0, 40),
            height: button.getBoundingClientRect().height,
          }))
          .filter((control) => control.height > 0),
      );
      expect(controls.filter((control) => control.height < 56)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
