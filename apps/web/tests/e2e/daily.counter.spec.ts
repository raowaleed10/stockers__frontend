import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * Canteen, drawer expense, players, today's totals and closing the sheet (P10, screens 28 to 33): a sale on Usman's bill, a
 * cash sale, an expense of Rs 500 that lowers the expected cash on today's totals and on the close screen, closing with
 * Rs 21,550 counted (a note is required, sheet 49 opens, the Century moves), and the checks every counter screen gets (axe,
 * 56 px, nothing sideways, in English and in Urdu).
 */

const enc = (iso: string) => encodeURIComponent(iso);
const NIGHT = `now=${enc('2026-10-03T21:55:00+05:00')}`;
const CLOSING = `scenario=closing&now=${enc('2026-10-04T03:40:00+05:00')}`;
const CLOSED = `scenario=closed&now=${enc('2026-10-04T03:40:00+05:00')}`;

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

test.describe('the canteen', () => {
  test('Usman’s order of 2 cold drinks and chips is added to his bill, and the stock goes down', async ({
    page,
  }) => {
    const problems = await open(page, `/?${NIGHT}`);
    await page.getByRole('button', { name: 'Canteen' }).click();
    await expect(page).toHaveURL(/\/canteen$/);
    await expect(page.getByRole('heading', { name: 'Canteen' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);

    const order = page.getByRole('complementary', { name: 'Order' });
    await order.getByRole('searchbox').fill('usman');
    await order.getByRole('button', { name: /^Usman Tariq/ }).click();
    await expect(order).toContainText('•••• 7731, playing on Table 4');
    await page.getByRole('button', { name: /^Cold drink,/ }).click();
    await page.getByRole('button', { name: /^Cold drink,/ }).click();
    await page.getByRole('button', { name: /^Chips,/ }).click();
    await expect(order).toContainText('Rs 300');
    await order.getByRole('button', { name: 'Add Rs 300 to Usman’s bill' }).click();
    await expect(page.getByText('Rs 300 added to Usman Tariq’s bill.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Cold drink, Rs 120, 22 left/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Chips, Rs 60, 2 left, low/ })).toBeVisible();

    // His bill is on the checkout list.
    await page.getByRole('button', { name: 'Tables' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByRole('button', { name: /^Usman Tariq/ })).toContainText('Rs 300');
    expect(problems).toEqual([]);
  });

  test('a cash sale with no name takes the money now', async ({ page }) => {
    await open(page, `/canteen?${NIGHT}`);
    await page.getByRole('button', { name: /^Tea,/ }).click();
    await page.getByRole('button', { name: /^Tea,/ }).click();
    const order = page.getByRole('complementary', { name: 'Order' });
    await order.getByRole('radio', { name: 'Cash sale, no name' }).click();
    await expect(order.getByRole('button', { name: 'Take Rs 100 now (Cash)' })).toBeVisible();
    await order.getByRole('button', { name: 'Take Rs 100 now (Cash)' }).click();
    await expect(page.getByText('Rs 100 taken for the canteen, Cash.')).toBeVisible();
    await expect(order).toContainText('Tap an item to add it to the order.');
  });
});

test.describe('the drawer expense and the day', () => {
  test('an expense of Rs 500 lowers the cash that should be in the drawer, on today’s totals and on the close screen', async ({
    page,
  }) => {
    const problems = await open(page, `/?${CLOSING}`);
    await page.getByRole('button', { name: 'Expense' }).click();
    const dialog = page.getByRole('dialog', { name: 'Expense from the drawer' });
    await expect(dialog).toContainText('Added by Shabir');
    await dialog.getByRole('button', { name: 'Food' }).click();
    await dialog.getByLabel('Note (required)').fill('Dinner for staff');
    await dialog.getByRole('button', { name: '500' }).click();
    await expect(dialog).toContainText('Rs 21,750');
    await expect(dialog).toContainText('Rs 21,250');
    await dialog.getByRole('button', { name: 'Take Rs 500 from the drawer' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Rs 500 taken from the drawer: Dinner for staff.')).toBeVisible();

    await page.getByRole('button', { name: 'Today’s totals' }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText('Rs 21,250', { exact: true })).toBeVisible();
    await expect(page.getByText(/minus Rs 1,000 taken for expenses/)).toBeVisible();
    await page.getByRole('button', { name: 'Tables' }).click();

    await page.getByRole('button', { name: 'Close sheet' }).click();
    await expect(page).toHaveURL(/\/close-sheet$/);
    const cash = page.getByRole('region', { name: 'Cash check' });
    await expect(cash).toContainText('Cash expected (after Rs 1,000 expenses)');
    await expect(cash).toContainText('Rs 21,250');
    expect(problems).toEqual([]);
  });

  test('closing with Rs 21,550 counted needs a note, opens sheet 49 and moves the Century', async ({
    page,
  }) => {
    const problems = await open(page, `/close-sheet?${CLOSING}`);
    await expect(page.getByRole('heading', { name: 'Close sheet 48' })).toBeVisible();
    const close = page.getByRole('button', { name: /^Close sheet 48/ });
    await expect(close).toBeDisabled();
    await page.getByLabel('Cash counted').fill('21550');
    await expect(page.getByRole('region', { name: 'Cash check' })).toContainText('ShortRs 200');
    await expect(close).toBeDisabled(); // a note is required when the cash is not exact
    await page
      .getByLabel(/^Note about the difference/)
      .fill('Gave Rs 200 change from the drawer for a bank payment');
    await expect(close).toBeEnabled();
    await close.click();

    const sure = page.getByRole('dialog', { name: 'Close sheet 48 with Rs 21,550 counted?' });
    await expect(sure).toContainText('The cash is Rs 200 short.');
    await sure.getByRole('button', { name: 'Yes, close it' }).click();

    await expect(page).toHaveURL(/\/sheet-closed$/);
    await expect(page.getByRole('heading', { name: 'Sheet 48 is closed' })).toBeVisible();
    await expect(
      page.getByText('Closed at 3:40 AM, Sun 4 Oct. Sheet 49 is open now.'),
    ).toBeVisible();
    await expect(page.getByText('Table 2, Century')).toBeVisible();
    await expect(page.getByText('Still running under Ahmed Nawaz')).toBeVisible();
    await expect(page.getByText('2 players, Rs 700')).toBeVisible();
    await expect(page.getByText('Rs 200 short')).toBeVisible();
    await expect(page.getByText('Your note was saved for the owners')).toBeVisible();

    await page.getByRole('button', { name: 'Back to tables' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('Sheet 49', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Table 2, playing/ })).toContainText('Century');
    expect(problems).toEqual([]);
  });
});

test.describe('the players', () => {
  test('Kamran’s statement, the filters and the way to his bill', async ({ page }) => {
    const problems = await open(page, `/players/kamran?now=${enc('2026-10-03T22:25:00+05:00')}`);
    const panel = page.getByRole('region', { name: 'Statement', exact: true });
    await expect(panel.getByRole('heading', { name: 'Kamran Iqbal' })).toBeVisible();
    await expect(panel).toContainText('Owes the club');
    await expect(panel).toContainText('Rs 1,350');
    await expect(panel).toContainText('15 Sep, 9:10 PM');
    await expect(panel).toContainText('Left without checkout, moved to credit');

    await page.getByRole('button', { name: /^Owe money/ }).click();
    const list = page.getByRole('list', { name: 'Player list' });
    await expect(list.getByRole('button').first()).toContainText('Kamran Iqbal');
    await expect(list.getByRole('button', { name: /^Ali Haider/ })).toContainText(
      '•••• 5520, oldest unpaid 25 days',
    );
    await panel.getByRole('radio', { name: 'This month' }).click();
    await expect(panel).not.toContainText('15 Sep');
    await panel.getByRole('button', { name: 'Checkout Kamran' }).click();
    await expect(page).toHaveURL(/\/checkout\/kamran$/);
    expect(problems).toEqual([]);
  });
});

const SCREENS = [
  {
    name: 'screen 28, canteen',
    url: `/canteen?${NIGHT}`,
    prepare: async (page: Page) => {
      await page.getByRole('button', { name: /^Chips,/ }).click();
    },
    en: { role: 'heading', name: 'Canteen' },
    ur: { role: 'heading', name: 'کینٹین' },
  },
  {
    name: 'screen 29, expense from the drawer',
    url: `/expense?now=${enc('2026-10-03T20:15:00+05:00')}`,
    prepare: async (page: Page) => {
      await page.getByRole('button', { name: '500', exact: true }).click();
    },
    en: { role: 'dialog', name: 'Expense from the drawer' },
    ur: { role: 'dialog', name: 'دراز سے خرچ' },
  },
  {
    name: 'screen 30, players',
    url: `/players/kamran?now=${enc('2026-10-03T22:25:00+05:00')}`,
    prepare: async () => {},
    en: { role: 'heading', name: 'Players' },
    ur: { role: 'heading', name: 'کھلاڑی' },
  },
  {
    name: 'screen 31, today’s totals',
    url: `/today?now=${enc('2026-10-03T22:30:00+05:00')}`,
    prepare: async () => {},
    en: { role: 'heading', name: 'Today’s totals' },
    ur: { role: 'heading', name: 'آج کے کل' },
  },
  {
    name: 'screen 32, close the sheet',
    url: `/close-sheet?${CLOSING}`,
    prepare: async (page: Page) => {
      await page.getByLabel(/^Cash counted|^گنی ہوئی نقد/).fill('21550');
    },
    en: { role: 'heading', name: 'Close sheet 48' },
    ur: { role: 'heading', name: 'شیٹ 48 بند کریں' },
  },
  {
    name: 'screen 33, sheet closed',
    url: `/sheet-closed?${CLOSED}`,
    prepare: async () => {},
    en: { role: 'heading', name: 'Sheet 48 is closed' },
    ur: { role: 'heading', name: 'شیٹ 48 بند ہو گئی' },
  },
] as const;

for (const lang of ['en', 'ur'] as const) {
  for (const screen of SCREENS) {
    test.describe(`${screen.name}, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
      const url = screen.url + (lang === 'ur' ? '&lang=ur' : '');
      const ready = async (page: Page) => {
        const target = screen[lang];
        await expect(page.getByRole(target.role, { name: target.name })).toBeVisible();
        await screen.prepare(page);
        await settle(page);
      };

      test('has no serious or critical accessibility issues', async ({ page }) => {
        const problems = await open(page, url);
        await ready(page);
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

      test('every control is at least 56 px, and nothing scrolls sideways', async ({ page }) => {
        await open(page, url);
        await ready(page);
        // A drawn control (the − and + of the order, the chips of the players) keeps its own box at 56.
        const controls = await page.$$eval('button, [role="radio"], input, textarea', (nodes) =>
          nodes
            .map((node) => ({
              what: (
                node.getAttribute('aria-label') ??
                node.getAttribute('id') ??
                node.textContent ??
                ''
              )
                .trim()
                .slice(0, 40),
              height: Math.max(
                node.getBoundingClientRect().height,
                node.tagName === 'INPUT'
                  ? (node.parentElement?.getBoundingClientRect().height ?? 0)
                  : 0,
              ),
              visible:
                node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0,
            }))
            .filter((control) => control.visible),
        );
        expect(controls.filter((control) => control.height < 56)).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test('in Urdu the canteen is mirrored: the order panel is on the left, the items fill from the right', async ({
  page,
}) => {
  await open(page, `/canteen?${NIGHT}&lang=ur`);
  const order = (await page.getByRole('complementary', { name: 'آرڈر' }).boundingBox())!;
  const items = (await page.getByRole('region', { name: 'چیزیں' }).boundingBox())!;
  expect(order.x).toBeLessThan(items.x);
});
