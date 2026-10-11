import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Opens the kit page and waits for fonts, so measurements and axe see the real layout. */
async function openKit(page: Page, path: string) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  await page.goto(path);
  await page.waitForSelector('main section');
  await page.evaluate(() => document.fonts.ready);
  return problems;
}

/**
 * The checks every app runs on its `/dev/kit` page (prompts/P01: "An axe check of /dev/kit has no
 * serious issues"; docs/10 §5: touch sizes).
 */
export function defineKitTests(path: string, app: 'counter' | 'owner') {
  test.describe(`/dev/kit in the ${app} app`, () => {
    test('shows every component, in both looks and both languages, without errors', async ({
      page,
    }) => {
      const problems = await openKit(page, path);
      await expect(page.getByRole('heading', { level: 1, name: 'UI kit' })).toBeVisible();
      for (const name of [
        'Button',
        'IconButton',
        'StatusPill',
        'Chip',
        'Card',
        'StatCard',
        'CounterDialog',
        'SidePanel',
        'OwnerAside',
        'OptionCard',
        'PersonCard',
        'Keypad and PinDots',
        'MoneyText',
        'TimerText',
        'Toggle',
        'Segmented and LanguageSwitch',
        'Field, MoneyInput, TextArea, Select',
        'DataTable',
        'StatementTable',
        'EmptyState and Toast',
      ]) {
        await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeAttached();
      }
      // English reads left to right, Urdu right to left, side by side.
      await expect(page.locator('[data-kit-lang="en"]').first()).toHaveAttribute('dir', 'ltr');
      await expect(page.locator('[data-kit-lang="ur"]').first()).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('[data-kit-theme="counter"]').first()).toBeAttached();
      await expect(page.locator('[data-kit-theme="owner"]').first()).toBeAttached();
      expect(problems).toEqual([]);
    });

    for (const query of ['', '?lang=ur']) {
      test(`has no serious or critical accessibility issues${query ? ' (page in Urdu)' : ''}`, async ({
        page,
      }) => {
        await openKit(page, path + query);
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

    test('every control is at least 56 px tall on the counter look and 44 px in the owner look', async ({
      page,
    }) => {
      await openKit(page, path);
      const controls =
        ':is(button, [role="switch"], [role="radio"], select, input:not([type="hidden"]), textarea, a[href])';
      for (const [theme, minimum] of [
        ['counter', 56],
        ['owner', 44],
      ] as const) {
        const tooSmall = await page.$$eval(
          `[data-kit-theme="${theme}"] ${controls}`,
          (elements, min) =>
            elements
              .map((element) => ({
                // a text box sits inside a bordered box that sets the touch size
                height: (element.tagName === 'INPUT'
                  ? (element.parentElement ?? element)
                  : element
                ).getBoundingClientRect().height,
                what: (element.getAttribute('aria-label') ?? element.textContent ?? '')
                  .trim()
                  .slice(0, 40),
              }))
              .filter((item) => item.height > 0 && item.height < min),
          minimum,
        );
        expect(tooSmall, `${theme} controls under ${minimum} px`).toEqual([]);
      }
    });

    test('the phone width has no sideways scrolling of the page', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openKit(page, path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
