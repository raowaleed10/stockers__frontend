import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * Checkout (P09, screens 24 to 27): Bilal's example end to end (Rs 1,350, a discount of Rs 50, cash Rs 600 and Easypaisa Rs 400,
 * Rs 300 to credit), Saad using his advance, Put all on credit, and the checks every counter screen gets (axe, 56 px, nothing
 * sideways, Urdu mirrored).
 */

const NOW = encodeURIComponent('2026-10-03T22:20:00+05:00');
const START = `scenario=checkout&now=${NOW}`;

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

async function typeDigits(page: Page, digits: string[]) {
  // The keypad is the second panel of the page, so the same lines work in Urdu.
  const pad = page.locator('main > section').nth(1);
  for (const digit of digits) await pad.getByRole('button', { name: digit, exact: true }).click();
}

test.describe('paying a bill', () => {
  test('Bilal: Rs 1,350, discount 50, cash 600 + Easypaisa 400, and Rs 300 goes to credit', async ({
    page,
  }) => {
    const problems = await open(page, `/?${START}`);
    // From the board: the action bar's Checkout, then his card.
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('radio', { name: 'Waiting to pay (8)' })).toBeChecked();
    await expect(page.getByText('Waiting tonight Rs 6,880')).toBeVisible();
    await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();

    await expect(page).toHaveURL(/\/checkout\/bilal$/);
    const bill = page.getByRole('region', { name: 'Bill' });
    await expect(bill).toContainText('Unpaid since Monday 21 Sep, 12 days');
    await expect(bill).toContainText('Total to payRs 1,350');

    await page.getByRole('button', { name: 'Give a discount' }).click();
    const discount = page.getByRole('dialog', { name: 'Give Bilal a discount' });
    await expect(discount.getByRole('button', { name: 'Apply discount' })).toBeDisabled();
    await discount.getByRole('button', { name: 'Rs 50' }).click();
    await discount.getByRole('button', { name: 'Rounded the bill' }).click();
    await discount.getByLabel('Note (optional)').fill('Rounded Rs 1,350 down to Rs 1,300');
    await discount.getByRole('button', { name: 'Apply Rs 50 discount' }).click();
    await expect(bill).toContainText('Discount (Rounded the bill)');
    await expect(bill).toContainText('Total to payRs 1,300');

    await page.getByRole('button', { name: /^Paid part/ }).click();
    await expect(page).toHaveURL(/\/checkout\/bilal\/part$/);
    await expect(
      page.getByText('Total Rs 1,300 after a Rs 50 discount (Rounded the bill)'),
    ).toBeVisible();
    await typeDigits(page, ['6', '0', '0']);
    await page.getByRole('button', { name: '+ Easypaisa' }).click();
    await typeDigits(page, ['4', '0', '0']);
    const payments = page.getByRole('region', { name: 'Payments' });
    await expect(payments).toContainText('Paid nowRs 1,000');
    await expect(payments).toContainText('Stays as creditRs 300');
    await page.getByRole('button', { name: /^Save payment/ }).click();
    // Money actions ask once (D63): nothing is saved until Yes.
    const sure = page.getByRole('dialog', {
      name: 'Rs 1,000 paid: Cash 600, Easypaisa 400, Rs 300 to credit?',
    });
    await expect(sure).toBeVisible();
    await sure.getByRole('button', { name: 'Yes' }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(
      page.getByText('Bilal Ahmed paid Rs 1,000. Rs 300 stays as credit.'),
    ).toBeVisible();
    await expect(page.getByText('Payment saved: Bilal Ahmed paid Rs 1,000.')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Waiting to pay (7)' })).toBeChecked();
    await expect(page.getByRole('button', { name: /^Bilal Ahmed/ })).toHaveCount(0);
    await expect(page.getByText('Waiting tonight Rs 5,530')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Saad uses his Rs 200 advance and pays Rs 430 in full, by Easypaisa', async ({ page }) => {
    await open(page, `/checkout/saad?${START}`);
    const bill = page.getByRole('region', { name: 'Bill' });
    await expect(bill).toContainText('Advance held');
    await expect(bill).toContainText('Total to payRs 430');
    await page
      .getByRole('group', { name: 'Paid by' })
      .getByRole('button', { name: 'Easypaisa' })
      .click();
    await expect(page.getByRole('button', { name: /^Paid in full/ })).toContainText(
      'Rs 430 received now',
    );
    await page.getByRole('button', { name: /^Paid in full/ }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByText('Saad Hussain paid Rs 430.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Saad Hussain/ })).toHaveCount(0);
  });

  test('Put all on credit: Rs 1,350 stays as credit and he leaves the waiting list', async ({
    page,
  }) => {
    await open(page, `/checkout/bilal?${START}`);
    await page.getByRole('button', { name: /^Put all on credit/ }).click();
    await expect(
      page.getByRole('dialog', { name: 'Put Rs 1,350 on Bilal Ahmed’s credit?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByText('Bilal Ahmed paid Rs 0. Rs 1,350 stays as credit.')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Waiting to pay (7)' })).toBeChecked();
  });

  test('No saves nothing, and Undo on the toast takes a saved payment back within 2 minutes', async ({
    page,
  }) => {
    await open(page, `/checkout/bilal?${START}`);
    await page.getByRole('button', { name: /^Paid in full/ }).click();
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/checkout\/bilal(\?|$)/);

    await page.getByRole('button', { name: /^Paid in full/ }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    const toast = page.getByRole('status').filter({ hasText: 'Payment saved: Bilal Ahmed' });
    await expect(toast).toContainText(/Undo for (2:00|1:5\d) more/);
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Payment undone for Bilal Ahmed.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bilal Ahmed/ })).toContainText('Rs 1,350');
    await expect(page.getByRole('radio', { name: 'Waiting to pay (8)' })).toBeChecked();
  });

  test('a discount of more than the bill is refused, and Tables goes back to the board', async ({
    page,
  }) => {
    await open(page, `/checkout/bilal/discount?${START}`);
    const discount = page.getByRole('dialog', { name: 'Give Bilal a discount' });
    await discount.getByRole('button', { name: 'Other' }).click();
    await discount.getByLabel('Discount amount').fill('1351');
    await expect(discount.getByRole('alert')).toContainText(
      'A discount cannot be more than the bill, Rs 1,350.',
    );
    await expect(discount.getByRole('button', { name: 'Apply discount' })).toBeDisabled();
    await discount.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/checkout\/bilal$/);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Tables' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /^Table 1,/ })).toBeVisible();
  });
});

const SCREENS = [
  {
    name: 'screen 24, who is paying',
    url: `/checkout?${START}`,
    prepare: async () => {},
    en: { role: 'heading', name: 'Checkout' },
    ur: { role: 'heading', name: 'چیک آؤٹ' },
  },
  {
    name: 'screen 25, a player’s bill',
    url: `/checkout/bilal?${START}`,
    prepare: async () => {},
    en: { role: 'heading', name: 'Bilal Ahmed' },
    ur: { role: 'heading', name: 'Bilal Ahmed' },
  },
  {
    name: 'screen 26, part payment',
    url: `/checkout/bilal/part?${START}`,
    prepare: async (page: Page) => {
      await typeDigits(page, ['6', '0', '0']);
    },
    en: { role: 'heading', name: 'Bilal Ahmed pays part' },
    ur: { role: 'heading', name: /کی کچھ ادائیگی/ },
  },
  {
    name: 'screen 27, a discount',
    url: `/checkout/bilal/discount?${START}`,
    prepare: async () => {},
    en: { role: 'dialog', name: 'Give Bilal a discount' },
    ur: { role: 'dialog', name: /کو رعایت دیں/ },
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
        // The pressable box is what is measured: a drawn control (the ✕ of a payment line, the tabs) keeps its own box at 56.
        const buttons = await page.$$eval('button, [role="radio"], input', (nodes) =>
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
        expect(buttons.filter((control) => control.height < 56)).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test('in Urdu the checkout list is mirrored: the back button is on the right, and the cards fill from the right', async ({
  page,
}) => {
  await open(page, `/checkout?${START}&lang=ur`);
  const back = (await page.getByRole('button', { name: 'ٹیبل' }).boundingBox())!;
  expect(back.x).toBeGreaterThan(720);
  const bilal = (await page.getByRole('button', { name: /^Bilal Ahmed/ }).boundingBox())!;
  const ali = (await page.getByRole('button', { name: /^Ali Hassan/ }).boundingBox())!;
  expect(bilal.x).toBeGreaterThan(ali.x);
});
