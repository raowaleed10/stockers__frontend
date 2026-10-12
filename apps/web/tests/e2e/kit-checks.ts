import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/** Opens the kit page and waits until it is quiet (fonts, animations, layout), so measurements and axe see the real layout. */
async function openKit(page: Page, path: string) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  await page.goto(path);
  await page.waitForSelector('main section');
  await settle(page);
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
        // Axe reads the whole kit page: about 15 s alone, three times that when several run at once.
        test.slow();
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

    test('a counter control drawn under 56 px keeps its drawn size and moves nothing', async ({
      page,
    }) => {
      await openKit(page, path);
      const found = await page.$$eval('[data-kit-theme="counter"] [data-drawn]', (elements) =>
        elements.map((element) => {
          const box = element as HTMLElement;
          const shape = box.querySelector('[data-visible]') as HTMLElement;
          const boxRect = box.getBoundingClientRect();
          const shapeRect = shape.getBoundingClientRect();
          const style = getComputedStyle(box);
          return {
            what: (box.getAttribute('aria-label') ?? box.textContent ?? '').trim().slice(0, 30),
            drawn: Number(box.dataset.drawn),
            // an icon button has an aria-label and is square; the others are as wide as their words
            square: box.hasAttribute('aria-label'),
            boxHeight: boxRect.height,
            boxWidth: boxRect.width,
            shapeHeight: shapeRect.height,
            shapeWidth: shapeRect.width,
            // the space the control takes in the layout: its box plus its margins
            layoutHeight:
              boxRect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
            layoutWidth:
              boxRect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight),
            left: boxRect.left,
            right: boxRect.right,
            top: boxRect.top,
            bottom: boxRect.bottom,
          };
        }),
      );
      // the kit shows each size a screen draws
      expect([...new Set(found.map((item) => item.drawn))].sort()).toEqual([44, 48, 52, 54]);
      const wrong: string[] = [];
      for (const item of found) {
        const near = (a: number, b: number) => Math.abs(a - b) <= 0.5;
        if (item.boxHeight < 56 || (item.square && item.boxWidth < 56))
          wrong.push(`${item.what}: box under 56 px`);
        if (!near(item.shapeHeight, item.drawn))
          wrong.push(`${item.what}: shape is ${item.shapeHeight} px, not ${item.drawn}`);
        if (!near(item.layoutHeight, item.drawn))
          wrong.push(`${item.what}: takes ${item.layoutHeight} px of layout, not ${item.drawn}`);
        if (item.square && !near(item.shapeWidth, item.drawn))
          wrong.push(`${item.what}: shape is ${item.shapeWidth} px wide, not ${item.drawn}`);
        if (item.square && !near(item.layoutWidth, item.drawn))
          wrong.push(`${item.what}: takes ${item.layoutWidth} px of width, not ${item.drawn}`);
      }
      // two pressable boxes never share a spot: the larger boxes must not steal each other's presses
      for (const [index, a] of found.entries()) {
        for (const b of found.slice(index + 1)) {
          const overlap =
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
          if (overlap) wrong.push(`${a.what} and ${b.what} overlap`);
        }
      }
      expect(wrong).toEqual([]);
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
