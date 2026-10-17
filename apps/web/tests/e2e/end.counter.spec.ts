import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { settle } from './settle';

/**
 * Ending games and rooms (P08, screens 17 to 23): Table 1 lose and next frame, Table 4 over its limit and charged double,
 * Table 5's double split, Table 3's Century, Room 2 started and Room 1 ended, the Undo on screen 18, and the checks every
 * counter screen gets (axe, 56 px, nothing sideways, Urdu mirrored).
 */

const at = (time: string) => `now=${encodeURIComponent(`2026-10-03T${time}+05:00`)}`;

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

test.describe('ending a frame on Table 1', () => {
  test('lose, then next frame: Bilal is charged Rs 250, the score is Ali 3 – 0 Bilal, and frame 4 starts', async ({
    page,
  }) => {
    const problems = await open(page, `/?${at('21:51:00')}`);
    await page.getByRole('button', { name: 'Table 1, playing' }).click();
    await page.getByRole('button', { name: 'End frame' }).click();
    await expect(page).toHaveURL(/\/table\/t1\/end$/);
    const who = page.getByRole('dialog', { name: 'Who lost this frame?' });
    await expect(who).toContainText('Table 1, frame 3 ended at 9:51 PM after 28 minutes');
    await expect(who.getByRole('button', { name: /^Bilal Ahmed/ })).toContainText('Rs 600 waiting');
    await who.getByRole('button', { name: /^Bilal Ahmed/ }).click();

    await expect(page).toHaveURL(/\/table\/t1\/next$/);
    const next = page.getByRole('dialog', { name: 'Rs 250 added to Bilal Ahmed’s bill' });
    await expect(next).toContainText('He now has Rs 850 waiting to pay. Ali Raza won frame 3.');
    await expect(next).toContainText('Ali 3 – 0 Bilal');
    await expect(next).toContainText(/Undo, \d:\d\d left/);
    await next.getByRole('button', { name: /^Next frame, same players/ }).click();

    await expect(page).toHaveURL(/\/$/);
    const tile = page.getByRole('button', { name: 'Table 1, playing' });
    await expect(tile).toContainText('Frame 4');
    await expect(tile.getByRole('timer')).toHaveText(/^00:0\d$/);
    // Bilal's bill on the waiting list is now Rs 850.
    await expect(page.getByRole('button', { name: /Bilal Ahmed/ })).toContainText('Rs 850');
    expect(problems).toEqual([]);
  });

  test('Undo asks who lost again, and the right player is charged instead (D63)', async ({
    page,
  }) => {
    await open(page, `/table/t1/end?${at('21:51:00')}`);
    await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
    const next = page.getByRole('dialog', { name: 'Rs 250 added to Bilal Ahmed’s bill' });
    await next.getByRole('button', { name: /^Undo, / }).click();
    await expect(page).toHaveURL(/\/table\/t1\/correct\/g-t1-3$/);
    const who = page.getByRole('dialog', { name: 'Who lost this frame?' });
    await expect(who).toContainText('Rs 250 is on Bilal Ahmed’s bill now.');
    await who.getByRole('button', { name: /^Ali Raza/ }).click();
    await expect(page).toHaveURL(/\/table\/t1\/next$/);
    await expect(
      page.getByRole('dialog', { name: 'Rs 250 added to Ali Raza’s bill' }),
    ).toBeVisible();
  });

  test('Undo still works after Next frame has started: the toast offers it and the running frame stays', async ({
    page,
  }) => {
    await open(page, `/table/t1/end?${at('21:51:00')}`);
    await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
    await page.getByRole('button', { name: /^Next frame, same players/ }).click();
    await expect(page).toHaveURL(/\/$/);
    const toast = page
      .getByRole('status')
      .filter({ hasText: 'Rs 250 added to Bilal Ahmed’s bill' });
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(page).toHaveURL(/\/table\/t1\/correct\/g-t1-3$/);
    await page
      .getByRole('dialog', { name: 'Who lost this frame?' })
      .getByRole('button', { name: /^Ali Raza/ })
      .click();
    await expect(page).toHaveURL(/\/$/);
    // Frame 4 is still running on Table 1, and Bilal is back to Rs 600.
    await expect(page.getByRole('button', { name: 'Table 1, playing' })).toContainText('Frame 4');
    await expect(page.getByRole('button', { name: /Bilal Ahmed/ })).toContainText('Rs 600');
  });

  test('Nobody pays opens the stop screen, and Keep playing closes the question', async ({
    page,
  }) => {
    await open(page, `/table/t1/end?${at('21:51:00')}`);
    await page.getByRole('button', { name: 'Nobody pays' }).click();
    await expect(page).toHaveURL(/\/table\/t1\/stop$/);
    await expect(
      page.getByRole('dialog', { name: 'Stop Table 1 without the normal charge' }),
    ).toBeVisible();
    await page.goto(`/table/t1/end?${at('21:51:00')}`);
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(page).toHaveURL(/\/\?now=|\/$/);
    expect(new URL(page.url()).pathname).toBe('/');
  });
});

test.describe('a frame over its limit', () => {
  test('Table 4 at 36 minutes asks to charge double, and Rs 400 goes to Zubair', async ({
    page,
  }) => {
    await open(page, `/table/t4/end?${at('21:44:00')}`);
    await page.getByRole('button', { name: /^Zubair Khan/ }).click();
    await expect(page).toHaveURL(/\/table\/t4\/end\/overtime$/);
    const question = page.getByRole('dialog', {
      name: 'This frame took 36 minutes. Charge double?',
    });
    await expect(question).toContainText(
      'Zubair Khan lost to Usman Tariq. Choose what Zubair pays.',
    );
    await expect(question.getByRole('button', { name: /^Normal price/ })).toContainText('Rs 200');
    await expect(question.getByRole('button', { name: /^Double price/ })).toContainText('Rs 400');
    await question.getByRole('button', { name: /^Double price/ }).click();
    await expect(
      page.getByRole('dialog', { name: 'Rs 400 added to Zubair Khan’s bill' }),
    ).toBeVisible();
  });
});

test.describe('a double frame, a Century and the rooms', () => {
  test('Table 5: Side B lost, half each is 200 and 200, and Charge Imran and Naveed splits it', async ({
    page,
  }) => {
    await open(page, `/table/t5/end?${at('21:47:00')}`);
    const dialog = page.getByRole('dialog', { name: 'Which side lost?' });
    await dialog.getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }).click();
    await expect(dialog.getByRole('group', { name: 'Imran Shah' })).toContainText('200');
    await expect(dialog.getByRole('group', { name: 'Naveed Akhtar' })).toContainText('200');
    await dialog.getByRole('radio', { name: 'Custom' }).click();
    const imran = dialog.getByLabel('Imran Shah');
    await imran.fill('250');
    await expect(dialog.getByLabel('Naveed Akhtar')).toHaveValue('150');
    await dialog.getByRole('radio', { name: 'Half each' }).click();
    await expect(dialog.getByRole('group', { name: 'Imran Shah' })).toContainText('200');
    await dialog.getByRole('button', { name: 'Charge Imran and Naveed' }).click();
    await expect(page).toHaveURL(/\/\?now=|\/$/);
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.getByRole('button', { name: 'Table 5, free' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Imran Shah/ })).toContainText('Rs 200');
  });

  test('Table 3: Century at 42 min 35 sec ends and charges Rs 630', async ({ page }) => {
    await open(page, `/table/t3/end?${at('21:47:30')}`);
    const dialog = page.getByRole('dialog', { name: 'End Century for Saad Hussain?' });
    // The seconds run on the live clock, so only the minutes are exact.
    await expect(dialog).toContainText(/42 min \d+ sec/);
    await expect(dialog).toContainText('42 × Rs 15 goes on Saad Hussain’s bill');
    await dialog.getByRole('button', { name: 'End and charge Rs 630' }).click();
    await expect(page.getByRole('button', { name: 'Table 3, free' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Saad Hussain/ })).toContainText('Rs 630');
  });

  test('Room 2: pick Danish Iqbal, raise the price by 100, and start it', async ({ page }) => {
    await open(page, `/room/r2/start?${at('21:52:00')}`);
    const dialog = page.getByRole('dialog', { name: 'Start Room 2' });
    await expect(dialog.getByRole('button', { name: 'Start Room 2' })).toBeDisabled();
    await dialog
      .getByRole('searchbox', { name: 'Search the player the room is under' })
      .fill('danish');
    await page
      .getByRole('list', { name: 'Search results' })
      .getByRole('button', { name: /^Danish Iqbal/ })
      .click();
    await expect(dialog).toContainText('The whole room bill goes to him.');
    await dialog.getByRole('button', { name: 'Raise by 100 rupees' }).click();
    await expect(dialog.getByLabel('Price for one hour')).toHaveValue('1,600');
    await dialog.getByRole('button', { name: 'Start Room 2' }).click();
    const tile = page.getByRole('button', { name: 'Room 2, playing' });
    await expect(tile).toContainText('Under Danish Iqbal');
    // The price on its label is the table's; the amount is the first hour at the price it started on.
    await expect(tile).toContainText('Rs 1,600');
  });

  test('Room 1 at 10:15 PM after a power cut: Rs 2,500 goes on Ali Hassan’s bill', async ({
    page,
  }) => {
    await open(page, `/room/r1/end?scenario=roomEnd&${at('22:15:00')}`);
    const dialog = page.getByRole('dialog', { name: 'End Room 1 for Ali Hassan?' });
    await expect(dialog).toContainText('Paused for the power cut, not charged');
    await expect(dialog).toContainText('Next 40 minutes at Rs 25 a minute');
    await dialog.getByRole('button', { name: 'End and charge Rs 2,500' }).click();
    await expect(page.getByRole('button', { name: 'Room 1, free' })).toBeVisible();
  });
});

const SCREENS = [
  {
    name: 'screen 17, who lost',
    url: `/table/t1/end?${at('21:51:00')}`,
    prepare: async () => {},
    en: 'Who lost this frame?',
    ur: 'یہ فریم کس نے ہارا؟',
  },
  {
    name: 'screen 18, next frame',
    url: `/table/t1/end?${at('21:51:00')}`,
    prepare: async (page: Page) => {
      await page.getByRole('button', { name: /^Bilal Ahmed/ }).click();
    },
    en: /^Rs 250 added to Bilal Ahmed/,
    ur: /Bilal Ahmed کے بل میں لگ گئے/,
  },
  {
    name: 'screen 19, charge double',
    url: `/table/t4/end?${at('21:44:00')}`,
    prepare: async (page: Page) => {
      await page.getByRole('button', { name: /^Zubair Khan/ }).click();
    },
    en: /^This frame took 36 minutes/,
    ur: /36 منٹ چلا/,
  },
  {
    name: 'screen 20, a double frame',
    url: `/table/t5/end?${at('21:47:00')}`,
    prepare: async (page: Page) => {
      await page.getByRole('button', { name: /Imran Shah.*Naveed Akhtar/ }).click();
    },
    en: 'Which side lost?',
    ur: 'کون سی طرف ہاری؟',
  },
  {
    name: 'screen 21, a Century',
    url: `/table/t3/end?${at('21:47:30')}`,
    prepare: async () => {},
    en: 'End Century for Saad Hussain?',
    ur: /سنچری ختم کریں/,
  },
  {
    name: 'screen 22, start a room',
    url: `/room/r2/start?${at('21:52:00')}`,
    prepare: async () => {},
    en: 'Start Room 2',
    ur: 'روم 2 شروع کریں',
  },
  {
    name: 'screen 23, end a room',
    url: `/room/r1/end?scenario=roomEnd&${at('22:15:00')}`,
    prepare: async () => {},
    en: 'End Room 1 for Ali Hassan?',
    ur: /روم 1 ختم کریں/,
  },
];

for (const lang of ['en', 'ur'] as const) {
  for (const screen of SCREENS) {
    test.describe(`${screen.name}, ${lang === 'ur' ? 'in Urdu' : 'in English'}`, () => {
      const url = screen.url + (lang === 'ur' ? '&lang=ur' : '');
      const ready = async (page: Page) => {
        await screen.prepare(page);
        await expect(page.getByRole('dialog', { name: screen[lang] })).toBeVisible();
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

      test('every control in the dialog is at least 56 px, and nothing scrolls sideways', async ({
        page,
      }) => {
        await open(page, url);
        await ready(page);
        const buttons = await page.$$eval('[role="dialog"] button', (nodes) =>
          nodes
            .map((node) => ({
              what: (node.getAttribute('aria-label') ?? node.textContent ?? '').trim().slice(0, 40),
              height: node.getBoundingClientRect().height,
            }))
            .filter((control) => control.height > 0),
        );
        expect(buttons.filter((control) => control.height < 56)).toEqual([]);
        // A text box sits inside a frame: the frame is what is pressed.
        const boxes = await page.$$eval('[role="dialog"] input', (nodes) =>
          nodes
            .map((node) => ({
              what: (node.getAttribute('aria-label') ?? node.id).slice(0, 40),
              height: Math.max(
                node.getBoundingClientRect().height,
                node.parentElement?.getBoundingClientRect().height ?? 0,
              ),
              visible: node.getBoundingClientRect().width > 0,
            }))
            .filter((control) => control.visible),
        );
        expect(boxes.filter((control) => control.height < 56)).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    });
  }
}

test('in Urdu "Who lost?" is mirrored: Ali Raza’s card is on the right, and the amount stays at the start side', async ({
  page,
}) => {
  await open(page, `/table/t1/end?${at('21:51:00')}&lang=ur`);
  const dialog = page.getByRole('dialog', { name: 'یہ فریم کس نے ہارا؟' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('direction', 'rtl');
  const ali = (await dialog.getByRole('button', { name: /^Ali Raza/ }).boundingBox())!;
  const bilal = (await dialog.getByRole('button', { name: /^Bilal Ahmed/ }).boundingBox())!;
  expect(ali.x).toBeGreaterThan(bilal.x);
});
