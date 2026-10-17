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
const MOMENT = '2026-10-03T21:55:00+05:00';

const at = (iso = MOMENT, scenario?: Parameters<typeof api.load>[0]) => {
  api.load(scenario);
  api.setTime(iso);
  resetCounterState(Date.parse(iso));
};

beforeAll(async () => {
  await startCounterTests(api);
  // The first page of a file pays for everything that is cold (the canteen, the totals, the mock server). Pay for it here
  // so every test keeps the normal limits.
  at();
  const view = renderCounter('/canteen');
  await screen.findByRole('button', { name: /^Cold drink/ }, { timeout: 20_000 });
  view.unmount();
  const today = renderCounter('/today');
  await screen.findByText('Total received today', undefined, { timeout: 20_000 });
  today.unmount();
}, 60_000);
afterAll(() => api.server.close());
beforeEach(() => at());
afterEach(() => resetCounterState());

const button = (name: string | RegExp) => screen.findByRole('button', { name });
const dialog = (name: string | RegExp) => screen.findByRole('dialog', { name });

describe('screen 28: canteen sale', () => {
  it('lists the items with their stock: made fresh, N left, low, sold out', async () => {
    renderCounter('/canteen');
    expect(await screen.findByRole('heading', { name: 'Canteen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tables' })).toBeInTheDocument();
    expect(await button('Tea, Rs 50, Made fresh')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Water, small, Rs 70, 34 left' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Chips, Rs 60, 3 left, low' })).toBeEnabled();
    const soldOut = screen.getByRole('button', { name: 'Cigarette pack, Rs 650, Sold out' });
    expect(soldOut).toBeDisabled();
    // Twelve items in the grid, in the owners' order.
    const grid = screen.getByRole('region', { name: 'Items' });
    expect(within(grid).getAllByRole('listitem')).toHaveLength(12);
  });

  it('the tabs show one kind at a time', async () => {
    renderCounter('/canteen');
    await button(/^Tea,/);
    const tabs = screen.getByRole('group', { name: 'Item type' });
    expect(within(tabs).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(within(tabs).getByRole('button', { name: 'Cigarettes' }));
    const grid = screen.getByRole('region', { name: 'Items' });
    expect(within(grid).getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(within(tabs).getByRole('button', { name: 'Food' }));
    expect(within(grid).getAllByRole('listitem')).toHaveLength(4);
    await userEvent.click(within(tabs).getByRole('button', { name: 'Drinks' }));
    expect(within(grid).getAllByRole('listitem')).toHaveLength(6);
  });

  it('Usman’s order of 2 cold drinks and chips is Rs 300 and goes on his bill (screen 28)', async () => {
    renderCounter('/canteen');
    const aside = await screen.findByRole('complementary', { name: 'Order' });
    await userEvent.type(within(aside).getByRole('searchbox'), 'usman');
    await userEvent.click(await within(aside).findByRole('button', { name: /^Usman Tariq/ }));
    expect(aside).toHaveTextContent('•••• 7731, playing on Table 4');
    expect(within(aside).getByRole('button', { name: 'Change' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Cold drink,/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Cold drink,/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Chips,/ }));
    expect(aside).toHaveTextContent('Cold drink');
    expect(aside).toHaveTextContent('Rs 240');
    expect(aside).toHaveTextContent('Rs 60');
    expect(aside).toHaveTextContent('Total');
    expect(aside).toHaveTextContent('Rs 300');
    // The tile says how many are in the order.
    expect(
      screen.getByRole('button', { name: /^Cold drink, Rs 120, 24 left, 2 in the order/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'It is paid at checkout with his games. For a cash sale, the money is taken now.',
      ),
    ).toBeInTheDocument();

    const before = api.db.tonightLines('usman-t').length;
    await userEvent.click(
      within(aside).getByRole('button', { name: 'Add Rs 300 to Usman’s bill' }),
    );
    expect(await screen.findByText('Rs 300 added to Usman Tariq’s bill.')).toBeInTheDocument();
    const added = api.db.tonightLines('usman-t').slice(before);
    expect(
      added.map((line) => [line.item?.name, line.item?.qty, line.charge, line.doneBy.name]),
    ).toEqual([
      ['Cold drink', 2, 240, 'Zain'],
      ['Chips', 1, 60, 'Zain'],
    ]);
    // The stock went down, and the order is empty for the next customer.
    expect(api.db.s.canteenItems.find((item) => item.id === 'cold-drink')?.stock).toBe(22);
    expect(api.db.s.canteenItems.find((item) => item.id === 'chips')?.stock).toBe(2);
    expect(
      await screen.findByRole('button', { name: /^Cold drink, Rs 120, 22 left$/ }),
    ).toBeInTheDocument();
    expect(within(aside).getByText('Tap an item to add it to the order.')).toBeInTheDocument();
  });

  it('− and + change the count, and the order never holds more than is left', async () => {
    renderCounter('/canteen');
    const aside = await screen.findByRole('complementary', { name: 'Order' });
    const chips = await button(/^Chips,/);
    for (let i = 0; i < 3; i += 1) await userEvent.click(chips);
    expect(within(aside).getByRole('button', { name: 'One more chips' })).toBeDisabled(); // 3 in stock
    await userEvent.click(within(aside).getByRole('button', { name: 'One less chips' }));
    expect(aside).toHaveTextContent('Rs 120');
    await userEvent.click(within(aside).getByRole('button', { name: 'One less chips' }));
    await userEvent.click(within(aside).getByRole('button', { name: 'One less chips' }));
    expect(within(aside).getByText('Tap an item to add it to the order.')).toBeInTheDocument();
  });

  it('a sold-out item cannot be added, and a sale needs a player first', async () => {
    renderCounter('/canteen');
    const aside = await screen.findByRole('complementary', { name: 'Order' });
    await userEvent.click(await button(/^Cigarette pack,/));
    expect(within(aside).getByText('Tap an item to add it to the order.')).toBeInTheDocument();
    expect(within(aside).getByRole('button', { name: 'Add something first' })).toBeDisabled();
    await userEvent.click(await button(/^Biscuits,/));
    expect(within(aside).getByRole('button', { name: 'Pick a player first' })).toBeDisabled();
  });

  it('a cash sale with no name takes the money now, in the method that is picked (Q10)', async () => {
    renderCounter('/canteen');
    const aside = await screen.findByRole('complementary', { name: 'Order' });
    await userEvent.click(await button(/^Coffee,/));
    await userEvent.click(within(aside).getByRole('radio', { name: 'Cash sale, no name' }));
    expect(within(aside).getByRole('button', { name: 'Take Rs 120 now (Cash)' })).toBeEnabled();
    await userEvent.click(within(aside).getByRole('button', { name: 'Easypaisa' }));
    const easypaisa = api.db.s.today.online.easypaisa;
    const sales = api.db.s.canteenSales.length;
    await userEvent.click(
      within(aside).getByRole('button', { name: 'Take Rs 120 now (Easypaisa)' }),
    );
    expect(await screen.findByText('Rs 120 taken for the canteen, Easypaisa.')).toBeInTheDocument();
    expect(api.db.s.today.online.easypaisa).toBe(easypaisa + 120);
    expect(api.db.s.canteenSales).toHaveLength(sales + 1);
    expect(api.db.s.canteenSales[0]).toMatchObject({
      playerId: null,
      total: 120,
      paidNow: 'easypaisa',
      doneBy: { name: 'Zain' },
    });
  });

  it('a name that is not on the list is added from the search and comes back picked', async () => {
    const view = renderCounter('/canteen');
    const aside = await screen.findByRole('complementary', { name: 'Order' });
    await userEvent.type(within(aside).getByRole('searchbox'), 'Zubair Qureshi');
    await userEvent.click(
      await within(aside).findByRole('button', { name: /Add “Zubair Qureshi” as a new player/ }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/players/new?back=canteen'));
    const d = await dialog('Add a new player');
    expect(within(d).getByLabelText('Full name')).toHaveValue('Zubair Qureshi');
    await userEvent.click(within(d).getByRole('button', { name: /^Skip phone/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/canteen'));
    expect(await screen.findByRole('complementary', { name: 'Order' })).toHaveTextContent(
      'Zubair Qureshi',
    );
    expect(api.db.s.players.some((player) => player.name === 'Zubair Qureshi')).toBe(true);
  });

  it('Tables goes back to the board, and the page has its own header (no top bar, no action bar)', async () => {
    const view = renderCounter('/canteen');
    await screen.findByRole('heading', { name: 'Canteen' });
    expect(screen.queryByRole('contentinfo')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Tables' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });

  it('writes its words in Urdu', async () => {
    setLanguage('ur');
    renderCounter('/canteen');
    expect(await screen.findByRole('heading', { name: 'کینٹین' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'نقد فروخت، بغیر نام' })).toBeInTheDocument();
    expect((await screen.findAllByText('تازہ بنتی ہے')).length).toBeGreaterThan(0);
  });
});

describe('screen 29: expense from the drawer', () => {
  const open = async (path = '/') => {
    const view = renderCounter(path);
    await userEvent.click(await button('Expense'));
    return { view, d: await dialog('Expense from the drawer') };
  };

  it('opens from the action bar over the board, with "Added by Zain" and the six things it can be for', async () => {
    const { view, d } = await open();
    expect(wherePath(view)).toBe('/expense');
    expect(d).toHaveTextContent('Added by Zain');
    expect(d).toHaveTextContent(
      'For cash taken from tonight’s money, like food or petrol. It comes off the cash the drawer should have.',
    );
    for (const kind of ['Food', 'Petrol', 'Tea and milk', 'Cleaning', 'Repairs', 'Other']) {
      expect(within(d).getByRole('button', { name: kind })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    for (const quick of ['200', '500', '1,000', '2,000']) {
      expect(within(d).getByRole('button', { name: quick })).toBeInTheDocument();
    }
    expect(d).toHaveTextContent(
      'The owners see it in Expenses and Activity with your name. Only they can change or remove it.',
    );
    // Nothing is chosen for the worker: the button waits for a kind, a note and an amount.
    expect(within(d).getByRole('button', { name: 'Take cash from the drawer' })).toBeDisabled();
  });

  it('shows the cash in the drawer before and after: Rs 17,950 then Rs 17,450 (D53)', async () => {
    const { d } = await open();
    expect(d).toHaveTextContent('Cash in the drawerRs 17,950');
    await userEvent.click(within(d).getByRole('button', { name: '500' }));
    expect(within(d).getByLabelText('Now Rs 17,950')).toHaveTextContent('Rs 17,950');
    expect(within(d).getByLabelText('After Rs 17,450')).toHaveTextContent('Rs 17,450');
    expect(within(d).getByRole('button', { name: '500' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Take Rs 500 from the drawer saves it with Zain’s name and lowers the expected cash everywhere', async () => {
    const { view, d } = await open();
    const take = () => within(d).getByRole('button', { name: /^Take / });
    await userEvent.click(within(d).getByRole('button', { name: 'Food' }));
    expect(take()).toBeDisabled(); // no note, no amount
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Dinner for staff');
    expect(take()).toBeDisabled(); // no amount
    await userEvent.type(within(d).getByLabelText('Amount'), '500');
    expect(within(d).getByRole('button', { name: 'Take Rs 500 from the drawer' })).toBeEnabled();
    await userEvent.click(take());

    await waitFor(() => expect(wherePath(view)).toBe('/'));
    expect(
      await screen.findByText('Rs 500 taken from the drawer: Dinner for staff.'),
    ).toBeInTheDocument();
    expect(api.db.s.expenses[0]).toMatchObject({
      amount: 500,
      category: 'food-petrol',
      what: 'Dinner for staff',
      paidFrom: 'drawer',
      source: 'counter',
      doneBy: { name: 'Zain' },
    });
    expect(api.db.s.today.drawerExpenses).toBe(1000);
    expect(api.db.s.activity[0]).toMatchObject({
      type: 'drawer-expense',
      by: { name: 'Zain' },
      amount: -500,
    });
  });

  it('a note is required, and the amount is whole rupees above 0', async () => {
    const { d } = await open();
    await userEvent.click(within(d).getByRole('button', { name: 'Petrol' }));
    await userEvent.type(within(d).getByLabelText('Amount'), '0');
    await userEvent.type(within(d).getByLabelText('Note (required)'), '   ');
    expect(within(d).getByRole('button', { name: /^Take / })).toBeDisabled();
    await userEvent.clear(within(d).getByLabelText('Amount'));
    await userEvent.type(within(d).getByLabelText('Amount'), '1200');
    expect(within(d).getByLabelText('Amount')).toHaveValue('1,200');
    expect(within(d).getByRole('button', { name: /^Take / })).toBeDisabled(); // the note is still empty
  });

  it('Petrol and Food are one owner category, Tea and milk and Cleaning too', async () => {
    const { d } = await open();
    await userEvent.click(within(d).getByRole('button', { name: 'Tea and milk' }));
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Milk for the canteen');
    await userEvent.click(within(d).getByRole('button', { name: '200' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Take Rs 200 from the drawer' }));
    await waitFor(() =>
      expect(api.db.s.expenses[0]).toMatchObject({ category: 'cleaning-tea', amount: 200 }),
    );
  });

  it('Cancel and Escape close it and save nothing, and over Pool it returns to Pool', async () => {
    const { view, d } = await open('/board/pool');
    expect(wherePath(view)).toBe('/board/pool/expense');
    const before = api.db.s.expenses.length;
    await userEvent.click(within(d).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool'));
    expect(api.db.s.expenses).toHaveLength(before);
    await userEvent.click(await button('Expense'));
    await dialog('Expense from the drawer');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(wherePath(view)).toBe('/board/pool'));
  });
});

describe('screen 30: players and their statements', () => {
  it('Kamran Iqbal’s account: Rs 1,350, his lines with the balance after each, and the way to his bill', async () => {
    renderCounter('/players/kamran');
    const panel = await screen.findByRole('region', { name: 'Statement' });
    expect(await within(panel).findByRole('heading', { name: 'Kamran Iqbal' })).toBeInTheDocument();
    expect(panel).toHaveTextContent('0313 •••• 2276. 64 frames played, 29 won.');
    expect(panel).toHaveTextContent('Owes the club');
    expect(panel).toHaveTextContent('Rs 1,350');
    const table = within(panel).getByRole('table', { name: 'Statement lines' });
    const rows = within(table).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('DateDetailsChargePaidBalance');
    expect(rows[1]).toHaveTextContent('15 Sep, 9:10 PMFrame, Table 2, lost to Imran250–250 owed');
    expect(rows.at(-1)).toHaveTextContent('Half of a double, Table 2');
    expect(rows.at(-1)).toHaveTextContent('1,350 owed');
    expect(within(panel).getByRole('button', { name: 'Checkout Kamran' })).toBeInTheDocument();
  });

  it('the list has All, Owe money and Advance with their counts, and Owe money lists the most owed first', async () => {
    renderCounter('/players/kamran');
    const filter = await screen.findByRole('group', { name: 'Filter' });
    expect(within(filter).getByRole('button', { name: /^All \d+$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const owing = api.db.s.players.filter((p) => p.balance > 0).length;
    const advance = api.db.s.players.filter((p) => p.balance < 0).length;
    await userEvent.click(
      await within(filter).findByRole('button', { name: `Owe money ${owing}` }),
    );
    expect(
      await within(filter).findByRole('button', { name: `Advance ${advance}` }),
    ).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Player list' });
    const names = within(list)
      .getAllByRole('button')
      .map((b) => b.textContent ?? '');
    expect(names[0]).toContain('Kamran Iqbal');
    expect(names[0]).toContain('•••• 2276, oldest unpaid 18 days');
    expect(names[0]).toContain('Rs 1,350');
    expect(names[1]).toContain('Ali Haider');
    expect(names[1]).toContain('•••• 5520, oldest unpaid 25 days');
    expect(within(list).getByRole('button', { name: /^Kamran Iqbal/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('Advance lists the players the club holds money for, in green', async () => {
    renderCounter('/players');
    const filter = await screen.findByRole('group', { name: 'Filter' });
    await userEvent.click(within(filter).getByRole('button', { name: /^Advance / }));
    const list = screen.getByRole('list', { name: 'Player list' });
    const saad = within(list).getByRole('button', { name: /^Saad Hussain/ });
    expect(saad).toHaveTextContent('advance');
    expect(saad).toHaveTextContent('Rs 200');
    expect(within(list).queryByRole('button', { name: /^Kamran/ })).toBeNull();
  });

  it('a tap on a player opens his page, and the search finds by name or phone', async () => {
    const view = renderCounter('/players');
    expect(
      await screen.findByText('Pick a player on the left to see his account.'),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search players' }), 'waq');
    const list = screen.getByRole('list', { name: 'Player list' });
    await userEvent.click(await within(list).findByRole('button', { name: /^Waqas Butt/ }));
    await waitFor(() => expect(wherePath(view)).toBe('/players/waqas'));
    expect(await screen.findByRole('heading', { name: 'Waqas Butt' })).toBeInTheDocument();
    expect(within(list).queryByRole('button', { name: /^Kamran/ })).toBeNull();
  });

  it('the period: since last zero, this month, all', async () => {
    renderCounter('/players/kamran');
    const panel = await screen.findByRole('region', { name: 'Statement' });
    await within(panel).findByRole('table', { name: 'Statement lines' });
    const count = () =>
      within(screen.getByRole('table', { name: 'Statement lines' })).getAllByRole('row').length - 1;
    expect(within(panel).getByRole('radio', { name: 'Since last zero' })).toBeChecked();
    const all = count();
    await userEvent.click(within(panel).getByRole('radio', { name: 'This month' }));
    expect(count()).toBeLessThan(all);
    expect(within(panel).getByRole('table', { name: 'Statement lines' })).toHaveTextContent(
      '3 Oct',
    );
    expect(within(panel).getByRole('table', { name: 'Statement lines' })).not.toHaveTextContent(
      '15 Sep',
    );
    await userEvent.click(within(panel).getByRole('radio', { name: 'All' }));
    expect(count()).toBeGreaterThanOrEqual(all);
  });

  it('Checkout Kamran opens his bill', async () => {
    const view = renderCounter('/players/kamran');
    await userEvent.click(await screen.findByRole('button', { name: 'Checkout Kamran' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout/kamran'));
  });

  it('New player opens the dialog over the board and comes back to his own page', async () => {
    const view = renderCounter('/players/kamran');
    await userEvent.click(await screen.findByRole('button', { name: 'New player' }));
    await waitFor(() => expect(wherePath(view)).toBe('/players/new?back=players'));
    const d = await dialog('Add a new player');
    await userEvent.type(within(d).getByLabelText('Full name'), 'Hassan Raza');
    await userEvent.click(within(d).getByRole('button', { name: /^Skip phone/ }));
    await waitFor(() => expect(wherePath(view)).toMatch(/^\/players\/[a-z0-9-]+$/));
    expect(await screen.findByRole('heading', { name: 'Hassan Raza' })).toBeInTheDocument();
    expect(api.db.s.players.some((p) => p.name === 'Hassan Raza')).toBe(true);
  });
});

describe('screen 31: today’s totals', () => {
  it('shows the numbers of the night: Rs 17,950 in the drawer, the online money, the frames and the credit', async () => {
    at('2026-10-03T22:30:00+05:00');
    renderCounter('/today');
    expect(await screen.findByRole('heading', { name: 'Today’s totals' })).toBeInTheDocument();
    expect(
      await screen.findByText(textIs('Sheet 48, from 11:10 AM until now')),
    ).toBeInTheDocument();
    expect(await screen.findByText('Cash that should be in the drawer')).toBeInTheDocument();
    expect(screen.getByText('Rs 17,950')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cash received Rs 18,450, minus Rs 500 taken for expenses. Count it when you close the sheet.',
      ),
    ).toBeInTheDocument();
    const money = screen.getByRole('region', { name: 'Money received' });
    expect(
      within(money)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Bank transferRs 3,200', 'EasypaisaRs 4,100', 'JazzCashRs 1,300']);
    expect(screen.getByText('Total received today')).toBeInTheDocument();
    expect(screen.getByText('Rs 27,050')).toBeInTheDocument();
    const activity = screen.getByRole('region', { name: 'Activity' });
    expect(activity).toHaveTextContent('Frames played626 of them doubles');
    expect(activity).toHaveTextContent('Century minutes2145 Century games');
    expect(activity).toHaveTextContent('Put on credit todayRs 2,3507 players');
    expect(activity).toHaveTextContent('Old credit collectedRs 1,8003 players');
    expect(
      screen.getByText(
        textIs(
          'Expenses from the drawer tonight: Rs 500, Dinner for staff (Zain, 8:15 PM). Profit is shown to the owners only.',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('says who is still waiting to pay, from the real bills, and Go to checkout opens the list', async () => {
    const view = renderCounter('/today');
    const waiting =
      api.db.s.players.length > 0 ? await screen.findByText(/Still waiting to pay:/) : null;
    const bills = api.db.s.unsettled.size;
    expect(bills).toBeGreaterThan(0);
    expect(waiting?.textContent).toMatch(
      /^Still waiting to pay: \d+ bills?, Rs [\d,]+\. Ask them before they leave\.$/,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go to checkout' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
  });

  it('a drawer expense lowers the cash that should be in the drawer, and the line says the last one', async () => {
    const view = renderCounter('/');
    await userEvent.click(await button('Expense'));
    const d = await dialog('Expense from the drawer');
    await userEvent.click(within(d).getByRole('button', { name: 'Other' }));
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Gas cylinder');
    await userEvent.click(within(d).getByRole('button', { name: '500' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Take Rs 500 from the drawer' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    view.unmount();

    renderCounter('/today');
    expect(await screen.findByText('Rs 17,450')).toBeInTheDocument();
    expect(
      screen.getByText(
        textIs(
          'Expenses from the drawer tonight: Rs 1,000. The last one: Gas cylinder (Zain, 9:55 PM). Profit is shown to the owners only.',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('draws no top bar and no action bar, and Tables goes back', async () => {
    const view = renderCounter('/today');
    await screen.findByRole('heading', { name: 'Today’s totals' });
    expect(screen.queryByRole('contentinfo')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Tables' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });
});

describe('screens 32 and 33: close the sheet', () => {
  const closing = () => at('2026-10-04T03:40:00+05:00', { scenario: 'closing' });

  it('is the three steps and the sheet in short, as screen 32 draws them', async () => {
    closing();
    renderCounter('/close-sheet');
    expect(await screen.findByRole('heading', { name: 'Close sheet 48' })).toBeInTheDocument();
    expect(
      screen.getByText(
        textIs('Opened Sat 3 Oct, 11:10 AM. Closing Sun 4 Oct, 3:40 AM, by Shabir. 16 h 30 min.'),
      ),
    ).toBeInTheDocument();
    const cash = screen.getByRole('region', { name: 'Cash check' });
    expect(cash).toHaveTextContent('1. Count the cash drawer');
    expect(cash).toHaveTextContent('Cash expected (after Rs 500 expenses)');
    expect(cash).toHaveTextContent('Rs 21,750');
    const online = screen.getByRole('region', { name: 'Online money' });
    expect(
      within(online)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Bank transferRs 4,400', 'EasypaisaRs 5,350', 'JazzCashRs 1,300']);
    const happens = screen.getByRole('region', { name: 'What happens' });
    expect(happens).toHaveTextContent('2 players left without checkout');
    expect(happens).toHaveTextContent('Waqas Butt Rs 450 and Shoaib Malik Rs 250 move to credit.');
    expect(happens).toHaveTextContent('1 game still running moves to sheet 49');
    expect(happens).toHaveTextContent('Table 2, Century under Ahmed Nawaz, 18 min so far.');
    expect(happens).toHaveTextContent(
      'The day summary is emailed to Aqil and Adil, and a backup is saved.',
    );
    const short = screen.getByRole('complementary', { name: 'Totals and confirm' });
    expect(short).toHaveTextContent('Sheet 48 in short');
    for (const [label, value] of [
      ['Frames', '81'],
      ['Century minutes', '276'],
      ['Room hours', '4 h 10 min'],
      ['Money received', 'Rs 33,300'],
      ['Put on credit', 'Rs 3,650'],
      ['Discounts given', 'Rs 150, 2 times'],
    ]) {
      expect(short).toHaveTextContent(`${label}${value}`);
    }
    expect(short).toHaveTextContent('Close sheet 48Sheet 49 opens straight away');
    expect(short).toHaveTextContent('Owners can still correct it later. Every change is recorded.');
  });

  it('closing waits for the count, and a difference needs a note: 21,550 is Rs 200 short', async () => {
    closing();
    renderCounter('/close-sheet');
    const close = await screen.findByRole('button', { name: /^Close sheet 48/ });
    expect(close).toBeDisabled();
    const counted = screen.getByLabelText('Cash counted');
    await userEvent.type(counted, '21550');
    expect(counted).toHaveValue('Rs 21,550');
    const cash = screen.getByRole('region', { name: 'Cash check' });
    expect(cash).toHaveTextContent('ShortRs 200');
    expect(close).toBeDisabled(); // the note is required when it is not nothing
    expect(
      screen.getByText('Write a note about the difference before you close.'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText(/^Note about the difference/),
      'Gave Rs 200 change from the drawer for a bank payment',
    );
    expect(close).toBeEnabled();
  });

  it('counting exactly 21,750 matches and needs no note; counting more is extra', async () => {
    closing();
    renderCounter('/close-sheet');
    const close = await screen.findByRole('button', { name: /^Close sheet 48/ });
    const counted = screen.getByLabelText('Cash counted');
    await userEvent.type(counted, '21750');
    const cash = screen.getByRole('region', { name: 'Cash check' });
    expect(cash).toHaveTextContent('Cash matchesRs 0');
    expect(close).toBeEnabled();
    await userEvent.clear(counted);
    await userEvent.type(counted, '21800');
    expect(cash).toHaveTextContent('ExtraRs 50');
    expect(close).toBeDisabled();
  });

  it('asks once, then closes: sheet 49 opens, the Century moves, two players move to credit (screen 33)', async () => {
    closing();
    const view = renderCounter('/close-sheet');
    await userEvent.type(await screen.findByLabelText('Cash counted'), '21550');
    await userEvent.type(
      screen.getByLabelText(/^Note about the difference/),
      'Gave Rs 200 change from the drawer for a bank payment',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Close sheet 48/ }));
    const sure = await dialog('Close sheet 48 with Rs 21,550 counted?');
    expect(sure).toHaveTextContent('The cash is Rs 200 short.');
    expect(sure).toHaveTextContent('2 players left without checkout move to credit (Rs 700).');
    expect(sure).toHaveTextContent('1 game still running moves to sheet 49.');

    // No leaves everything as it is.
    await userEvent.click(within(sure).getByRole('button', { name: 'No' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.db.s.currentSheetId).toBe('s48');

    await userEvent.click(screen.getByRole('button', { name: /^Close sheet 48/ }));
    await userEvent.click(
      within(await dialog(/^Close sheet 48 with/)).getByRole('button', { name: 'Yes, close it' }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/sheet-closed'));

    expect(await screen.findByRole('heading', { name: 'Sheet 48 is closed' })).toBeInTheDocument();
    expect(
      screen.getByText(textIs('Closed at 3:40 AM, Sun 4 Oct. Sheet 49 is open now.')),
    ).toBeInTheDocument();
    expect(screen.getByText('Moved to sheet 49')).toBeInTheDocument();
    expect(screen.getByText('Table 2, Century')).toBeInTheDocument();
    expect(await screen.findByText('Still running under Ahmed Nawaz')).toBeInTheDocument();
    expect(screen.getByText('2 players, Rs 700')).toBeInTheDocument();
    expect(screen.getByText('Marked left without checkout')).toBeInTheDocument();
    expect(screen.getByText('Rs 200 short')).toBeInTheDocument();
    expect(screen.getByText('Your note was saved for the owners')).toBeInTheDocument();
    expect(
      screen.getByText(textIs('Summary emailed to Aqil and Adil. Backup saved at 3:40 AM.')),
    ).toBeInTheDocument();

    expect(api.db.s.currentSheetId).toBe('s49');
    expect(api.db.game('g-t2-c').sheetId).toBe('s49');
    expect(api.db.sheet('s48')).toMatchObject({ closedBy: { name: 'Shabir' } });
    expect(api.db.sheet('s48').cash).toMatchObject({
      expected: 21750,
      counted: 21550,
      difference: -200,
    });
    expect(api.db.statement('waqas').at(-1)).toMatchObject({ kind: 'left-without-checkout' });

    await userEvent.click(screen.getByRole('button', { name: 'Back to tables' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
  });

  it('a drawer expense of Rs 500 lowers the expected cash to Rs 21,250 on the close screen too', async () => {
    closing();
    const view = renderCounter('/');
    await userEvent.click(await button('Expense'));
    const d = await dialog('Expense from the drawer');
    await userEvent.click(within(d).getByRole('button', { name: 'Food' }));
    await userEvent.type(within(d).getByLabelText('Note (required)'), 'Dinner for staff');
    await userEvent.click(within(d).getByRole('button', { name: '500' }));
    await userEvent.click(within(d).getByRole('button', { name: 'Take Rs 500 from the drawer' }));
    await waitFor(() => expect(wherePath(view)).toBe('/'));
    view.unmount();

    renderCounter('/close-sheet');
    const cash = await screen.findByRole('region', { name: 'Cash check' });
    expect(cash).toHaveTextContent('Cash expected (after Rs 1,000 expenses)');
    expect(cash).toHaveTextContent('Rs 21,250');
  });

  it('Check out first goes to the checkout list, and Tables goes back', async () => {
    closing();
    const view = renderCounter('/close-sheet');
    await userEvent.click(await screen.findByRole('button', { name: 'Check out first' }));
    await waitFor(() => expect(wherePath(view)).toBe('/checkout'));
  });

  it('screen 33 is there after a reload, from what the last close did; before any close it goes back to the board', async () => {
    at('2026-10-04T03:40:00+05:00', { scenario: 'closed' });
    renderCounter('/sheet-closed');
    expect(await screen.findByRole('heading', { name: 'Sheet 48 is closed' })).toBeInTheDocument();
    expect(await screen.findByText('Still running under Ahmed Nawaz')).toBeInTheDocument();
    expect(screen.getByText('2 players, Rs 700')).toBeInTheDocument();
    expect(screen.getByText('Rs 200 short')).toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('with nothing left, nothing running and the cash exact, screen 33 says so', async () => {
    at('2026-10-04T03:40:00+05:00', { scenario: 'closing' });
    for (const game of api.db.s.games.filter((g) => g.status === 'running'))
      game.status = 'discarded';
    for (const player of ['waqas', 'shoaib']) {
      for (const line of api.db.tonightLines(player)) api.db.s.unsettled.delete(line.id);
    }
    const view = renderCounter('/close-sheet');
    await userEvent.type(await screen.findByLabelText('Cash counted'), '21750');
    await userEvent.click(screen.getByRole('button', { name: /^Close sheet 48/ }));
    await userEvent.click(
      within(await dialog(/^Close sheet 48 with/)).getByRole('button', { name: 'Yes, close it' }),
    );
    await waitFor(() => expect(wherePath(view)).toBe('/sheet-closed'));
    expect(await screen.findByText('Nothing was running')).toBeInTheDocument();
    expect(screen.getByText('Everyone was checked out')).toBeInTheDocument();
    expect(screen.getByText('Cash matches')).toBeInTheDocument();
    expect(screen.getByText('Nothing short or extra')).toBeInTheDocument();
  });

  it('writes the close screen in Urdu', async () => {
    closing();
    setLanguage('ur');
    renderCounter('/close-sheet');
    expect(await screen.findByRole('heading', { name: 'شیٹ 48 بند کریں' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'نقد کی جانچ' })).toBeInTheDocument();
  });
});
