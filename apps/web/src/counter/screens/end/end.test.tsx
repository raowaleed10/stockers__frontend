import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import { useEndDraft } from '../../end/draft';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  wherePath,
} from '../../test/harness';

const api = createTestApi();
beforeAll(async () => {
  await startCounterTests(api);
  // The first charge of a file pays for everything that is cold (the end call through the mock server, the game view, the
  // next-frame screen), and under a full run that is longer than the one second a findBy waits. Pay for it here, as
  // startCounterTests does for the first draw, so every test keeps the normal limits.
  api.load();
  api.setTime('2026-10-03T21:51:00+05:00');
  resetCounterState(Date.parse('2026-10-03T21:51:00+05:00'));
  const view = renderCounter('/table/t1/end');
  await userEvent.click(
    within(
      await screen.findByRole('dialog', { name: 'Who lost this frame?' }, { timeout: 20_000 }),
    ).getByRole('button', { name: /^Bilal Ahmed/ }),
  );
  await screen.findByRole('dialog', { name: /added to Bilal Ahmed/ }, { timeout: 20_000 });
  view.unmount();
}, 60_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
  useEndDraft.getState().reset();
});
afterEach(() => {
  resetCounterState();
  useEndDraft.getState().reset();
});

const dialog = (name: string | RegExp) => screen.findByRole('dialog', { name });
/**
 * The dialog that follows a charge. It comes after a chain (the end call, the live events, the refetch of the game and
 * the board, the new screen), which under a full run on this computer can take longer than the one second `dialog` waits.
 * The test's own limit stays 5 s.
 */
const afterCharge = (name: string | RegExp) =>
  screen.findByRole('dialog', { name }, { timeout: 4000 });
const at = (iso: string, scenario?: Parameters<typeof api.load>[0]) => {
  if (scenario) api.load(scenario);
  api.setTime(iso);
  resetCounterState(Date.parse(iso));
};
const gameOn = (tableId: string) =>
  api.db.s.games.find(
    (g) => g.tableId === tableId && (g.status === 'running' || g.status === 'paused'),
  );
const lines = (playerId: string) => api.db.statement(playerId);
const tonight = (playerId: string) =>
  api.db.tonightLines(playerId).reduce((sum, line) => sum + (line.charge ?? 0), 0);

describe('screen 17: who lost this frame?', () => {
  it('Table 1 at 9:51 PM: the kicker, the price and what each player did tonight', async () => {
    at('2026-10-03T21:51:00+05:00');
    renderCounter('/table/t1/end');
    const d = await dialog('Who lost this frame?');
    expect(d).toHaveTextContent('Table 1, frame 3 ended at 9:51 PM after 28 minutes');
    expect(d).toHaveTextContent('Rs 250');
    const ali = within(d).getByRole('button', { name: /^Ali Raza/ });
    expect(ali).toHaveTextContent('0300 •••• 1964');
    expect(ali).toHaveTextContent('Won 2 frames tonight');
    expect(ali).toHaveTextContent('Owes nothing');
    const bilal = within(d).getByRole('button', { name: /^Bilal Ahmed/ });
    expect(bilal).toHaveTextContent('0300 •••• 4512');
    expect(bilal).toHaveTextContent('Lost 2 frames, 2 teas tonight');
    expect(bilal).toHaveTextContent('Rs 600 waiting');
    expect(
      within(d).getByText(
        'Tap the loser. The frame price goes on his bill and the winner is recorded.',
      ),
    ).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Keep playing' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Nobody pays' })).toBeInTheDocument();
  });

  it('tapping the loser charges the frame, updates the score, and shows the next-frame screen (18)', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    const d = await dialog('Who lost this frame?');
    await userEvent.click(within(d).getByRole('button', { name: /^Bilal Ahmed/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t1/next'));

    const next = await afterCharge('Rs 250 added to Bilal Ahmed’s bill');
    expect(next).toHaveTextContent('He now has Rs 850 waiting to pay. Ali Raza won frame 3.');
    expect(next).toHaveTextContent('Table 1 session, 3 frames');
    expect(next).toHaveTextContent('Ali 3 – 0 Bilal');
    expect(next).toHaveTextContent('Next frame, same players');
    expect(next).toHaveTextContent('Frame 4 starts now, Rs 250');
    expect(next).toHaveTextContent('Change players');
    expect(next).toHaveTextContent('New frame on Table 1');
    expect(next).toHaveTextContent('Free the table');
    expect(next).toHaveTextContent('Players are done');
    expect(next).toHaveTextContent('Tapped the wrong player?');
    // The countdown runs on the clock, so a slow computer may already be at 1:59.
    expect(next).toHaveTextContent(/Undo, (2:00|1:5\d) left/);

    // The frame is on his bill with the worker's name, the game is over, the table is free.
    const frame = lines('bilal').find((line) => line.text.startsWith('Frame 3'));
    expect(frame).toMatchObject({
      charge: 250,
      text: 'Frame 3, Table 1, lost to Ali Raza',
      doneBy: { name: 'Zain' },
    });
    expect(tonight('bilal')).toBe(850);
    expect(gameOn('t1')).toBeUndefined();
  });

  it('Next frame, same players starts frame 4 on Table 1 with the same two players', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    await userEvent.click(
      within(await dialog('Who lost this frame?')).getByRole('button', { name: /^Bilal Ahmed/ }),
    );
    const next = await afterCharge('Rs 250 added to Bilal Ahmed’s bill');
    await userEvent.click(within(next).getByRole('button', { name: /^Next frame, same players/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t1')).toMatchObject({
      type: 'single',
      frameNo: 4,
      playerIds: ['ali-raza', 'bilal'],
      price: 250,
      startedBy: { name: 'Zain' },
    });
  });

  it('Undo takes the charge back and asks who lost again; Free the table closes', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    await userEvent.click(
      within(await dialog('Who lost this frame?')).getByRole('button', { name: /^Bilal Ahmed/ }),
    );
    const next = await afterCharge('Rs 250 added to Bilal Ahmed’s bill');
    await userEvent.click(within(next).getByRole('button', { name: /^Undo, / }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t1/end'));
    const again = await dialog('Who lost this frame?');
    expect(within(again).getByRole('button', { name: /^Bilal Ahmed/ })).toHaveTextContent(
      'Rs 600 waiting',
    );
    expect(tonight('bilal')).toBe(600);
    expect(gameOn('t1')).toMatchObject({ status: 'running', frameNo: 3 });
    expect(api.db.s.activity[0]).toMatchObject({
      type: 'undo',
      title: 'Frame undone on Table 1',
      by: { name: 'Zain' },
    });
  });

  it('Free the table closes the screen and leaves the charge', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    await userEvent.click(
      within(await dialog('Who lost this frame?')).getByRole('button', { name: /^Ali Raza/ }),
    );
    const next = await afterCharge('Rs 250 added to Ali Raza’s bill');
    await userEvent.click(within(next).getByRole('button', { name: /^Free the table/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(tonight('ali-raza')).toBe(250);
  });

  it('Change players opens the players of a new frame on the same table', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    await userEvent.click(
      within(await dialog('Who lost this frame?')).getByRole('button', { name: /^Bilal Ahmed/ }),
    );
    await userEvent.click(
      within(await afterCharge('Rs 250 added to Bilal Ahmed’s bill')).getByRole('button', {
        name: /^Change players/,
      }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/table/t1/start/players'));
    await dialog('Who is playing on Table 1?');
  });

  it('Keep playing closes it, and Nobody pays goes to the stop screen (a reason is asked there)', async () => {
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t1/end');
    const d = await dialog('Who lost this frame?');
    await userEvent.click(within(d).getByRole('button', { name: 'Nobody pays' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t1/stop'));
    view.unmount();

    const second = renderCounter('/table/t1/end');
    await userEvent.click(
      within(await dialog('Who lost this frame?')).getByRole('button', { name: 'Keep playing' }),
    );
    await waitFor(() => expect(wherePath(second)).toBe('/'));
    expect(gameOn('t1')?.status).toBe('running');
  });

  it('a table with no game goes back to the board, and a reload of the next-frame screen too', async () => {
    const view = renderCounter('/table/t2/end');
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    view.unmount();
    const next = renderCounter('/table/t1/next');
    await waitFor(() => expect(wherePath(next)).toBe('/'));
  });

  it('a game of pool asks who lost the game', async () => {
    at('2026-10-03T21:42:00+05:00');
    api.db.table('po1').price = 300;
    const game = api.db.s.games;
    game.push({
      id: 'g-po1',
      tableId: 'po1',
      sheetId: 's48',
      type: 'game',
      status: 'running',
      startedAt: '2026-10-03T21:30:00+05:00',
      startedBy: { id: 'zain', name: 'Zain', role: 'worker' },
      pausedMs: 0,
      price: 300,
      maxMinutes: 30,
      playerIds: ['imran', 'naveed'],
    });
    renderCounter('/board/pool/table/po1/end');
    const d = await dialog('Who lost this game?');
    expect(d).toHaveTextContent('Pool table 1, game ended at 9:42 PM after 12 minutes');
    await userEvent.click(within(d).getByRole('button', { name: /^Naveed/ }));
    await waitFor(() => expect(gameOn('po1')).toBeUndefined());
    expect(lines('naveed').find((line) => line.kind === 'game')).toMatchObject({ charge: 300 });
  });
});

describe('screen 19: over the limit, charge double?', () => {
  /** Table 4 started at 9:07:50 PM: 36 minutes at 9:44 PM. */
  const lost = async () => {
    at('2026-10-03T21:44:00+05:00');
    const view = renderCounter('/table/t4/end');
    const d = await dialog('Who lost this frame?');
    await userEvent.click(within(d).getByRole('button', { name: /^Zubair Khan/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t4/end/overtime'));
    return view;
  };

  it('Table 4 at 36 minutes asks before charging: nothing is charged yet', async () => {
    await lost();
    const d = await dialog('This frame took 36 minutes. Charge double?');
    expect(d).toHaveTextContent('Table 4 ran over 30 minutes');
    expect(d).toHaveTextContent('Zubair Khan lost to Usman Tariq. Choose what Zubair pays.');
    expect(within(d).getByRole('button', { name: /^Normal price/ })).toHaveTextContent('Rs 200');
    expect(within(d).getByRole('button', { name: /^Double price/ })).toHaveTextContent('Rs 400');
    expect(d).toHaveTextContent(
      'The timer showed a red card at 30 minutes. Owners see which frames were charged double.',
    );
    expect(gameOn('t4')).toBeDefined();
  });

  it('Double price: Rs 400 goes to Zubair, and Activity says the frame was charged double', async () => {
    const view = await lost();
    const d = await dialog('This frame took 36 minutes. Charge double?');
    const before = tonight('zubair');
    await userEvent.click(within(d).getByRole('button', { name: /^Double price/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t4/next'));
    expect(tonight('zubair')).toBe(before + 400);
    expect(api.db.s.activity.find((a) => a.type === 'double-charge')).toMatchObject({
      by: { name: 'Zain' },
      amount: 200,
    });
    expect(await afterCharge('Rs 400 added to Zubair Khan’s bill')).toBeInTheDocument();
  });

  it('Normal price charges Rs 200 and writes nothing about a double', async () => {
    await lost();
    const d = await dialog('This frame took 36 minutes. Charge double?');
    const before = tonight('zubair');
    const doubles = api.db.s.activity.filter((a) => a.type === 'double-charge').length;
    await userEvent.click(within(d).getByRole('button', { name: /^Normal price/ }));
    await afterCharge('Rs 200 added to Zubair Khan’s bill');
    expect(tonight('zubair')).toBe(before + 200);
    expect(api.db.s.activity.filter((a) => a.type === 'double-charge')).toHaveLength(doubles);
  });

  it('Back returns to who lost, and a reload of the question asks who lost first', async () => {
    const view = await lost();
    await userEvent.click(
      within(await dialog('This frame took 36 minutes. Charge double?')).getByRole('button', {
        name: 'Back',
      }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/table/t4/end'));
    view.unmount();
    // A reload: the draft lives in memory, so it is gone.
    useEndDraft.getState().reset();
    const fresh = renderCounter('/table/t4/end/overtime');
    await waitFor(() => expect(wherePath(fresh)).toBe('/table/t4/end'));
  });

  it('a game under its limit is charged at once, with no question', async () => {
    at('2026-10-03T21:35:00+05:00');
    const view = renderCounter('/table/t4/end');
    const d = await dialog('Who lost this frame?');
    expect(d).toHaveTextContent('after 27 minutes');
    await userEvent.click(within(d).getByRole('button', { name: /^Usman Tariq/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t4/next'));
    expect(lines('usman-t').find((line) => line.text.startsWith('Frame'))).toMatchObject({
      charge: 200,
    });
  });
});

describe('screen 20: which side lost?', () => {
  const open = async () => {
    at('2026-10-03T21:47:00+05:00');
    const view = renderCounter('/table/t5/end');
    const d = await dialog('Which side lost?');
    return { view, d };
  };

  it('Table 5: the two sides, Rs 400, and no split until a side is chosen', async () => {
    const { d } = await open();
    expect(d).toHaveTextContent('Table 5, double frame ended after 27 minutes');
    expect(d).toHaveTextContent('Rs 400');
    expect(
      within(d).getByRole('button', { name: /Kamran Iqbal and Faisal Mehmood/ }),
    ).toHaveTextContent('Side A');
    expect(
      within(d).getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }),
    ).toHaveTextContent('Side B');
    expect(within(d).queryByText('How the Rs 400 is split')).toBeNull();
    expect(within(d).getByRole('button', { name: 'Choose the side that lost' })).toBeDisabled();
  });

  it('Side B lost: half each is 200 and 200, and "Charge Imran and Naveed" splits it', async () => {
    const { view, d } = await open();
    await userEvent.click(within(d).getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }));
    expect(d).toHaveTextContent('Side B lost');
    expect(d).toHaveTextContent('How the Rs 400 is split');
    expect(within(d).getByRole('radio', { name: 'Half each' })).toBeChecked();
    expect(within(d).getByRole('group', { name: 'Imran Shah' })).toHaveTextContent('200');
    expect(within(d).getByRole('group', { name: 'Naveed Akhtar' })).toHaveTextContent('200');
    await userEvent.click(within(d).getByRole('button', { name: 'Charge Imran and Naveed' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(lines('imran').find((l) => l.kind === 'double')).toMatchObject({ charge: 200 });
    expect(lines('naveed').find((l) => l.kind === 'double')).toMatchObject({ charge: 200 });
    expect(gameOn('t5')).toBeUndefined();
  });

  it('One pays all: the player tapped pays the whole Rs 400 and the other pays nothing', async () => {
    const { view, d } = await open();
    await userEvent.click(within(d).getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }));
    await userEvent.click(within(d).getByRole('radio', { name: 'One pays all' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Naveed pays' }));
    expect(within(d).getByRole('button', { name: 'Charge Naveed' })).toBeEnabled();
    await userEvent.click(within(d).getByRole('button', { name: 'Charge Naveed' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(lines('naveed').find((l) => l.kind === 'double')).toMatchObject({ charge: 400 });
    expect(lines('imran').find((l) => l.kind === 'double')).toBeUndefined();
  });

  it('Custom: changing one share changes the other, so they always add up to Rs 400', async () => {
    const { view, d } = await open();
    await userEvent.click(within(d).getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }));
    await userEvent.click(within(d).getByRole('radio', { name: 'Custom' }));
    const imran = within(d).getByLabelText('Imran Shah');
    await userEvent.clear(imran);
    await userEvent.type(imran, '300');
    expect(imran).toHaveValue('300');
    expect(within(d).getByLabelText('Naveed Akhtar')).toHaveValue('100');
    await userEvent.click(within(d).getByRole('button', { name: 'Charge Imran and Naveed' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(lines('imran').find((l) => l.kind === 'double')).toMatchObject({ charge: 300 });
    expect(lines('naveed').find((l) => l.kind === 'double')).toMatchObject({ charge: 100 });
  });

  it('a side with one player: he pays all Rs 400 and there is no split to choose', async () => {
    at('2026-10-03T21:47:00+05:00');
    const game = gameOn('t5');
    if (game) game.sides = [['kamran', 'faisal'], ['imran']];
    renderCounter('/table/t5/end');
    const d = await dialog('Which side lost?');
    await userEvent.click(within(d).getByRole('button', { name: /^Side B/ }));
    expect(within(d).queryByRole('radiogroup')).toBeNull();
    expect(within(d).getByRole('group', { name: 'Imran Shah' })).toHaveTextContent('400');
    expect(within(d).getByRole('button', { name: 'Charge Imran' })).toBeEnabled();
  });

  it('past its limit, Charge asks to charge double first, and a custom split doubles with the price', async () => {
    at('2026-10-03T22:00:00+05:00');
    const view = renderCounter('/table/t5/end');
    const d = await dialog('Which side lost?');
    await userEvent.click(within(d).getByRole('button', { name: /Imran Shah and Naveed Akhtar/ }));
    await userEvent.click(within(d).getByRole('radio', { name: 'Custom' }));
    const imran = within(d).getByLabelText('Imran Shah');
    await userEvent.clear(imran);
    await userEvent.type(imran, '300');
    await userEvent.click(within(d).getByRole('button', { name: 'Charge Imran and Naveed' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t5/end/overtime'));
    const question = await dialog(/^This frame took 40 minutes/);
    expect(question).toHaveTextContent(
      'Imran Shah and Naveed Akhtar lost to Kamran Iqbal and Faisal Mehmood. Choose what they pay.',
    );
    expect(within(question).getByRole('button', { name: /^Normal price/ })).toHaveTextContent(
      'Rs 400',
    );
    expect(within(question).getByRole('button', { name: /^Double price/ })).toHaveTextContent(
      'Rs 800',
    );
    await userEvent.click(within(question).getByRole('button', { name: /^Double price/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(lines('imran').find((l) => l.kind === 'double')).toMatchObject({ charge: 600 });
    expect(lines('naveed').find((l) => l.kind === 'double')).toMatchObject({ charge: 200 });
  });
});

describe('screen 21: end a Century', () => {
  it('Table 3 at 42 min 35 sec: 42 minutes, Rs 15 a minute, no pause, Rs 630', async () => {
    at('2026-10-03T21:47:30+05:00');
    renderCounter('/table/t3/end');
    const d = await dialog('End Century for Saad Hussain?');
    expect(d).toHaveTextContent('Century on Table 3, started 9:04 PM');
    const cell = (label: string) => within(d).getByText(label).parentElement as HTMLElement;
    expect(cell('Time on the table')).toHaveTextContent('42 min 35 sec');
    expect(cell('Minutes charged')).toHaveTextContent('42 min');
    expect(cell('Rate set at start')).toHaveTextContent('Rs 15 a minute');
    expect(cell('Paused time, not charged')).toHaveTextContent('0 min');
    expect(d).toHaveTextContent('42 × Rs 15 goes on Saad Hussain’s bill');
    expect(d).toHaveTextContent('Rs 630');
    expect(
      within(d).getByText('Extra seconds are not charged. How the players share it is up to them.'),
    ).toBeInTheDocument();
  });

  it('End and charge Rs 630 charges Saad, frees the table and counts the minutes', async () => {
    at('2026-10-03T21:47:30+05:00');
    const view = renderCounter('/table/t3/end');
    const d = await dialog('End Century for Saad Hussain?');
    const before = tonight('saad');
    await userEvent.click(within(d).getByRole('button', { name: 'End and charge Rs 630' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(tonight('saad')).toBe(before + 630);
    expect(lines('saad').find((l) => l.kind === 'century')).toMatchObject({
      charge: 630,
      doneBy: { name: 'Zain' },
    });
    expect(gameOn('t3')).toBeUndefined();
  });

  it('paused minutes are not charged and are said', async () => {
    at('2026-10-03T21:47:30+05:00');
    const game = gameOn('t3');
    if (game) game.pausedMs = 5 * 60_000;
    renderCounter('/table/t3/end');
    const d = await dialog('End Century for Saad Hussain?');
    expect(within(d).getByText('Minutes charged').parentElement).toHaveTextContent('37 min');
    expect(within(d).getByText('Paused time, not charged').parentElement).toHaveTextContent(
      '5 min',
    );
    expect(d).toHaveTextContent('Rs 555');
  });

  it('Keep playing closes it and nothing is charged', async () => {
    const view = renderCounter('/table/t3/end');
    const d = await dialog('End Century for Saad Hussain?');
    await userEvent.click(within(d).getByRole('button', { name: 'Keep playing' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t3')?.status).toBe('running');
  });
});

describe('screen 22: start a room', () => {
  const open = async () => {
    at('2026-10-03T21:52:00+05:00');
    const view = renderCounter('/room/r2/start');
    const d = await dialog('Start Room 2');
    return { view, d };
  };

  it('Room 2: the price of an hour starts at Rs 1,500, with the first hour, the minute price and the example', async () => {
    const { d } = await open();
    expect(d).toHaveTextContent('Room 2, snooker table with sofa seating');
    expect(within(d).getByLabelText('Price for one hour')).toHaveValue('1,500');
    expect(d).toHaveTextContent(
      'Starts at Rs 1,500. Change it if the owners agreed a different price.',
    );
    const box = (label: string) => within(d).getByText(label).parentElement as HTMLElement;
    expect(box('First hour (minimum)')).toHaveTextContent('Rs 1,500');
    expect(box('After that, every minute')).toHaveTextContent('Rs 25');
    expect(box('Example, 1 hour 40 min')).toHaveTextContent('Rs 2,500');
    expect(d).toHaveTextContent('Start time is filled in when you tap Start.');
    // Nobody is picked, so it cannot start yet.
    expect(within(d).getByRole('button', { name: 'Start Room 2' })).toBeDisabled();
  });

  it('pick Danish Iqbal, change the price by 100 with the buttons, and Start Room 2 starts it under him', async () => {
    const { view, d } = await open();
    const search = within(d).getByRole('searchbox', {
      name: 'Search the player the room is under',
    });
    await userEvent.type(search, 'danish');
    await userEvent.click(
      await within(await screen.findByRole('list', { name: 'Search results' })).findByRole(
        'button',
        {
          name: /^Danish Iqbal/,
        },
      ),
    );
    expect(d).toHaveTextContent('Danish Iqbal');
    expect(d).toHaveTextContent('The whole room bill goes to him.');
    await userEvent.click(within(d).getByRole('button', { name: 'Raise by 100 rupees' }));
    expect(within(d).getByLabelText('Price for one hour')).toHaveValue('1,600');
    expect(within(d).getByText('First hour (minimum)').parentElement).toHaveTextContent('Rs 1,600');
    await userEvent.click(within(d).getByRole('button', { name: 'Lower by 100 rupees' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Lower by 100 rupees' }));
    expect(within(d).getByLabelText('Price for one hour')).toHaveValue('1,400');
    await userEvent.click(within(d).getByRole('button', { name: 'Start Room 2' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('r2')).toMatchObject({
      type: 'room',
      underPlayerId: 'danish',
      price: 1400,
      startedAt: '2026-10-03T21:52:00+05:00',
      startedBy: { name: 'Zain' },
    });
  });

  it('Change takes the player off so another can be picked; a room that is running opens its panel', async () => {
    const { d } = await open();
    await userEvent.type(
      within(d).getByRole('searchbox', { name: 'Search the player the room is under' }),
      'danish',
    );
    await userEvent.click(
      await within(await screen.findByRole('list', { name: 'Search results' })).findByRole(
        'button',
        {
          name: /^Danish Iqbal/,
        },
      ),
    );
    await userEvent.click(within(d).getByRole('button', { name: 'Change' }));
    expect(
      within(d).getByRole('searchbox', { name: 'Search the player the room is under' }),
    ).toBeInTheDocument();
  });

  it('Room 1 is running, so its start address opens the panel', async () => {
    const view = renderCounter('/room/r1/start');
    await waitFor(() => expect(wherePath(view)).toBe('/table/r1'));
  });

  it('a snooker table has no room start: it goes to its own start', async () => {
    const view = renderCounter('/room/t2/start');
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start'));
  });
});

describe('screen 23: end a room', () => {
  it('Room 1 at 10:15 PM with a 5-minute power cut: 1 h 45 min, − 5 min, Rs 1,500 and 40 minutes at Rs 25 = Rs 2,500', async () => {
    at('2026-10-03T22:15:00+05:00', { scenario: 'roomEnd' });
    renderCounter('/room/r1/end');
    const d = await dialog('End Room 1 for Ali Hassan?');
    // The seed starts Room 1 at 8:29:55 PM (its timer at 9:42 PM is 1:12:05, screen 3); the PNG rounds it to 8:30.
    expect(d).toHaveTextContent('Room 1, started 8:29 PM, Rs 1,500 an hour');
    const rows = within(d)
      .getAllByRole('listitem')
      .map((row) => row.textContent);
    expect(rows).toEqual([
      'Time in the room1 h 45 min',
      'Paused for the power cut, not charged− 5 min',
      'First hour, minimumRs 1,500',
      'Next 40 minutes at Rs 25 a minuteRs 1,000',
    ]);
    expect(d).toHaveTextContent('Goes on Ali Hassan’s bill');
    expect(d).toHaveTextContent('Rs 2,500');
    expect(d).toHaveTextContent('Any paisa is rounded to the nearest rupee.');
    expect(within(d).getByRole('button', { name: 'Keep the room going' })).toBeInTheDocument();
  });

  it('Room 1 at 1:40:00 charges Rs 2,500, and End and charge puts it on Ali Hassan’s bill', async () => {
    at('2026-10-03T22:09:55+05:00');
    const view = renderCounter('/room/r1/end');
    const d = await dialog('End Room 1 for Ali Hassan?');
    expect(d).toHaveTextContent('End and charge Rs 2,500');
    const rows = within(d)
      .getAllByRole('listitem')
      .map((row) => row.textContent);
    expect(rows).toHaveLength(3);
    const before = tonight('ali-hassan');
    await userEvent.click(within(d).getByRole('button', { name: 'End and charge Rs 2,500' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(tonight('ali-hassan')).toBe(before + 2500);
    expect(lines('ali-hassan').find((l) => l.kind === 'room')).toMatchObject({
      charge: 2500,
      text: 'Room 1, 1 h 40 min',
    });
    expect(gameOn('r1')).toBeUndefined();
  });

  it('the first hour is the least: a room kept 6 minutes is Rs 1,500 with no minutes after it', async () => {
    at('2026-10-03T20:36:00+05:00');
    renderCounter('/room/r1/end');
    const d = await dialog('End Room 1 for Ali Hassan?');
    expect(d).toHaveTextContent('End and charge Rs 1,500');
    expect(within(d).queryByText(/^Next /)).toBeNull();
  });

  it('End frame on a room goes to the room screen', async () => {
    const view = renderCounter('/table/r1/end');
    await waitFor(() => expect(wherePath(view)).toBe('/room/r1/end'));
  });

  it('Keep the room going closes it', async () => {
    const view = renderCounter('/room/r1/end');
    await userEvent.click(
      within(await dialog('End Room 1 for Ali Hassan?')).getByRole('button', {
        name: 'Keep the room going',
      }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('r1')?.status).toBe('running');
  });
});

describe('in Urdu', () => {
  it('writes who lost, the prices and the buttons in Urdu with Western digits', async () => {
    at('2026-10-03T21:51:00+05:00');
    setLanguage('ur');
    renderCounter('/table/t1/end');
    const d = await dialog('یہ فریم کس نے ہارا؟');
    expect(d).toHaveTextContent('250 روپے');
    expect(within(d).getByRole('button', { name: 'کھیلنے دیں' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'کوئی ادا نہیں کرے گا' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: /^Bilal Ahmed/ })).toHaveTextContent(
      '600 روپے ادائیگی باقی',
    );
  });
});
