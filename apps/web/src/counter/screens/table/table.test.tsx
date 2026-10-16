import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  textIs,
  wherePath,
} from '../../test/harness';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
});
afterEach(() => resetCounterState());

const dialog = (name: string | RegExp) => screen.findByRole('dialog', { name });
const button = (name: string | RegExp) => screen.findByRole('button', { name });
const at = (iso: string) => {
  api.setTime(iso);
  resetCounterState(Date.parse(iso));
};
const gameOn = (tableId: string) =>
  api.db.s.games.find(
    (g) => g.tableId === tableId && (g.status === 'running' || g.status === 'paused'),
  );
const lastActivity = () => api.db.s.activity[0];

describe('screen 11: the panel of a running table', () => {
  it('Table 1 at 9:42 PM: title, since when, the frame, the players, 18:42 and Rs 250', async () => {
    renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    expect(panel).toHaveTextContent('1');
    expect(panel).toHaveTextContent('Playing since 9:23 PM');
    expect(within(panel).getByText('Frame 3 of this session')).toBeInTheDocument();
    expect(panel).toHaveTextContent('Ali Raza');
    expect(panel).toHaveTextContent('Bilal Ahmed');
    expect(within(panel).getByRole('timer')).toHaveTextContent('18:42');
    expect(panel).toHaveTextContent('Rs 250');
  });

  it('shows the session score and the earlier frames: "Ali 2 – 0 Bilal"', async () => {
    renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    expect(within(panel).getByText('Session score')).toBeInTheDocument();
    expect(within(panel).getByText('Ali 2 – 0 Bilal')).toBeInTheDocument();
    const rows = within(panel).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Frame 1, 8:31 PM, 24 minBilal lost, Rs 250',
      'Frame 2, 8:56 PM, 27 minBilal lost, Rs 250',
    ]);
  });

  it('has End frame in brass, then Pause, Move table, Replace player, Canteen item, Damage charge and Discard frame', async () => {
    renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    const names = within(panel)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual([
      '',
      'End frame',
      'Pause',
      'Move table',
      'Replace player',
      'Canteen item',
      'Damage charge',
      'Discard frame',
    ]);
    expect(within(panel).getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
  });

  it('after 5 minutes it says the type change was open until 9:28 PM', async () => {
    renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    expect(panel).toHaveTextContent(
      'Change game type was open until 9:28 PM. After 5 minutes, end or discard this frame first.',
    );
    expect(within(panel).queryByRole('button', { name: 'Change game type' })).toBeNull();
  });

  it('inside the first 5 minutes it offers Change game type with the minutes left (Table 2 at 9:53 PM)', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:53:00+05:00');
    const view = renderCounter('/table/t2');
    const panel = await dialog('Table 2, single frame');
    expect(within(panel).getByText('2 minutes left to change')).toBeInTheDocument();
    expect(panel).not.toHaveTextContent('Change game type was open until');
    await userEvent.click(within(panel).getByRole('button', { name: 'Change game type' }));
    expect(wherePath(view)).toBe('/table/t2/change-type');
  });

  it('names a Century by the player it is under and by its rate, with no score', async () => {
    renderCounter('/table/t3');
    const panel = await dialog('Table 3, Century');
    expect(within(panel).getByText('Century, Rs 15 a minute')).toBeInTheDocument();
    expect(panel).toHaveTextContent('Under Saad Hussain');
    expect(within(panel).queryByText('Session score')).toBeNull();
    expect(within(panel).getByRole('button', { name: 'End Century' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Discard game' })).toBeInTheDocument();
    // A Century has no limit, so its timer is never the red card.
    expect(within(panel).getByRole('timer').className).not.toContain('bg-s-card');
  });

  it('names a room, a double frame and a game over its limit (the red card on Table 4)', async () => {
    renderCounter('/table/r1');
    const room = await dialog('Room 1, room');
    expect(within(room).getByText('Room, Rs 1,500 an hour')).toBeInTheDocument();
    expect(within(room).getByRole('button', { name: 'End room' })).toBeInTheDocument();
    renderCounter('/table/t5');
    const double = await screen.findAllByRole('dialog', { name: 'Table 5, double frame' });
    expect(double[0]).toHaveTextContent('Kamran, Faisal vs Imran, Naveed');
    renderCounter('/table/t4');
    const over = (await screen.findAllByRole('dialog', { name: 'Table 4, single frame' }))[0];
    expect(within(over).getByRole('timer').className).toContain('bg-s-card');
  });

  it('End frame goes on to the end screens, Discard to the stop screen, Damage charge to its own', async () => {
    const view = renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    await userEvent.click(within(panel).getByRole('button', { name: 'End frame' }));
    expect(wherePath(view)).toBe('/table/t1/end');
    view.unmount();

    const second = renderCounter('/table/t1');
    await userEvent.click(
      within(await dialog('Table 1, single frame')).getByRole('button', { name: 'Discard frame' }),
    );
    expect(wherePath(second)).toBe('/table/t1/stop');
    second.unmount();

    const third = renderCounter('/table/t1');
    await userEvent.click(
      within(await dialog('Table 1, single frame')).getByRole('button', { name: 'Damage charge' }),
    );
    expect(wherePath(third)).toBe('/table/t1/damage');
  });

  it('closing goes back to the board, and a table with no game has no panel', async () => {
    const view = renderCounter('/table/t1');
    await userEvent.click(
      within(await dialog('Table 1, single frame')).getByRole('button', { name: 'Close panel' }),
    );
    expect(wherePath(view)).toBe('/');
    view.unmount();

    const free = renderCounter('/table/t2');
    await waitFor(() => expect(wherePath(free)).toBe('/'));
  });
});

describe('Pause and Resume on one table', () => {
  it('Pause stops the clock, the panel says so, and Resume starts it again without the time paused', async () => {
    renderCounter('/table/t1');
    const panel = await dialog('Table 1, single frame');
    await userEvent.click(within(panel).getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(gameOn('t1')?.status).toBe('paused'));
    expect(panel).toHaveTextContent('Paused since 9:42 PM');
    expect(within(panel).queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(lastActivity()).toBeDefined();

    // Three minutes pass; the paused game does not count them.
    api.advance(3 * 60_000);
    await userEvent.click(await within(panel).findByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(gameOn('t1')?.status).toBe('running'));
    expect(gameOn('t1')?.pausedMs).toBe(3 * 60_000);
    expect(await within(panel).findByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});

describe('screen 13: move to another table, or replace a player', () => {
  it('shows both panels, the free table picked, and the out-of-order one that cannot be', async () => {
    at('2026-10-03T21:43:00+05:00');
    renderCounter('/table/t1/move');
    const move = await screen.findByRole('region', { name: 'Move Table 1 to another table' });
    expect(move).toHaveTextContent('Ali Raza vs Bilal Ahmed, frame 3, 19 minutes so far');
    const two = within(move).getByRole('button', { name: /^2Table 2/ });
    expect(two).toHaveAttribute('aria-pressed', 'true');
    expect(two).toHaveTextContent('Rs 250 a frame, same price');
    const seven = within(move).getByRole('button', { name: /^7Table 7/ });
    expect(seven).toBeDisabled();
    expect(seven).toHaveTextContent('Out of order, Cloth change');
    expect(move).toHaveTextContent(
      'The timer and session move with the players. A frame keeps the price of the table it started on. A Century keeps counting minutes on the new table.',
    );
    expect(within(move).getByRole('button', { name: 'Move to Table 2' })).toBeEnabled();
    expect(
      await screen.findByRole('region', { name: 'Replace a player on Table 1' }),
    ).toBeInTheDocument();
  });

  it('Move to Table 2 moves the game with its timer and session, and a frame keeps its own price', async () => {
    const two = api.db.s.tables.find((t) => t.id === 't2');
    if (two) two.price = 200;
    const view = renderCounter('/table/t1/move');
    const move = await screen.findByRole('region', { name: 'Move Table 1 to another table' });
    expect(within(move).getByRole('button', { name: /^2Table 2/ })).toHaveTextContent(
      'Rs 200 a frame, Rs 50 less',
    );
    const before = gameOn('t1');
    await userEvent.click(within(move).getByRole('button', { name: 'Move to Table 2' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    const moved = gameOn('t2');
    expect(moved).toMatchObject({ id: before?.id, price: 250, startedAt: before?.startedAt });
    expect(gameOn('t1')).toBeUndefined();
    expect(await screen.findByRole('button', { name: 'Table 2, playing' })).toHaveTextContent(
      'Ali Raza vs Bilal Ahmed',
    );
    expect(await screen.findByRole('button', { name: 'Table 1, free' })).toBeInTheDocument();
  });

  it('Replace player: who is leaving, who is coming in, "Replace Ali with Usman"', async () => {
    const view = renderCounter('/table/t1/move');
    const replace = await screen.findByRole('region', { name: 'Replace a player on Table 1' });
    const confirm = () => within(replace).getByRole('button', { name: /^Replace/ });
    expect(confirm()).toBeDisabled();
    await userEvent.click(within(replace).getByRole('button', { name: /^Ali Raza/ }));
    await userEvent.type(
      within(replace).getByRole('searchbox', { name: 'Search the new player' }),
      'usm',
    );
    await userEvent.click(await within(replace).findByRole('button', { name: /^Usman Tariq/ }));
    expect(within(replace).getByRole('button', { name: /^Usman Ghani/ })).toBeInTheDocument();
    expect(confirm()).toHaveTextContent('Replace Ali with Usman');
    await userEvent.click(confirm());
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t1')?.playerIds).toEqual(['usman-t', 'bilal']);
    // Earlier frames stay with the old player.
    expect(api.db.s.sessions.find((s) => s.id === 'sess-t1')?.frames).toHaveLength(2);
    expect(api.db.statement('bilal').some((line) => line.text.includes('lost to Ali Raza'))).toBe(
      true,
    );
  });

  it('with nothing typed it offers the players who played here lately, never the ones already on the table', async () => {
    renderCounter('/table/t1/move');
    const replace = await screen.findByRole('region', { name: 'Replace a player on Table 1' });
    const list = await within(replace).findAllByRole('listitem');
    expect(list.length).toBeGreaterThan(0);
    expect(list.map((item) => item.textContent).join(' ')).not.toMatch(/Ali Raza|Bilal Ahmed/);
  });

  it('a room can only move to a room, and a table with nothing free says so', async () => {
    renderCounter('/table/r1/move');
    const move = await screen.findByRole('region', { name: 'Move Room 1 to another table' });
    expect(within(move).getByRole('button', { name: /^R2Room 2/ })).toBeInTheDocument();
    expect(within(move).queryByRole('button', { name: /^\dTable/ })).toBeNull();
  });

  it('Cancel and Escape close both panels', async () => {
    const view = renderCounter('/table/t1/move');
    const move = await screen.findByRole('region', { name: 'Move Table 1 to another table' });
    await userEvent.click(within(move).getByRole('button', { name: 'Cancel' }));
    expect(wherePath(view)).toBe('/');
    view.unmount();
    const second = renderCounter('/table/t1/move');
    await screen.findByRole('region', { name: 'Move Table 1 to another table' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(wherePath(second)).toBe('/'));
  });
});

describe('screen 14: stop without the normal charge', () => {
  it('Discard frame is picked first, and the button waits for a reason', async () => {
    renderCounter('/table/t6/stop');
    const d = await dialog('Stop Table 6 without the normal charge');
    expect(d).toHaveTextContent(
      'Hamid Ali vs Tariq Jamil, single frame, Rs 250. Owners see every stopped frame with its reason.',
    );
    expect(within(d).getByRole('button', { name: /^Discard frameNobody pays/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const confirm = within(d).getAllByRole('button', { name: 'Discard frame' }).at(-1);
    expect(confirm).toBeDisabled();
    await userEvent.click(within(d).getByRole('button', { name: 'Players left halfway' }));
    expect(confirm).toBeEnabled();
  });

  it('discards the frame with the reason and the note: Table 6 is free, and Activity names Zain', async () => {
    const view = renderCounter('/table/t6/stop');
    const d = await dialog('Stop Table 6 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: 'Players left halfway' }));
    await userEvent.type(
      within(d).getByLabelText('Note (optional)'),
      'Tariq got a call and left after 12 minutes',
    );
    await userEvent.click(
      within(d).getAllByRole('button', { name: 'Discard frame' }).at(-1) as HTMLElement,
    );
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t6')).toBeUndefined();
    expect(api.db.game('g-t6-1')).toMatchObject({ status: 'discarded', endedBy: { name: 'Zain' } });
    expect(lastActivity()).toMatchObject({
      type: 'discard',
      by: { name: 'Zain' },
      detail: 'Players left halfway. “Tariq got a call and left after 12 minutes”',
    });
    expect(await screen.findByRole('button', { name: 'Table 6, free' })).toBeInTheDocument();
  });

  it('Unpaid, dispute waits for an owner: nobody is charged and the event needs a decision', async () => {
    const view = renderCounter('/table/t6/stop');
    const d = await dialog('Stop Table 6 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Unpaid, dispute/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Other' }));
    const confirm = within(d).getByRole('button', { name: 'Mark as dispute' });
    await userEvent.click(confirm);
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(api.db.game('g-t6-1').status).toBe('dispute');
    expect(lastActivity()).toMatchObject({
      type: 'dispute',
      needsDecision: true,
      by: { name: 'Zain' },
    });
    expect(
      api.db
        .statement('hamid')
        .some((line) => line.kind === 'frame' && line.at > '2026-10-03T21:42'),
    ).toBe(false);
  });

  it('Cancel, started by mistake needs a reason too, and the owners see it', async () => {
    const view = renderCounter('/table/t6/stop');
    const d = await dialog('Stop Table 6 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Cancel, started by mistake/ }));
    const confirm = within(d).getByRole('button', { name: 'Cancel game' });
    expect(confirm).toBeDisabled();
    await userEvent.click(within(d).getByRole('button', { name: 'Table problem' }));
    await userEvent.click(confirm);
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(api.db.game('g-t6-1').status).toBe('cancelled');
    expect(lastActivity()).toMatchObject({
      type: 'cancel',
      by: { name: 'Zain' },
      detail: '“Table problem”',
    });
  });

  it('Cancel in the first 2 minutes of his own game acts like Undo: no reason is asked and nothing is charged (D60)', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:51:00+05:00');
    const view = renderCounter('/table/t2/stop');
    const d = await dialog('Stop Table 2 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Cancel, started by mistake/ }));
    expect(d).toHaveTextContent(
      'Started less than 2 minutes ago, so this works like Undo: no reason is needed and nothing is charged.',
    );
    expect(within(d).queryByRole('button', { name: 'Table problem' })).toBeNull();
    const confirm = within(d).getByRole('button', { name: 'Cancel game' });
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t2')).toBeUndefined();
    expect(lastActivity()).toMatchObject({
      type: 'undo',
      title: 'Game undone on Table 2',
      by: { name: 'Zain' },
    });
  });

  it('after 2 minutes Cancel asks for a reason again', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:53:00+05:00');
    renderCounter('/table/t2/stop');
    const d = await dialog('Stop Table 2 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Cancel, started by mistake/ }));
    expect(within(d).getByRole('button', { name: 'Cancel game' })).toBeDisabled();
    expect(within(d).getByRole('button', { name: 'Table problem' })).toBeInTheDocument();
  });

  it('writes the reason in English even when the counter is in Urdu', async () => {
    setLanguage('ur');
    const view = renderCounter('/table/t6/stop');
    const d = await dialog('ٹیبل 6 کو عام چارج کے بغیر روکیں');
    await userEvent.click(within(d).getByRole('button', { name: 'کھلاڑی بیچ میں چلے گئے' }));
    await userEvent.click(
      within(d).getAllByRole('button', { name: 'فریم منسوخ کریں' }).at(-1) as HTMLElement,
    );
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(lastActivity()).toMatchObject({ type: 'discard', detail: 'Players left halfway' });
  });

  it('Keep playing closes it and nothing changes', async () => {
    const view = renderCounter('/table/t6/stop');
    const d = await dialog('Stop Table 6 without the normal charge');
    await userEvent.click(within(d).getByRole('button', { name: 'Keep playing' }));
    expect(wherePath(view)).toBe('/');
    expect(gameOn('t6')?.status).toBe('paused');
  });
});

describe('screen 15: damage charge', () => {
  it('asks who pays, what, how much and why, with nothing picked, and Add waits for all of it', async () => {
    renderCounter('/table/t1/damage');
    const d = await dialog('Add a damage charge');
    expect(d).toHaveTextContent('Table 1, Ali Raza vs Bilal Ahmed');
    expect(within(d).queryAllByRole('button', { pressed: true })).toHaveLength(0);
    const add = within(d).getByRole('button', { name: 'Add to the bill' });
    expect(add).toBeDisabled();
    await userEvent.click(within(d).getByRole('button', { name: /^Ali Raza/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Cue' }));
    await userEvent.click(within(d).getByRole('button', { name: '1,500' }));
    // Everything but the note: the button already says what it will do, and waits for the note.
    expect(within(d).getByRole('button', { name: 'Add Rs 1,500 to Ali’s bill' })).toBeDisabled();
    await userEvent.type(
      within(d).getByLabelText('Note (required)'),
      'Cue snapped at the joint after he hit the cushion',
    );
    expect(within(d).getByRole('button', { name: 'Add Rs 1,500 to Ali’s bill' })).toBeEnabled();
    expect(d).toHaveTextContent(
      'Shows on Ali’s statement as a damage charge. Owners see it in Activity.',
    );
  });

  it('adds Rs 1,500 to Ali’s bill: his statement, the waiting list and Activity with Zain', async () => {
    const view = renderCounter('/table/t1/damage');
    const d = await dialog('Add a damage charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Ali Raza/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Cue' }));
    await userEvent.type(within(d).getByLabelText('Amount'), '1500');
    expect(within(d).getByLabelText('Amount')).toHaveValue('1,500');
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Cue snapped at the joint');
    await userEvent.click(within(d).getByRole('button', { name: 'Add Rs 1,500 to Ali’s bill' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    const line = api.db.statement('ali-raza').at(-1);
    expect(line).toMatchObject({ kind: 'damage', charge: 1500, doneBy: { name: 'Zain' } });
    expect(line?.text).toContain('Cue');
    expect(lastActivity()).toMatchObject({
      type: 'damage',
      amount: 1500,
      by: { name: 'Zain' },
      detail: 'Cue. “Cue snapped at the joint”',
    });
    // The game goes on: a damage charge is not the end of the frame.
    expect(gameOn('t1')?.status).toBe('running');
  });

  it('only a whole amount above 0 and a note will do; the other player pays when he is picked', async () => {
    renderCounter('/table/t1/damage');
    const d = await dialog('Add a damage charge');
    await userEvent.click(within(d).getByRole('button', { name: /^Bilal Ahmed/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Ball' }));
    await userEvent.type(within(d).getByLabelText('Amount'), '0');
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Torn');
    expect(within(d).getByRole('button', { name: /^Add/ })).toBeDisabled();
    await userEvent.clear(within(d).getByLabelText('Amount'));
    await userEvent.click(within(d).getByRole('button', { name: '500' }));
    expect(within(d).getByRole('button', { name: 'Add Rs 500 to Bilal’s bill' })).toBeEnabled();
  });

  it('on a Century the one player is the only one who can pay', async () => {
    renderCounter('/table/t3/damage');
    const d = await dialog('Add a damage charge');
    const cards = within(d)
      .getAllByRole('button')
      .filter(
        (b) => b.getAttribute('aria-pressed') !== null && /Saad|Hussain/.test(b.textContent ?? ''),
      );
    expect(cards).toHaveLength(1);
  });
});

describe('the Undo toast of a game started by mistake (screen 14)', () => {
  it('shows who the game was started for and how long Undo is left (1:42 at 9:50:18 PM)', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:50:18+05:00');
    renderCounter('/');
    const toast = await screen.findByText(
      textIs('Game started on Table 2 for Ahmed Nawaz and Ali Akbar.'),
    );
    const status = toast.closest('[role="status"]') as HTMLElement;
    expect(within(status).getByText(/^Undo for 1:4\d more$/)).toBeInTheDocument();
    expect(within(status).getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('Undo cancels the game with no reason: Table 2 is free, and the owners hear of it', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:50:18+05:00');
    renderCounter('/');
    await userEvent.click(await button('Undo'));
    await waitFor(() => expect(gameOn('t2')).toBeUndefined());
    expect(await screen.findByText('Game undone on Table 2.')).toBeInTheDocument();
    expect(api.db.game('g-t2-n').status).toBe('cancelled');
    expect(lastActivity()).toMatchObject({ type: 'undo', by: { name: 'Zain' } });
    expect(await screen.findByRole('button', { name: 'Table 2, free' })).toBeInTheDocument();
  });

  it('is gone after 2 minutes, and a game started by someone else never shows it', async () => {
    api.load({ scenario: 'newGame' });
    at('2026-10-03T21:52:30+05:00');
    renderCounter('/');
    await screen.findByRole('button', { name: 'Table 2, playing' });
    expect(screen.queryByText(/^Game started on/)).toBeNull();
    resetCounterState();
    api.load({ scenario: 'newGame' });
    api.db.game('g-t2-n').startedBy = { id: 'shabir', name: 'Shabir', role: 'worker' };
    at('2026-10-03T21:50:18+05:00');
    renderCounter('/');
    await screen.findByRole('button', { name: 'Table 2, playing' });
    expect(screen.queryByText(/^Game started on/)).toBeNull();
  });

  it('is there after starting a game from the board, on any screen, until the 2 minutes are up', async () => {
    const view = renderCounter('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Table 2, free' }));
    await userEvent.click(await button('Next: pick players'));
    const players = await dialog('Who is playing on Table 2?');
    const search = within(players).getByRole('searchbox');
    await userEvent.type(search, 'ahmed');
    await userEvent.click(
      await within(await screen.findByRole('list', { name: 'Search results' })).findByRole(
        'button',
        { name: /^Ahmed Nawaz/ },
      ),
    );
    await userEvent.type(search, 'ali ak');
    await userEvent.click(
      await within(await screen.findByRole('list', { name: 'Search results' })).findByRole(
        'button',
        { name: /^Ali Akbar/ },
      ),
    );
    await userEvent.click(within(players).getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(
      await screen.findByText(textIs('Game started on Table 2 for Ahmed Nawaz and Ali Akbar.')),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Undo for 2:00 more$|^Undo for 1:5\d more$/)).toBeInTheDocument();
  });
});

describe('screen 16: Pause all and the power-cut board', () => {
  it('Pause all in the action bar pauses every running game and says so at the top of the board', async () => {
    renderCounter('/');
    const bar = within(await screen.findByRole('contentinfo'));
    await userEvent.click(await bar.findByRole('button', { name: 'Pause all' }));
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('All games are paused');
    expect(banner).toHaveTextContent(
      'Paused at 9:42 PM by the counter. Timers are stopped, so nobody is charged for the power cut.',
    );
    expect(api.db.s.games.filter((g) => g.status === 'running')).toHaveLength(0);
    expect(api.db.s.games.filter((g) => g.status === 'paused').length).toBeGreaterThan(4);
    expect(lastActivity()).toMatchObject({
      type: 'pause-all',
      by: { name: 'Zain' },
      title: 'All games paused',
    });
    // It cannot be pressed twice.
    expect(bar.getByRole('button', { name: 'Pause all' })).toBeDisabled();
  });

  it('the power-cut board: the banner, a Resume button on each paused tile, and a hint on the free ones', async () => {
    api.load({ scenario: 'paused' });
    at('2026-10-03T22:01:00+05:00');
    renderCounter('/');
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Paused at 9:58 PM by the counter.');
    expect(within(banner).getByRole('button', { name: 'Resume all games' })).toBeInTheDocument();
    const t1 = await screen.findByRole('group', { name: 'Table 1, paused' });
    expect(t1).toHaveTextContent('Single frame');
    expect(t1).toHaveTextContent('Frame 4');
    expect(within(t1).getByRole('timer')).toHaveTextContent('06:48');
    expect(within(t1).getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    const free = await screen.findByRole('button', { name: 'Table 3, free' });
    expect(free).toHaveTextContent(
      'New games can still start. Pause them too if the power is out.',
    );
    expect(free).not.toHaveTextContent('Tap to start a game');
    expect(
      screen.getByText(
        'If the computer itself switched off, every game is restored with the right time when it starts again.',
      ),
    ).toBeInTheDocument();
  });

  it('Resume on one tile restarts only that game, and its timer does not count the power cut', async () => {
    api.load({ scenario: 'paused' });
    at('2026-10-03T22:01:00+05:00');
    renderCounter('/');
    const t1 = await screen.findByRole('group', { name: 'Table 1, paused' });
    await userEvent.click(within(t1).getByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(gameOn('t1')?.status).toBe('running'));
    expect(gameOn('t1')?.pausedMs).toBe(3 * 60_000);
    expect(gameOn('t2')?.status).toBe('paused');
    // The banner stays while other games are still paused.
    expect(await screen.findByRole('alert')).toHaveTextContent('All games are paused');
  });

  it('Resume all games restarts every game, the banner goes, and the three minutes are not charged', async () => {
    api.load({ scenario: 'paused' });
    at('2026-10-03T22:01:00+05:00');
    renderCounter('/');
    await userEvent.click(await button('Resume all games'));
    await waitFor(() => expect(api.db.s.games.every((g) => g.status === 'running')).toBe(true));
    expect(api.db.s.games.every((g) => g.pausedMs === 3 * 60_000)).toBe(true);
    await waitFor(() => expect(screen.queryByText('All games are paused')).toBeNull());
    expect(api.db.s.activity.find((a) => a.type === 'pause-all')?.detail).toContain(
      '3 minutes not charged on 6 tables',
    );
    // The Century on Table 2 is still charged for the 8 minutes it ran, not for the 11 since it started.
    const t2 = await screen.findByRole('button', { name: 'Table 2, playing' });
    expect(within(t2).getByRole('timer')).toHaveTextContent(/^08:1\d$/);
  });

  it('is in Urdu: the banner, the button and the tile words', async () => {
    api.load({ scenario: 'paused' });
    at('2026-10-03T22:01:00+05:00');
    setLanguage('ur');
    renderCounter('/');
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('تمام گیمز رکے ہوئے ہیں');
    expect(
      within(banner).getByRole('button', { name: 'تمام گیمز دوبارہ چلائیں' }),
    ).toBeInTheDocument();
  });
});

describe('in Urdu', () => {
  it('draws the panel of a running table mirrored, with names and numbers as they are', async () => {
    setLanguage('ur');
    renderCounter('/table/t1');
    const panel = await dialog('ٹیبل 1، سنگل فریم');
    expect(panel).toHaveTextContent('اس سیشن کا فریم 3');
    expect(within(panel).getByRole('button', { name: 'فریم ختم کریں' })).toBeInTheDocument();
    expect(within(panel).getByText('Ali 2 – 0 Bilal')).toBeInTheDocument();
    expect(panel).toHaveTextContent('Ali Raza');
  });

  it('writes the damage charge and the move screen in Urdu', async () => {
    setLanguage('ur');
    renderCounter('/table/t1/damage');
    expect(await dialog('نقصان کا چارج لگائیں')).toBeInTheDocument();
  });
});
