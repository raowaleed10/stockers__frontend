import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { clock } from '@/lib/clock';
import { canteenSale } from '@/mocks/db/canteen';
import { startGame } from '@/mocks/db/games';
import { createTestApi } from '@/mocks/test-server';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  wherePath,
} from '../test/harness';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  resetCounterState();
  api.load();
});
afterEach(() => resetCounterState());

const tile = (name: string | RegExp) => screen.findByRole('button', { name });
const tableNames = () =>
  screen
    .findAllByRole('button', { name: /^(Table|Room|Pool table) \d/ })
    .then((buttons) => buttons.map((button) => button.getAttribute('aria-label')));

describe('the live board at 9:42 PM (screen 3)', () => {
  it('draws the nine tables and rooms in the states of the design', async () => {
    renderCounter('/');
    await tile('Table 1, playing');
    expect(await tableNames()).toEqual([
      'Table 1, playing',
      'Table 2, free',
      'Table 3, playing',
      'Table 4, over 30 minutes',
      'Table 5, playing',
      'Table 6, paused',
      'Table 7, out of order',
      'Room 1, playing',
      'Room 2, free',
    ]);
  });

  it('Table 1: Frame 3, Ali leads 2–0, the players, 18:42 and Rs 250', async () => {
    renderCounter('/');
    const t1 = await tile('Table 1, playing');
    expect(t1).toHaveTextContent('Single frame');
    expect(t1).toHaveTextContent('Frame 3, Ali leads 2–0');
    expect(t1).toHaveTextContent('Ali Raza vs Bilal Ahmed');
    expect(within(t1).getByRole('timer')).toHaveTextContent('18:42');
    expect(t1).toHaveTextContent('Rs 250');
    expect(t1).toHaveTextContent('Rs 250 a frame');
  });

  it('Table 2 is free and says what a double and a Century cost', async () => {
    renderCounter('/');
    const t2 = await tile('Table 2, free');
    expect(t2).toHaveTextContent('Tap to start a game');
    expect(t2).toHaveTextContent('Double Rs 500. Century Rs 15 a minute.');
  });

  it('Table 3, a Century: Under Saad Hussain, 37:05 and Rs 555, with a plain timer', async () => {
    renderCounter('/');
    const t3 = await tile('Table 3, playing');
    expect(t3).toHaveTextContent('Century');
    expect(t3).toHaveTextContent('Rs 15 a minute');
    expect(t3).toHaveTextContent('Under Saad Hussain');
    const timer = within(t3).getByRole('timer');
    expect(timer).toHaveTextContent('37:05');
    // A Century runs as long as it likes: no red card (screen 3).
    expect(timer.className).not.toContain('bg-s-card');
    expect(t3).toHaveTextContent('Rs 555');
  });

  it('Table 4 is a red card at 34:10 with Rs 200', async () => {
    renderCounter('/');
    const t4 = await tile('Table 4, over 30 minutes');
    const timer = within(t4).getByRole('timer');
    expect(timer).toHaveTextContent('34:10');
    expect(timer.className).toContain('bg-s-card');
    expect(t4).toHaveTextContent('Over 30 min');
    expect(t4).toHaveTextContent('Usman Tariq vs Zubair Khan');
    expect(t4).toHaveTextContent('Rs 200');
  });

  it('Table 5, a double: the two sides by first names, 22:10 and Rs 400', async () => {
    renderCounter('/');
    const t5 = await tile('Table 5, playing');
    expect(t5).toHaveTextContent('Double frame');
    expect(t5).toHaveTextContent('Kamran, Faisal vs Imran, Naveed');
    expect(within(t5).getByRole('timer')).toHaveTextContent('22:10');
    expect(t5).toHaveTextContent('Rs 400');
  });

  it('Table 6 is paused: the timer stays at 12:04 and it says how long ago', async () => {
    renderCounter('/');
    const t6 = await tile('Table 6, paused');
    expect(t6).toHaveTextContent('paused 3 min ago');
    expect(within(t6).getByRole('timer')).toHaveTextContent('12:04');
    expect(t6).toHaveTextContent('Hamid Ali vs Tariq Jamil');
  });

  it('Table 7 is out of order: grey, with the note and who marked it', async () => {
    renderCounter('/');
    const t7 = await tile('Table 7, out of order');
    expect(t7).toHaveTextContent('Cloth change');
    expect(t7).toHaveTextContent('Marked by Adil at 4:15 PM');
    expect(t7).toHaveAccessibleDescription(/^Cloth change\s*Marked by Adil at 4:15 PM$/);
  });

  it('Room 1 at 1:12:05 is Rs 1,800 with a plain timer; Room 2 is free for an hour at least', async () => {
    renderCounter('/');
    const r1 = await tile('Room 1, playing');
    expect(r1).toHaveTextContent('Hourly');
    expect(r1).toHaveTextContent('Under Ali Hassan');
    const timer = within(r1).getByRole('timer');
    expect(timer).toHaveTextContent('1:12:05');
    expect(timer.className).not.toContain('bg-s-card');
    expect(r1).toHaveTextContent('Rs 1,800');
    expect(r1).toHaveTextContent('Rs 1,500/hr');
    const r2 = await tile('Room 2, free');
    expect(r2).toHaveTextContent('Tap to start a room');
    expect(r2).toHaveTextContent('1 hour minimum');
  });

  it('lists the five players who are waiting, with Rs 1,550 in all', async () => {
    renderCounter('/');
    const panel = await screen.findByRole('complementary', { name: 'Waiting to pay' });
    expect(within(panel).getByRole('heading', { name: 'Waiting to pay' })).toBeInTheDocument();
    expect(panel).toHaveTextContent('5 players');
    const rows = within(panel).getAllByRole('button');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Bilal Ahmed•••• 4512, 2 frames lost, 2 teasRs 600',
      'Zubair Khan•••• 0391, 1 frame lostRs 200',
      'Kamran Iqbal•••• 2276, half of a doubleRs 250',
      'Faisal Mehmood•••• 8803, half of a doubleRs 250',
      'Tariq Jamil•••• 6150, 1 frame lostRs 250',
    ]);
    expect(panel).toHaveTextContent('Not paid yet today');
    expect(panel).toHaveTextContent('Rs 1,550');
  });

  it('has the six game tabs; the first is selected and says "6 of 9 in use"', async () => {
    renderCounter('/');
    const nav = await screen.findByRole('navigation', { name: 'Game categories' });
    const tabs = within(nav).getAllByRole('button');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Snooker and rooms6 of 9 in use',
      'Pool0 of 4',
      'Foosball0 of 3',
      'Carrom0 of 3',
      'Ludo0 of 4',
      'PlayStation0 of 5',
    ]);
    expect(tabs.map((tab) => tab.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
    ]);
  });
});

describe('what a tap does', () => {
  it('a free table starts a game, a running one opens the game, a free room starts a room', async () => {
    const view = renderCounter('/');
    await userEvent.click(await tile('Table 2, free'));
    expect(wherePath(view)).toBe('/table/t2/start');
    view.unmount();

    const second = renderCounter('/');
    await userEvent.click(await tile('Table 1, playing'));
    expect(wherePath(second)).toBe('/table/t1');
    second.unmount();

    const third = renderCounter('/');
    await userEvent.click(await tile('Room 2, free'));
    expect(wherePath(third)).toBe('/room/r2/start');
    third.unmount();

    const fourth = renderCounter('/');
    await userEvent.click(await tile('Table 6, paused'));
    expect(wherePath(fourth)).toBe('/table/t6');
  });

  it('an out-of-order table does nothing when it is pressed', async () => {
    const view = renderCounter('/');
    await userEvent.click(await tile('Table 7, out of order'));
    expect(wherePath(view)).toBe('/');
  });

  it('a waiting player opens his bill', async () => {
    const view = renderCounter('/');
    const panel = await screen.findByRole('complementary', { name: 'Waiting to pay' });
    await userEvent.click(within(panel).getByRole('button', { name: /Bilal Ahmed/ }));
    expect(wherePath(view)).toBe('/checkout/bilal');
  });

  it('a tab opens that game, and the first tab goes back to /', async () => {
    const view = renderCounter('/');
    const nav = await screen.findByRole('navigation', { name: 'Game categories' });
    await userEvent.click(within(nav).getByRole('button', { name: /^Pool/ }));
    expect(wherePath(view)).toBe('/board/pool');
    await userEvent.click(
      await within(await screen.findByRole('navigation')).findByRole('button', {
        name: /^Snooker and rooms/,
      }),
    );
    expect(wherePath(view)).toBe('/');
  });
});

describe('pool tables before a price is set (screen 4)', () => {
  it('shows the banner, four locked tiles and the two cards, and no waiting list', async () => {
    renderCounter('/board/pool');
    const title = await screen.findByText('Pool tables have no price yet');
    // (The test's own router probe is also a "status", so the banner is found by its words.)
    const banner = title.closest('[role="status"]');
    expect(banner).not.toBeNull();
    expect(banner).toHaveTextContent('Pool tables have no price yet');
    expect(banner).toHaveTextContent(
      'An owner sets the price in Games and prices. Until then these tables cannot be started.',
    );
    for (const n of [1, 2, 3, 4]) {
      const locked = screen.getByRole('button', { name: `Pool table ${n}, price not set` });
      expect(locked).toBeDisabled();
      expect(locked).toHaveAccessibleDescription('Locked until an owner sets the price');
      expect(locked).toHaveTextContent('Pool table');
      expect(locked).toHaveTextContent('Rs —');
    }
    expect(screen.getByRole('heading', { name: 'Once a price is set' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Century stays on snooker' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Century by the minute is only offered on snooker tables 1 to 7. Rooms are always by the hour.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Waiting to pay' })).toBeNull();
    // Pool is the selected tab and says "0 of 4"; snooker says "6 of 9 in use".
    expect(screen.getByRole('button', { name: 'Pool0 of 4' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Snooker and rooms/ })).toHaveTextContent(
      '6 of 9 in use',
    );
  });

  it('does nothing when a locked table is pressed', async () => {
    const view = renderCounter('/board/pool');
    await userEvent.click(await tile('Pool table 1, price not set'));
    expect(wherePath(view)).toBe('/board/pool');
  });

  it('is the same for foosball, carrom, ludo and PlayStation while their prices are not set', async () => {
    const words: [string, string][] = [
      ['foosball', 'Foosball tables have no price yet'],
      ['carrom', 'Carrom boards have no price yet'],
      ['ludo', 'Ludo boards have no price yet'],
      ['playstation', 'PlayStation screens have no price yet'],
    ];
    for (const [category, title] of words) {
      const view = renderCounter(`/board/${category}`);
      expect(await screen.findByText(title)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /price not set$/ }).length).toBeGreaterThan(2);
      view.unmount();
    }
  });
});

describe('addresses', () => {
  it('/board/snooker and /board/room are the first tab, at /', async () => {
    const view = renderCounter('/board/snooker');
    await tile('Table 1, playing');
    expect(wherePath(view)).toBe('/');
    view.unmount();
    const second = renderCounter('/board/room');
    await tile('Table 1, playing');
    expect(wherePath(second)).toBe('/');
  });

  it('a game type that does not exist is "Page not found"', async () => {
    renderCounter('/board/snakes');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('/table/t2/start, /table/t1 and /room/r2/start are inside the frame until P06 and P07', async () => {
    renderCounter('/table/t2/start');
    expect(await screen.findByRole('button', { name: /Signed in: Zain/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tap to start a game (t2)' })).toBeInTheDocument();
  });
});

describe('the bell panel over the finished board', () => {
  it('opens at /alerts with the real board behind it, out of reach', async () => {
    renderCounter('/alerts');
    const dialog = await screen.findByRole('dialog', { name: 'Alerts' });
    expect(dialog).toBeInTheDocument();
    const t1 = await screen.findByRole('button', { name: 'Table 1, playing', hidden: true });
    // The board is the part of the page that is inert and hidden; the panel is not inside it.
    const behind = t1.closest('[inert]');
    expect(behind).not.toBeNull();
    expect(behind).toHaveAttribute('aria-hidden', 'true');
    expect(behind?.contains(dialog)).toBe(false);
    expect(screen.queryByRole('button', { name: 'Table 1, playing' })).toBeNull();
  });

  it('gives the board back when the panel is closed', async () => {
    const view = renderCounter('/alerts');
    const dialog = await screen.findByRole('dialog', { name: 'Alerts' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close panel' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    const t1 = await tile('Table 1, playing');
    expect(t1.closest('[inert]')).toBeNull();
  });
});

describe('the time limit of each game (D56)', () => {
  const person = () => api.db.workerPerson(api.db.s.workers.find((w) => w.id === 'zain')!);

  it('a frame is over its limit at that game’s own number, not always 30', async () => {
    // Table 1 is 18:42 in; give its frame a limit of 15 minutes.
    api.db.game('g-t1-3').maxMinutes = 15;
    renderCounter('/');
    const t1 = await tile('Table 1, over 15 minutes');
    expect(t1).toHaveTextContent('Over 15 min');
    expect(within(t1).getByRole('timer').className).toContain('bg-s-card');
    // Table 4 keeps 30 and is over it too; Table 5 (22:10) is not over 30.
    expect(await tile('Table 4, over 30 minutes')).toHaveTextContent('Over 30 min');
    expect(await tile('Table 5, playing')).not.toHaveTextContent('Over');
  });

  it('a game of pool turns into the red card at its own limit', async () => {
    api.db.table('po1').price = 150;
    api.db.table('po1').maxMinutes = 20;
    const game = startGame(api.db, person(), {
      tableId: 'po1',
      type: 'game',
      playerIds: ['imran', 'naveed'],
    });
    game.startedAt = new Date(clock.now() - 25 * 60_000).toISOString();
    renderCounter('/board/pool');
    const pool = await tile('Pool table 1, over 20 minutes');
    expect(pool).toHaveTextContent('Over 20 min');
    expect(pool).toHaveTextContent('Single game');
    expect(within(pool).getByRole('timer').className).toContain('bg-s-card');
    expect(pool).toHaveTextContent('Rs 150');
  });

  it('says the limit in Urdu too', async () => {
    api.db.game('g-t1-3').maxMinutes = 15;
    setLanguage('ur');
    renderCounter('/');
    const t1 = await tile('ٹیبل 1، 15 منٹ سے زیادہ');
    expect(t1).toHaveTextContent('15 منٹ سے زیادہ');
  });

  it('never turns a Century or a room into a red card, however long it runs', async () => {
    clock.setStart(Date.parse('2026-10-03T23:00:00+05:00'));
    renderCounter('/');
    const century = await tile('Table 3, playing');
    expect(within(century).getByRole('timer').className).not.toContain('bg-s-card');
    const room = await tile('Room 1, playing');
    expect(within(room).getByRole('timer').className).not.toContain('bg-s-card');
  });
});

describe('the clock on the board', () => {
  it('turns Table 4 into the red card at 30:00 without a reload', async () => {
    // Table 4 started at 9:07:50 PM. At 9:37:48 PM it has been playing for 29:58.
    clock.setStart(Date.parse('2026-10-03T21:37:48+05:00'));
    renderCounter('/');
    const before = await tile('Table 4, playing');
    expect(within(before).getByRole('timer').className).not.toContain('bg-s-card');
    expect(before).not.toHaveTextContent('Over 30 min');
    // Two seconds later the tile has changed by itself: ring, pill and timer.
    const after = await screen.findByRole(
      'button',
      { name: 'Table 4, over 30 minutes' },
      { timeout: 6000 },
    );
    expect(within(after).getByRole('timer').className).toContain('bg-s-card');
    expect(after).toHaveTextContent('Over 30 min');
  }, 15_000);

  it('grows the amount of a Century by itself as the minutes pass', async () => {
    // Table 3 started at 9:04:55 PM: 37 whole minutes at Rs 15 is Rs 555; at 38 minutes (9:42:55 PM) it is Rs 570.
    clock.setStart(Date.parse('2026-10-03T21:42:53+05:00'));
    renderCounter('/');
    const before = await tile('Table 3, playing');
    expect(before).toHaveTextContent('Rs 555');
    await waitFor(
      () =>
        expect(screen.getByRole('button', { name: 'Table 3, playing' })).toHaveTextContent(
          'Rs 570',
        ),
      {
        timeout: 6000,
      },
    );
  }, 15_000);
});

describe('live events', () => {
  const zain = () =>
    api.db.workerPerson(api.db.s.workers.find((w) => w.id === 'zain') ?? api.db.s.workers[0]);

  it('shows a game that was started, without a reload', async () => {
    renderCounter('/');
    await tile('Table 2, free');
    act(() => {
      startGame(api.db, zain(), {
        tableId: 't2',
        type: 'single',
        playerIds: ['ahmed-nawaz', 'ali-akbar'],
      });
    });
    const started = await tile('Table 2, playing');
    expect(started).toHaveTextContent('Ahmed Nawaz vs Ali Akbar');
    expect(screen.getByRole('button', { name: /Snooker and rooms/ })).toHaveTextContent(
      '7 of 9 in use',
    );
  });

  it('shows a new canteen charge in the waiting list, without a reload', async () => {
    renderCounter('/');
    const panel = await screen.findByRole('complementary', { name: 'Waiting to pay' });
    await within(panel).findByText('Zubair Khan');
    act(() => {
      canteenSale(api.db, zain(), {
        playerId: 'zubair',
        items: [{ itemId: 'tea', qty: 2 }],
      });
    });
    await waitFor(() => expect(panel).toHaveTextContent('1 frame lost, 2 teas'));
    expect(panel).toHaveTextContent('Rs 1,650');
  });
});

describe('the board in Urdu (screen 6)', () => {
  it('writes the tabs, tiles and waiting list in Urdu, with the count on the selected tab only', async () => {
    setLanguage('ur');
    renderCounter('/');
    await tile('ٹیبل 1، کھیل جاری');
    expect(await screen.findAllByRole('button', { name: /^(ٹیبل|روم) \d/ })).toHaveLength(9);

    const nav = screen.getByRole('navigation', { name: 'کھیل' });
    expect(
      within(nav)
        .getAllByRole('button')
        .map((tab) => tab.textContent),
    ).toEqual(['اسنوکر اور رومز9 میں سے 6 مصروف', 'پول', 'فوس بال', 'کیرم', 'لڈو', 'پلے اسٹیشن']);

    const panel = screen.getByRole('complementary', { name: 'ادائیگی باقی' });
    expect(panel).toHaveTextContent('5 کھلاڑی');
    expect(panel).toHaveTextContent('آج ابھی تک ادا نہیں ہوا');
    expect(panel).toHaveTextContent('1,550 روپے');
    // The words for frames and doubles are Urdu; the canteen item keeps the name it was stored with.
    expect(panel).toHaveTextContent('2 فریم ہارے، 2 Tea');
    expect(panel).toHaveTextContent('1 فریم ہارا');
    expect(panel).toHaveTextContent('ڈبل کا آدھا');
  });

  it('writes what the app builds in Urdu and leaves stored words as they are', async () => {
    setLanguage('ur');
    renderCounter('/');
    const t1 = await tile('ٹیبل 1، کھیل جاری');
    expect(t1).toHaveTextContent('سنگل فریم');
    expect(t1).toHaveTextContent('فریم 3، Ali 2-0 سے آگے');
    const t6 = await tile('ٹیبل 6، رکا ہوا');
    expect(t6).toHaveTextContent('3 منٹ سے رکا ہوا');
    const t7 = await tile('ٹیبل 7، خراب');
    // The note is stored as typed; "Marked by … at …" is built by the app.
    expect(t7).toHaveTextContent('Cloth change');
    expect(t7).toHaveTextContent('Adil نے شام 4:15 بجے لگایا');
    expect(await tile('ٹیبل 2، خالی')).toHaveTextContent('ڈبل 500 روپے۔ سنچری 15 روپے فی منٹ۔');
    expect(await tile('روم 2، خالی')).toHaveTextContent('کم از کم 1 گھنٹہ');
  });
});
