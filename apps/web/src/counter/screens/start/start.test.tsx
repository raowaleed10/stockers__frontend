import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { markOutOfOrder } from '@/mocks/db/board';
import { changeGameType } from '@/mocks/db/games';
import { createTestApi } from '@/mocks/test-server';
import {
  renderCounter,
  resetCounterState,
  setLanguage,
  startCounterTests,
  wherePath,
} from '../../test/harness';
import { useStartDraft } from '../../start/draft';

const api = createTestApi();
beforeAll(() => startCounterTests(api), 30_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load();
  resetCounterState();
  useStartDraft.getState().reset();
});
afterEach(() => {
  resetCounterState();
  useStartDraft.getState().reset();
});

const dialog = (name: string | RegExp) => screen.findByRole('dialog', { name });
const button = (name: string | RegExp) => screen.findByRole('button', { name });
const searchBox = (name = 'Search players by name or phone') =>
  screen.findByRole('searchbox', { name });

/** A search result (not a "Played here recently" chip): the buttons of the results list. */
const result = async (who: RegExp, list = 'Search results') =>
  within(await screen.findByRole('list', { name: list })).findByRole('button', { name: who });

/** Types in the search box and taps the result that starts with `who`. */
async function pickByTyping(typed: string, who: RegExp, box?: string) {
  const search = await searchBox(box);
  await userEvent.clear(search);
  await userEvent.type(search, typed);
  await userEvent.click(await result(who));
}

/** The game on a table in the mock store. */
const gameOn = (tableId: string) =>
  api.db.s.games.find(
    (g) => g.tableId === tableId && (g.status === 'running' || g.status === 'paused'),
  );

describe('screen 7: start a game, choose the type', () => {
  it('says Table 2 is free and prices the three choices from the table (Rs 250, Rs 500, Rs 15 a minute)', async () => {
    renderCounter('/table/t2/start');
    const d = await dialog('Table 2 is free');
    expect(within(d).getByText('What are they playing?')).toBeInTheDocument();
    const single = within(d).getByRole('button', { name: /^Single frame/ });
    const double = within(d).getByRole('button', { name: /^Double frame/ });
    const century = within(d).getByRole('button', { name: /^Century/ });
    expect(single).toHaveTextContent('Two players. When the frame ends, the loser pays.');
    expect(single).toHaveTextContent('Rs 250');
    expect(double).toHaveTextContent(
      'Two against two, or one against two. The losing side splits it.',
    );
    expect(double).toHaveTextContent('Rs 500');
    expect(century).toHaveTextContent('Charged by the minute under one player.');
    expect(century).toHaveTextContent('Rs 15 a minute');
    // A frame is the first choice, so a worker can go straight on.
    expect(single).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts the Century rate at the owners’ price, and only changes while Century is picked', async () => {
    renderCounter('/table/t2/start');
    const d = await dialog('Table 2 is free');
    const rate = within(d).getByRole('textbox', { name: 'Century rate for this game' });
    const raise = within(d).getByRole('button', { name: 'Raise rate by 1 rupee' });
    const lower = within(d).getByRole('button', { name: 'Lower rate by 1 rupee' });
    expect(rate).toHaveValue('15');
    // With a frame picked the rate row is there but cannot be changed.
    expect(rate).toBeDisabled();
    expect(raise).toBeDisabled();

    await userEvent.click(within(d).getByRole('button', { name: /^Century/ }));
    expect(rate).toBeEnabled();
    await userEvent.click(raise);
    await userEvent.click(raise);
    expect(rate).toHaveValue('17');
    expect(within(d).getByRole('button', { name: /^Century/ })).toHaveTextContent('Rs 17 a minute');
    await userEvent.click(lower);
    expect(rate).toHaveValue('16');
    // Typing a number works too, and an emptied box goes back to the rate when it loses focus.
    await userEvent.clear(rate);
    await userEvent.type(rate, '20');
    expect(within(d).getByRole('button', { name: /^Century/ })).toHaveTextContent('Rs 20 a minute');
    await userEvent.clear(rate);
    await userEvent.tab();
    expect(rate).toHaveValue('20');
  });

  it('Next: pick players goes to the two players for a frame and to the sides for a double', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button('Next: pick players'));
    expect(wherePath(view)).toBe('/table/t2/start/players');
    expect(await dialog('Who is playing on Table 2?')).toBeInTheDocument();
    view.unmount();

    const second = renderCounter('/table/t2/start');
    await userEvent.click(await button(/^Double frame/));
    await userEvent.click(await button('Next: pick players'));
    expect(wherePath(second)).toBe('/table/t2/start/double');
    expect(await dialog('Double frame on Table 2')).toBeInTheDocument();
  });

  it('Cancel, the × and Escape all go back to the board', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button('Cancel'));
    expect(wherePath(view)).toBe('/');
    view.unmount();

    const second = renderCounter('/table/t2/start');
    await dialog('Table 2 is free');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(wherePath(second)).toBe('/'));
  });

  it('Mark out of order asks for a note, and the table is grey on the board with it', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button('Mark out of order'));
    expect(wherePath(view)).toBe('/table/t2/start/out-of-order');
    const d = await dialog('Mark Table 2 out of order');
    const confirm = within(d).getByRole('button', { name: 'Mark out of order' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Cloth change');
    await userEvent.click(confirm);
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(
      await screen.findByRole('button', { name: 'Table 2, out of order' }),
    ).toBeInTheDocument();
    const table = api.db.s.tables.find((t) => t.id === 't2');
    expect(table?.outOfOrder).toMatchObject({ note: 'Cloth change', by: { name: 'Zain' } });
    // The counter's bell says it, with the note.
    expect(api.db.s.counterAlerts[0]).toMatchObject({
      kind: 'out-of-order',
      title: 'Table 2 marked out of order by Zain',
      text: 'Cloth change',
    });
  });

  it('a table with no price says why and cannot start', async () => {
    renderCounter('/board/pool/table/po1/start');
    const d = await dialog('Pool table 1 has no price yet');
    expect(within(d).getByText('Locked until an owner sets the price')).toBeInTheDocument();
    expect(within(d).queryByRole('button', { name: 'Next: pick players' })).not.toBeInTheDocument();
  });

  it('a grey table that an owner marked says so and has no way to put it back (D60)', async () => {
    renderCounter('/table/t7/back-in-order');
    const d = await dialog('Table 7 is out of order');
    expect(d).toHaveTextContent('Cloth change. Marked by Adil at 4:15 PM');
    expect(d).toHaveTextContent('Adil marked this table. Only an owner can put it back.');
    expect(within(d).queryByRole('button', { name: 'Put back in order' })).toBeNull();
    expect(within(d).queryByRole('textbox')).toBeNull();
  });

  it('a worker taps a grey table that a worker marked, writes a note and puts it back in order', async () => {
    markOutOfOrder(api.db, { id: 'shabir', name: 'Shabir', role: 'worker' }, 't2', 'Cloth change');
    const view = renderCounter('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Table 2, out of order' }));
    expect(wherePath(view)).toBe('/table/t2/back-in-order');
    const d = await dialog('Table 2 is out of order');
    const confirm = within(d).getByRole('button', { name: 'Put back in order' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Cloth changed');
    await userEvent.click(confirm);
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(await screen.findByRole('button', { name: 'Table 2, free' })).toBeInTheDocument();
    expect(api.db.table('t2').outOfOrder).toBeUndefined();
    expect(api.db.s.activity[0]).toMatchObject({
      type: 'out-of-order',
      title: 'Table 2 put back in order',
      by: { name: 'Zain' },
    });
  });

  it('a table that is in order has nothing to put back and goes to the board', async () => {
    const view = renderCounter('/table/t2/back-in-order');
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });

  it('/start on a grey table goes to the put-back dialog', async () => {
    const view = renderCounter('/table/t7/start');
    await waitFor(() => expect(wherePath(view)).toBe('/table/t7/back-in-order'));
  });

  it('a table in use goes to the running game, and a room to its own start', async () => {
    const view = renderCounter('/table/t1/start');
    await waitFor(() => expect(wherePath(view)).toBe('/table/t1'));
    view.unmount();
    const room = renderCounter('/table/r2/start');
    await waitFor(() => expect(wherePath(room)).toBe('/room/r2/start'));
  });

  it('a table that does not exist is "Page not found" in a dialog', async () => {
    renderCounter('/table/t99/start');
    expect(await dialog('Page not found')).toBeInTheDocument();
  });
});

describe('screen 8: pick the players, then Start game', () => {
  it('Table 2, Single frame, Ahmed Nawaz and Ali Akbar, Start: Table 2 plays under Zain from 0:00', async () => {
    const view = renderCounter('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Table 2, free' }));
    await userEvent.click(await button('Next: pick players'));
    const d = await dialog('Who is playing on Table 2?');
    expect(within(d).getByText('Single frame, Rs 250. The loser pays.')).toBeInTheDocument();
    expect(within(d).getByText('Step 2 of 2')).toBeInTheDocument();
    const start = within(d).getByRole('button', { name: 'Start game' });
    expect(start).toBeDisabled();

    await pickByTyping('ahmed', /^Ahmed Nawaz/);
    // He is in the first slot with his masked phone number, and the second slot is the one asking.
    expect(within(d).getByText('Player 1')).toBeInTheDocument();
    expect(within(d).getByText('0333 •••• 2209')).toBeInTheDocument();
    expect(within(d).getByText('Player 2')).toBeInTheDocument();
    expect(start).toBeDisabled();

    await pickByTyping('ali ak', /^Ali Akbar/);
    expect(start).toBeEnabled();
    await userEvent.click(start);

    await waitFor(() => expect(wherePath(view)).toBe('/'));
    const tile = await screen.findByRole('button', { name: 'Table 2, playing' });
    expect(tile).toHaveTextContent('Ahmed Nawaz vs Ali Akbar');
    expect(within(tile).getByRole('timer')).toHaveTextContent('0:0');
    const game = gameOn('t2');
    expect(game).toMatchObject({
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
      startedBy: { name: 'Zain' },
      price: 250,
    });
    // The draft is cleared: starting the next game begins empty.
    expect(useStartDraft.getState().players).toEqual([]);
  });

  it('shows the phone number with each result and one plain line: last played, owes, or where he plays', async () => {
    api.setTime('2026-10-03T21:46:00+05:00');
    renderCounter('/table/t2/start/players');
    await dialog('Who is playing on Table 2?');
    const search = await searchBox();
    await userEvent.type(search, 'ali');
    const akbar = await result(/^Ali Akbar/);
    expect(akbar).toHaveTextContent('0300 •••• 1187');
    expect(akbar).toHaveTextContent('Last played Thursday');
    expect(await result(/^Ali Haider/)).toHaveTextContent('Owes Rs 1,200');
    expect(await result(/^Ali Raza/)).toHaveTextContent('Playing on Table 1');
    expect(await result(/^Ali Hassan/)).toHaveTextContent('In Room 1');
  });

  it('puts the names that start with the text first, free players before the ones playing', async () => {
    renderCounter('/table/t2/start/players');
    await dialog('Who is playing on Table 2?');
    await userEvent.type(await searchBox(), 'ali');
    await result(/^Ali Akbar/);
    const list = screen.getByRole('list', { name: 'Search results' });
    const names = within(list)
      .getAllByRole('button')
      .map((b) => b.querySelector('span > span')?.textContent);
    expect(names.slice(0, 5)).toEqual([
      'Ali Akbar',
      'Ali Haider',
      'Ali Shah',
      'Ali Raza',
      'Ali Hassan',
    ]);
    // "ali" starts a word of Hamid Ali and Rizwan Ali, but is only inside Malik.
    expect(names.slice(5).sort()).toEqual(['Hamid Ali', 'Rizwan Ali']);
    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('7 found');
  });

  it('finds a player by the last digits of his phone number', async () => {
    renderCounter('/table/t2/start/players');
    await dialog('Who is playing on Table 2?');
    await userEvent.type(await searchBox(), '2209');
    expect(await result(/^Ahmed Nawaz/)).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('1 found');
  });

  it('"Played here recently" lists the last eight players, and a tap fills the next slot', async () => {
    renderCounter('/table/t2/start/players');
    const d = await dialog('Who is playing on Table 2?');
    const recent = await within(d).findByRole('region', { name: 'Played here recently' });
    const chips = within(recent).getAllByRole('button');
    expect(chips).toHaveLength(8);
    expect(
      within(recent).getByText('Same name? Check the last digits of the phone number.'),
    ).toBeInTheDocument();
    const firstName = chips[0].querySelector('span')?.textContent ?? '';
    await userEvent.click(chips[0]);
    expect(within(d).getByTestId('slot-filled')).toHaveTextContent(firstName);
    // He is not offered again.
    expect(within(recent).queryByRole('button', { name: new RegExp(`^${firstName}`) })).toBeNull();
  });

  it('the ✕ takes a player out of his slot', async () => {
    renderCounter('/table/t2/start/players');
    const d = await dialog('Who is playing on Table 2?');
    await pickByTyping('ahmed', /^Ahmed Nawaz/);
    await userEvent.click(within(d).getByRole('button', { name: 'Remove Ahmed Nawaz' }));
    expect(within(d).queryByTestId('slot-filled')).toBeNull();
  });

  it('a Century needs one player, and charges the rate set on screen 7', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button(/^Century/));
    await userEvent.click(await button('Raise rate by 1 rupee'));
    await userEvent.click(await button('Next: pick players'));
    const d = await dialog('Who is playing on Table 2?');
    expect(
      within(d).getByText('Century, Rs 16 a minute. Charged under one player.'),
    ).toBeInTheDocument();
    expect(within(d).queryByText('Player 2')).toBeNull();
    await pickByTyping('saad', /^Saad Hussain/);
    await userEvent.click(within(d).getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t2')).toMatchObject({ type: 'century', underPlayerId: 'saad', price: 16 });
  });

  it('a Century at the owners’ price sends no rate of its own', async () => {
    renderCounter('/table/t2/start');
    await userEvent.click(await button(/^Century/));
    await userEvent.click(await button('Next: pick players'));
    await dialog('Who is playing on Table 2?');
    await pickByTyping('saad', /^Saad Hussain/);
    await userEvent.click(await button('Start game'));
    await waitFor(() => expect(gameOn('t2')).toBeDefined());
    expect(gameOn('t2')?.price).toBe(15);
  });

  it('Back goes to the type, with the choice kept', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button(/^Century/));
    await userEvent.click(await button('Next: pick players'));
    await dialog('Who is playing on Table 2?');
    await userEvent.click(await button('Back to game type'));
    expect(wherePath(view)).toBe('/table/t2/start');
    expect(await button(/^Century/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('a refusal from the server is said under the form and nothing starts', async () => {
    renderCounter('/table/t2/start/players');
    const d = await dialog('Who is playing on Table 2?');
    await pickByTyping('ahmed', /^Ahmed Nawaz/);
    await pickByTyping('ali ak', /^Ali Akbar/);
    // Someone else starts Table 2 first.
    api.db.s.games.push({
      id: 'g-race',
      tableId: 't2',
      sheetId: 's48',
      type: 'century',
      status: 'running',
      startedAt: '2026-10-03T21:45:00+05:00',
      startedBy: { id: 'zain', name: 'Zain', role: 'worker' },
      pausedMs: 0,
      price: 15,
      underPlayerId: 'saad',
    });
    await userEvent.click(within(d).getByRole('button', { name: 'Start game' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent('Table 2 is in use.');
  });
});

describe('screen 9: a double frame, two sides', () => {
  it('three players make a double: side A has two, side B has one, and the note names who is alone', async () => {
    const view = renderCounter('/table/t2/start');
    await userEvent.click(await button(/^Double frame/));
    await userEvent.click(await button('Next: pick players'));
    const d = await dialog('Double frame on Table 2');
    expect(
      within(d).getByText('Rs 500 for the frame. The losing side splits it.'),
    ).toBeInTheDocument();
    const start = within(d).getByRole('button', { name: 'Start double frame' });
    expect(start).toBeDisabled();

    const box = 'Search a name or phone for side A';
    await pickByTyping('ahmed', /^Ahmed Nawaz/, box);
    await pickByTyping('ali ak', /^Ali Akbar/, 'Search a name or phone for side A');
    // Side A is full, so the next player goes to side B.
    await screen.findByRole('searchbox', { name: 'Search a name or phone for side B' });
    expect(start).toBeDisabled();
    await pickByTyping('imran', /^Imran Shah/, 'Search a name or phone for side B');
    expect(
      within(d).getByText(
        'Three players count as a double. If Imran plays alone and loses, he pays the full Rs 500. You can change the split when the frame ends.',
      ),
    ).toBeInTheDocument();
    expect(start).toBeEnabled();
    await userEvent.click(start);

    await waitFor(() => expect(wherePath(view)).toBe('/'));
    const tile = await screen.findByRole('button', { name: 'Table 2, playing' });
    expect(tile).toHaveTextContent('Double frame');
    expect(gameOn('t2')).toMatchObject({
      type: 'double',
      sides: [['ahmed-nawaz', 'ali-akbar'], ['imran']],
      price: 500,
      startedBy: { name: 'Zain' },
    });
  });

  it('two players, one on each side, are a single frame, not a double: Start stays off until there are three', async () => {
    renderCounter('/table/t2/start/double');
    const d = await dialog('Double frame on Table 2');
    await pickByTyping('ahmed', /^Ahmed Nawaz/, 'Search a name or phone for side A');
    // Imran goes to side B: one against one.
    await userEvent.click(within(d).getByRole('button', { name: 'Side B' }));
    await pickByTyping('imran', /^Imran Shah/, 'Search a name or phone for side B');
    expect(within(d).getAllByTestId('slot-filled')).toHaveLength(2);
    expect(within(d).getByRole('button', { name: 'Start double frame' })).toBeDisabled();
    // A third player makes it a double.
    await pickByTyping('naveed', /^Naveed Akhtar/, 'Search a name or phone for side B');
    expect(within(d).getByRole('button', { name: 'Start double frame' })).toBeEnabled();
  });

  it('four players: two against two. Tapping a side header picks the side the next player goes to', async () => {
    renderCounter('/table/t2/start/double');
    const d = await dialog('Double frame on Table 2');
    await userEvent.click(within(d).getByRole('button', { name: 'Side B' }));
    await screen.findByRole('searchbox', { name: 'Search a name or phone for side B' });
    await pickByTyping('imran', /^Imran Shah/, 'Search a name or phone for side B');
    await pickByTyping('naveed', /^Naveed Akhtar/, 'Search a name or phone for side B');
    // Side B is full: the next player goes to side A.
    await pickByTyping('ahmed', /^Ahmed Nawaz/, 'Search a name or phone for side A');
    await pickByTyping('ali ak', /^Ali Akbar/, 'Search a name or phone for side A');
    await userEvent.click(within(d).getByRole('button', { name: 'Start double frame' }));
    await waitFor(() => expect(gameOn('t2')).toBeDefined());
    expect(gameOn('t2')?.sides).toEqual([
      ['ahmed-nawaz', 'ali-akbar'],
      ['imran', 'naveed'],
    ]);
  });

  it('the ✕ takes a player off his side', async () => {
    renderCounter('/table/t2/start/double');
    const d = await dialog('Double frame on Table 2');
    await pickByTyping('ahmed', /^Ahmed Nawaz/, 'Search a name or phone for side A');
    await userEvent.click(within(d).getByRole('button', { name: 'Remove Ahmed Nawaz' }));
    expect(within(d).queryByTestId('slot-filled')).toBeNull();
  });
});

describe('screen 10: add a new player', () => {
  it('"Add “Zed” as a new player" opens the form with the name, and Skip phone brings him back picked', async () => {
    const view = renderCounter('/table/t2/start/players');
    await dialog('Who is playing on Table 2?');
    await userEvent.type(await searchBox(), 'zed khan');
    await userEvent.click(await button('Add “zed khan” as a new player'));
    expect(wherePath(view)).toBe('/players/new?for=t2');
    const d = await dialog('Add a new player');
    expect(within(d).getByLabelText('Full name')).toHaveValue('Zed Khan');

    await userEvent.click(within(d).getByRole('button', { name: 'Skip phone for now' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/players'));
    const slot = await screen.findByTestId('slot-filled');
    expect(slot).toHaveTextContent('Zed Khan');
    const saved = api.db.s.players.find((p) => p.name === 'Zed Khan');
    expect(saved).toBeDefined();
    expect(saved?.phone).toBeUndefined();
  });

  it('a phone number is typed on the keypad, shown as 0302 81, and saved when it is whole', async () => {
    const view = renderCounter('/players/new?for=t2');
    const d = await dialog('Add a new player');
    await userEvent.type(within(d).getByLabelText('Full name'), 'Ali Shahzad');
    const phone = within(d).getByLabelText(/^Phone number/);
    for (const digit of '030281')
      await userEvent.click(within(d).getByRole('button', { name: digit }));
    expect(phone).toHaveValue('0302 81');
    // The last digit can be deleted.
    await userEvent.click(within(d).getByRole('button', { name: 'Delete last digit' }));
    expect(phone).toHaveValue('0302 8');
    await userEvent.click(within(d).getByRole('button', { name: '1' }));

    // Not a whole number yet: Add player asks for the rest and saves nothing.
    await userEvent.click(within(d).getByRole('button', { name: 'Add player' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent(
      'Type the whole number, or tap “Skip phone for now”.',
    );
    expect(api.db.s.players.some((p) => p.name === 'Ali Shahzad')).toBe(false);

    for (const digit of '234567')
      await userEvent.click(within(d).getByRole('button', { name: digit }));
    expect(phone).toHaveValue('0302 8123456');
    await userEvent.click(within(d).getByRole('button', { name: 'Add player' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/players'));
    expect(api.db.s.players.find((p) => p.name === 'Ali Shahzad')?.phone).toBe('0302 8123456');
    // The new player is in the first slot, with his number masked.
    expect(await screen.findByTestId('slot-filled')).toHaveTextContent('0302 •••• 3456');
  });

  it('a number stops at 11 digits, and Add player waits for a name', async () => {
    renderCounter('/players/new?for=t2');
    const d = await dialog('Add a new player');
    for (const digit of '030212345678')
      await userEvent.click(within(d).getByRole('button', { name: digit }));
    expect(within(d).getByLabelText(/^Phone number/)).toHaveValue('0302 1234567');
    expect(within(d).getByRole('button', { name: 'Add player' })).toBeDisabled();
    expect(within(d).getByRole('button', { name: 'Skip phone for now' })).toBeDisabled();
  });

  it('lists saved names that look like the new one, and a tap uses that player instead', async () => {
    const view = renderCounter('/players/new?for=t2');
    const d = await dialog('Add a new player');
    expect(within(d).queryByText('Similar names already saved')).toBeNull();
    await userEvent.type(within(d).getByLabelText('Full name'), 'Ali Shahzad');
    expect(await within(d).findByText('Similar names already saved')).toBeInTheDocument();
    const before = api.db.s.players.length;
    await userEvent.click(within(d).getByRole('button', { name: /^Ali Shah •••• 4470/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/players'));
    expect(await screen.findByTestId('slot-filled')).toHaveTextContent('Ali Shah');
    // No second account was made.
    expect(api.db.s.players).toHaveLength(before);
  });

  it('Cancel goes back to the players without a new account', async () => {
    const view = renderCounter('/players/new?for=t2');
    const d = await dialog('Add a new player');
    await userEvent.click(within(d).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/players'));
  });

  it('the draft survives the trip: the first player is still in his slot when the new one is added', async () => {
    const view = renderCounter('/table/t2/start/players');
    await dialog('Who is playing on Table 2?');
    await pickByTyping('ahmed', /^Ahmed Nawaz/);
    await userEvent.type(await searchBox(), 'zed khan');
    await userEvent.click(await button('Add “zed khan” as a new player'));
    const d = await dialog('Add a new player');
    await userEvent.click(within(d).getByRole('button', { name: 'Skip phone for now' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/players'));
    await waitFor(() => expect(screen.getAllByTestId('slot-filled')).toHaveLength(2));
    const slots = screen.getAllByTestId('slot-filled').map((slot) => slot.textContent);
    expect(slots[0]).toContain('Ahmed Nawaz');
    expect(slots[1]).toContain('Zed Khan');
    expect(await button('Start game')).toBeEnabled();
  });

  it('in a double, the new player goes to the side that is asking', async () => {
    const view = renderCounter('/table/t2/start/double');
    await dialog('Double frame on Table 2');
    await userEvent.click(await button('Side B'));
    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Search a name or phone for side B' }),
      'zed khan',
    );
    await userEvent.click(await button('Add “zed khan” as a new player'));
    const d = await dialog('Add a new player');
    await userEvent.click(within(d).getByRole('button', { name: 'Skip phone for now' }));
    await waitFor(() => expect(wherePath(view)).toBe('/table/t2/start/double'));
    const side = await screen.findByRole('region', { name: 'Side B' });
    expect(within(side).getByTestId('slot-filled')).toHaveTextContent('Zed Khan');
  });
});

describe('screen 12: change the game type in the first 5 minutes', () => {
  /** Zain started Table 2 at 9:50 PM; the page opens at 9:53 PM. */
  function at953(minutesLater = 0) {
    api.load({ scenario: 'newGame' });
    const iso = new Date(
      Date.parse('2026-10-03T21:53:00+05:00') + minutesLater * 60_000,
    ).toISOString();
    api.setTime(iso);
    resetCounterState(Date.parse(iso));
  }

  it('says when it started and until when it can change, with "Now" on the single frame', async () => {
    at953();
    renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    expect(d).toHaveTextContent(
      'Started 3 minutes ago as a single frame: Ahmed Nawaz vs Ali Akbar. You can change it until 9:55 PM.',
    );
    expect(within(d).getByRole('button', { name: /^Single frame/ })).toHaveTextContent('Now');
    expect(within(d).getByRole('button', { name: /^Single frame/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(d).toHaveTextContent(
      '2 minutes left to change. After that, end or discard the frame first.',
    );
    expect(within(d).getByText(/^Counts from/)).toHaveTextContent(
      'Counts from 9:50 PM, when the game started. Whole minutes are charged.',
    );
    // Nothing is picked that differs from the game, so there is nothing to change yet.
    expect(within(d).getByRole('button', { name: 'Change to Single frame' })).toBeDisabled();
  });

  it('Century: Change to Century asks who pays (Ahmed is already there), and Table 2 becomes a Century', async () => {
    at953();
    const view = renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    await userEvent.click(within(d).getByRole('button', { name: /^Century/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Change to Century' }));
    expect(wherePath(view)).toBe('/table/t2/change-type/players');

    const players = await dialog('Who is playing on Table 2?');
    expect(within(players).getByTestId('slot-filled')).toHaveTextContent('Ahmed Nawaz');
    await userEvent.click(within(players).getByRole('button', { name: 'Change to Century' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(gameOn('t2')).toMatchObject({
      type: 'century',
      underPlayerId: 'ahmed-nawaz',
      price: 15,
    });
    // It counts from when the game started, not from the change.
    expect(gameOn('t2')?.startedAt).toBe('2026-10-03T21:50:00+05:00');
    expect(await screen.findByRole('button', { name: 'Table 2, playing' })).toHaveTextContent(
      'Under Ahmed Nawaz',
    );
  });

  it('Back from the players returns to the three choices, keeping the pick', async () => {
    at953();
    const view = renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    await userEvent.click(within(d).getByRole('button', { name: /^Century/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Change to Century' }));
    await dialog('Who is playing on Table 2?');
    await userEvent.click(await button('Back to game type'));
    expect(wherePath(view)).toBe('/table/t2/change-type');
  });

  it('a double starts from the two players, one on each side, and needs a third', async () => {
    at953();
    const view = renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    await userEvent.click(within(d).getByRole('button', { name: /^Double frame/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Change to Double frame' }));
    expect(wherePath(view)).toBe('/table/t2/change-type/double');
    const sides = await dialog('Double frame on Table 2');
    expect(within(sides).getAllByTestId('slot-filled')).toHaveLength(2);
    expect(within(sides).getByRole('button', { name: 'Change to Double frame' })).toBeDisabled();
    await pickByTyping('imran', /^Imran Shah/, 'Search a name or phone for side A');
    await userEvent.click(within(sides).getByRole('button', { name: 'Change to Double frame' }));
    await waitFor(() => expect(gameOn('t2')?.type).toBe('double'));
    expect(gameOn('t2')?.price).toBe(500);
  });

  it('a double changed to a single frame starts with one player from each side, not two partners (D60)', async () => {
    at953();
    changeGameType(api.db, { id: 'zain', name: 'Zain', role: 'worker' }, gameOn('t2')?.id ?? '', {
      type: 'double',
      sides: [['ahmed-nawaz', 'ali-akbar'], ['imran']],
    });
    const view = renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    await userEvent.click(within(d).getByRole('button', { name: /^Single frame/ }));
    await userEvent.click(within(d).getByRole('button', { name: 'Change to Single frame' }));
    expect(wherePath(view)).toBe('/table/t2/change-type/players');
    const players = await dialog('Who is playing on Table 2?');
    const names = within(players)
      .getAllByTestId('slot-filled')
      .map((slot) => slot.textContent);
    expect(names).toHaveLength(2);
    expect(names[0]).toContain('Ahmed Nawaz');
    expect(names[1]).toContain('Imran');
    await userEvent.click(within(players).getByRole('button', { name: 'Change to Single frame' }));
    await waitFor(() => expect(gameOn('t2')?.type).toBe('single'));
    expect(gameOn('t2')?.playerIds).toEqual(['ahmed-nawaz', 'imran']);
  });

  it('at 6 minutes it is too late: the dialog says so and offers no change', async () => {
    at953(3);
    renderCounter('/table/t2/change-type');
    const d = await dialog('Change the game on Table 2');
    expect(d).toHaveTextContent(
      'The 5 minutes to change this game are over. End or discard the frame first.',
    );
    expect(within(d).queryByRole('button', { name: /^Change to/ })).toBeNull();
  });

  it('a table with nothing running goes back to the board; a pool game has nothing to change into', async () => {
    const view = renderCounter('/table/t2/change-type');
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });
});

describe('a game of pool, foosball, carrom, ludo or PlayStation', () => {
  it('skips the type: a pool table with a price goes straight to the two players, with no Back', async () => {
    const pool = api.db.s.tables.find((t) => t.id === 'po1');
    if (pool) pool.price = 300;
    const view = renderCounter('/board/pool');
    await userEvent.click(await screen.findByRole('button', { name: 'Pool table 1, free' }));
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool/table/po1/start/players'));
    const d = await dialog('Who is playing on Pool table 1?');
    expect(within(d).getByText('Game, Rs 300. The loser pays.')).toBeInTheDocument();
    expect(within(d).queryByRole('button', { name: 'Back to game type' })).toBeNull();
    expect(within(d).queryByText(/^Step/)).toBeNull();
    await pickByTyping('ahmed', /^Ahmed Nawaz/);
    await pickByTyping('imran', /^Imran Shah/);
    await userEvent.click(within(d).getByRole('button', { name: 'Start game' }));
    // Closing returns to the Pool tab.
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool'));
    expect(gameOn('po1')).toMatchObject({
      type: 'game',
      playerIds: ['ahmed-nawaz', 'imran'],
      price: 300,
    });
  });

  it('without a price it says so and cannot start', async () => {
    renderCounter('/board/pool/table/po1/start');
    const d = await dialog('Pool table 1 has no price yet');
    expect(d).toHaveTextContent('Locked until an owner sets the price');
  });

  it('closing a game dialog returns to the tab it opened over', async () => {
    const pool = api.db.s.tables.find((t) => t.id === 'po1');
    if (pool) pool.price = 300;
    const view = renderCounter('/board/pool/table/po1/start/players');
    await dialog('Who is playing on Pool table 1?');
    await userEvent.click(await button('Cancel'));
    expect(wherePath(view)).toBe('/board/pool');
  });
});

describe('in Urdu', () => {
  it('draws the type step in Urdu, mirrored, with the numbers as they are', async () => {
    setLanguage('ur');
    renderCounter('/table/t2/start');
    const d = await dialog('ٹیبل 2 خالی ہے');
    expect(d).toHaveTextContent('وہ کیا کھیل رہے ہیں؟');
    expect(within(d).getByRole('button', { name: /^سنگل فریم/ })).toHaveTextContent('250');
    expect(within(d).getByRole('button', { name: /^سنچری/ })).toHaveTextContent('15 روپے فی منٹ');
    expect(within(d).getByRole('button', { name: 'آگے: کھلاڑی چنیں' })).toBeInTheDocument();
  });

  it('writes the players step and the tags in Urdu', async () => {
    setLanguage('ur');
    renderCounter('/table/t2/start/players');
    const d = await dialog('ٹیبل 2 پر کون کھیل رہا ہے؟');
    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'نام یا فون سے کھلاڑی تلاش کریں' }),
      'ali',
    );
    expect(await result(/^Ali Raza/, 'تلاش کے نتائج')).toHaveTextContent('ٹیبل 1 پر کھیل رہا ہے');
    expect(await result(/^Ali Haider/, 'تلاش کے نتائج')).toHaveTextContent('1,200 روپے باقی');
    expect(within(d).getByText('مرحلہ 2 از 2')).toBeInTheDocument();
  });
});
