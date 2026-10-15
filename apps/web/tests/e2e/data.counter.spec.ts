import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * The checks on `/dev/data` (prompts/P03): the board and the workers come from the mock API, starting
 * a game changes the board, and the sign-in times work (Shabir is refused at 9:42 PM, Zain is not).
 */

async function open(page: Page, query = '') {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    // A refused call (401, 403) is logged by the browser as a failed request; that is not a bug.
    if (message.type() === 'error' && !/status of (40\d|429)/.test(message.text())) {
      problems.push(message.text());
    }
  });
  await page.goto(`/dev/data${query}`);
  // The page starts the mock server before it draws; wait for it, then for the layout to be quiet.
  await page.waitForSelector('main', { timeout: 30_000 });
  await settle(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Data check' })).toBeVisible();
  return problems;
}

const row = (page: Page, tableId: string) => page.locator(`[data-table="${tableId}"]`);

test.describe('/dev/data (counter)', () => {
  test('lists the whole board and the workers from the mock API, with no errors', async ({
    page,
  }) => {
    const problems = await open(page);
    await expect(page.locator('[data-testid="board"] tbody tr')).toHaveCount(28);
    await expect(row(page, 't1')).toContainText('Playing');
    await expect(row(page, 't1')).toContainText('Ali Raza vs Bilal Ahmed');
    await expect(row(page, 't4')).toContainText('Over 30 min');
    await expect(row(page, 't6')).toContainText('Paused');
    await expect(row(page, 't7')).toContainText('Out of order');
    await expect(row(page, 'po1')).toContainText('Price not set');
    await expect(page.getByText('6 of 28 tables in use')).toBeVisible();

    const workers = page.locator('[data-testid="workers"] li');
    await expect(workers).toHaveCount(2);
    await expect(workers.nth(0)).toContainText('Shabir');
    await expect(workers.nth(0)).toContainText('2:00 AM to 10:00 AM');
    await expect(workers.nth(0)).toContainText('Not now');
    await expect(workers.nth(1)).toContainText('Zain');
    await expect(workers.nth(1)).toContainText('2:00 PM to 11:00 PM');
    await expect(workers.nth(1)).toContainText('Your time now');

    await expect(page.locator('[data-testid="waiting"] li')).toHaveCount(5);
    await expect(page.getByText('Not paid yet today: Rs 1,550')).toBeVisible();
    await expect(page.getByTestId('session')).toContainText('Zain is signed in (ends 11:00 PM)');
    expect(problems).toEqual([]);
  });

  test('starting a game on Table 2 changes the board, with no reload', async ({ page }) => {
    await open(page);
    await expect(row(page, 't2')).toContainText('Free');
    await expect(page.getByText('6 of 28 tables in use')).toBeVisible();

    await row(page, 't2').getByRole('button', { name: 'Start game' }).click();

    await expect(row(page, 't2')).toContainText('Playing');
    await expect(row(page, 't2')).toContainText('Ahmed Nawaz vs Ali Akbar');
    await expect(row(page, 't2')).toContainText('Rs 250');
    await expect(page.getByText('7 of 28 tables in use')).toBeVisible();
    await expect(row(page, 't2').getByRole('button', { name: 'End frame' })).toBeVisible();
  });

  test('ending a frame puts the amount on the loser’s bill', async ({ page }) => {
    await open(page);
    await expect(
      page.locator('[data-testid="waiting"] li', { hasText: 'Bilal Ahmed' }),
    ).toContainText('Rs 600');
    await row(page, 't1').getByRole('button', { name: 'End frame' }).click();
    await expect(row(page, 't1')).toContainText('Free');
    await expect(
      page.locator('[data-testid="waiting"] li', { hasText: 'Bilal Ahmed' }),
    ).toContainText('Rs 850');
    await expect(page.getByText('Not paid yet today: Rs 1,800')).toBeVisible();
  });

  test('Shabir is refused at 9:42 PM with NOT_YOUR_TIME, and Zain gets in', async ({ page }) => {
    const problems = await open(page, '?as=none');
    await expect(page.getByTestId('session')).toContainText('Nobody is signed in.');

    await page.getByRole('button', { name: 'Sign in as Shabir (1111)' }).click();
    await expect(page.getByTestId('sign-in-error')).toContainText('NOT_YOUR_TIME');
    await expect(page.getByTestId('sign-in-error')).toContainText(
      'Shabir can sign in from 2:00 AM to 10:00 AM. It is 9:4',
    );
    await expect(page.getByTestId('session')).toContainText('Nobody is signed in.');

    await page.getByRole('button', { name: 'Sign in as Zain (2222)' }).click();
    await expect(page.getByTestId('session')).toContainText('Zain is signed in (ends 11:00 PM)');
    await expect(page.getByTestId('sign-in-error')).not.toContainText('NOT_YOUR_TIME');
    // Now the board loads, because there is a worker session.
    await expect(page.locator('[data-testid="board"] tbody tr')).toHaveCount(28);
    expect(problems).toEqual([]);
  });

  test('answers a board call with no worker session as signed out', async ({ page }) => {
    await open(page, '?as=none');
    await expect(page.getByRole('alert').first()).toContainText('UNAUTHENTICATED');
    await expect(page.locator('[data-testid="board"] tbody tr')).toHaveCount(0);
  });

  test('?scenario=paused shows every game paused since the power cut', async ({ page }) => {
    await open(page, '?scenario=paused');
    for (const id of ['t1', 't3', 't4', 't5', 't6', 'r1']) {
      await expect(row(page, id)).toContainText('Paused');
    }
    await expect(page.getByText(/10:0[0-9] PM/).first()).toBeVisible();
  });

  test('?scenario=closing signs Shabir in, with one Century and two bills', async ({ page }) => {
    await open(page, '?scenario=closing');
    await expect(page.getByTestId('session')).toContainText('Shabir is signed in (ends 10:00 AM)');
    await expect(row(page, 't2')).toContainText('Under Ahmed Nawaz');
    await expect(page.locator('[data-testid="waiting"] li')).toHaveCount(2);
    await expect(page.getByText(/3:4[0-9] AM/).first()).toBeVisible();
  });

  test('?scenario=empty has no games and nobody waiting to pay', async ({ page }) => {
    await open(page, '?scenario=empty');
    await expect(page.getByText('0 of 28 tables in use')).toBeVisible();
    await expect(page.getByText('Nobody is waiting to pay.')).toBeVisible();
  });

  test('?now= moves the demo clock: at 10:51 PM Zain is still in, at 11:00 PM he is signed out', async ({
    page,
  }) => {
    await open(page, '?now=2026-10-03T22:51:00%2B05:00');
    await expect(page.getByText(/10:5[0-9] PM/).first()).toBeVisible();
    await expect(page.getByTestId('session')).toContainText('Zain is signed in');

    await open(page, '?now=2026-10-03T23:00:30%2B05:00');
    await expect(page.getByTestId('session')).toContainText('Nobody is signed in.');
    // The first call to find his time over gets SESSION_ENDED; the next one finds nobody signed in.
    await expect(page.getByRole('alert').first()).toContainText(/SESSION_ENDED|UNAUTHENTICATED/);
  });

  test('the page is in Urdu, right to left, with ?lang=ur', async ({ page }) => {
    await page.goto('/dev/data?lang=ur');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ڈیٹا کی جانچ');
    await expect(page.locator('[data-testid="board"] tbody tr')).toHaveCount(28);
  });
});
