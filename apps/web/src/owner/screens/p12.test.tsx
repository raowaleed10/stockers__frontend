import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApi } from '@/mocks/test-server';
import {
  renderOwner,
  resetOwnerState,
  setLanguage,
  setPhone,
  startOwnerTests,
  wherePath,
} from '../test/harness';

const api = createTestApi();
beforeAll(() => startOwnerTests(api), 60_000);
afterAll(() => api.server.close());
beforeEach(() => {
  api.load({ app: 'owner' });
  api.setTime('2026-10-03T22:30:00+05:00');
  resetOwnerState();
});

describe('screen 36: the dashboard on a computer', () => {
  it('writes the day, the sheet line and the four numbers of today', async () => {
    renderOwner('/');
    expect(await screen.findByRole('heading', { name: 'Today, Saturday 3 October' })).toBeVisible();
    expect(screen.getByText(/Sheet 48 open since/)).toHaveTextContent(
      'Sheet 48 open since 11:10 AM. Live, updated 10:30 PM.',
    );
    const today = screen.getByRole('region', { name: 'Earned today' });
    expect(today).toHaveTextContent('Earned today');
    expect(today).toHaveTextContent('Rs 33,000');
    expect(today).toHaveTextContent('62 frames, 214 Century minutes, 2 rooms, canteen');
    expect(today).toHaveTextContent('Received today');
    expect(today).toHaveTextContent('Rs 27,050');
    expect(today).toHaveTextContent('Cash Rs 18,450, online Rs 8,600');
    expect(today).toHaveTextContent('Put on credit today');
    expect(today).toHaveTextContent('Rs 2,350');
    expect(today).toHaveTextContent('Old credit collected Rs 1,800');
    expect(today).toHaveTextContent('Tables in use now');
    expect(today).toHaveTextContent('6 of 9');
    // The red cards are counted live: at 10:30 PM three games are past their 30 minutes (the seed's own count is one).
    expect(today).toHaveTextContent(/\d tables? over 30 minutes/);
  });

  it('the bell says 4 new and opens the alerts; Download today asks for the sheet’s file', async () => {
    const asked: string[] = [];
    api.server.events.on('request:start', ({ request }) =>
      asked.push(new URL(request.url).pathname + new URL(request.url).search),
    );
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:test', revokeObjectURL: () => undefined }),
    );
    const view = renderOwner('/');
    const bell = await screen.findByRole('link', { name: 'Notifications, 4 new' });
    expect(bell).toHaveAttribute('href', '/alerts');
    await userEvent.click(screen.getByRole('button', { name: 'Download today' }));
    await waitFor(() => expect(asked).toContain('/api/owner/sheets/s48/export?format=pdf'));
    await userEvent.click(bell);
    await waitFor(() => expect(wherePath(view)).toBe('/alerts'));
    vi.unstubAllGlobals();
  });

  it('the month so far, credit and money in hand, with the change against the month before', async () => {
    renderOwner('/');
    const month = (await screen.findByRole('heading', { name: 'October so far, 3 days' }))
      .parentElement!;
    expect(month).toHaveTextContent('Earned');
    expect(month).toHaveTextContent('Rs 86,000');
    expect(month).toHaveTextContent('− Rs 19,000');
    expect(month).toHaveTextContent('− Rs 5,100');
    expect(month).toHaveTextContent('Profit');
    expect(month).toHaveTextContent('Rs 61,900');
    expect(month).toHaveTextContent('22% more than the first 3 days of September');

    const credit = screen.getByRole('heading', {
      name: 'Credit pending, all players',
    }).parentElement!;
    expect(credit).toHaveTextContent('Rs 48,300');
    expect(credit).toHaveTextContent('41 players owe money');
    expect(credit).toHaveTextContent('Older than 15 days');
    expect(credit).toHaveTextContent('Rs 12,500, 9 players');

    const hand = screen.getByRole('heading', { name: 'Money in hand today' }).parentElement!;
    expect(hand).toHaveTextContent('Rs 25,600');
    expect(hand).toHaveTextContent('Received Rs 27,050 minus Rs 1,450 expenses paid today');
    for (const chip of ['Bank Rs 3,200', 'Easypaisa Rs 4,100', 'JazzCash Rs 1,300']) {
      expect(within(hand).getByText(chip)).toBeInTheDocument();
    }
  });

  it('earned per day: 30 thin bars, the best day and the axis in words, and where October’s money came from', async () => {
    renderOwner('/');
    const chart = await screen.findByRole('img', {
      name: /^Bar chart of daily earnings from 4 September to 3 October/,
    });
    expect(chart).toHaveAccessibleName(
      'Bar chart of daily earnings from 4 September to 3 October, between Rs 19,900 and Rs 35,600 a day',
    );
    expect(chart.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(30);
    const section = chart.closest('[class*="rounded-card"]') as HTMLElement;
    expect(section).toHaveTextContent('Earned per day, last 30 days');
    expect(section).toHaveTextContent(
      'Weekends are the tall bars. Best day: Sun 27 Sep, Rs 35,600.',
    );
    for (const tick of [
      '36k',
      '24k',
      '12k',
      '0',
      '4 Sep',
      '11 Sep',
      '18 Sep',
      '25 Sep',
      'Today, still open',
    ]) {
      expect(within(section).getByText(tick)).toBeInTheDocument();
    }

    const share = screen.getByRole('heading', {
      name: 'Where October’s money came from',
    }).parentElement!;
    for (const row of [
      ['Snooker frames', 'Rs 51,400', '60%'],
      ['Century', 'Rs 15,500', '18%'],
      ['Rooms', 'Rs 10,800', '13%'],
      ['Canteen sales', 'Rs 8,300', '10%'],
    ]) {
      const item = within(share).getByText(row[0]).closest('li')!;
      expect(item).toHaveTextContent(row[1]);
      expect(item).toHaveTextContent(row[2]);
    }
    expect(share).toHaveTextContent('Canteen profit after buying price: Rs 3,200.');
  });

  it('busiest hours: 17 blue bars, the peak named in words', async () => {
    renderOwner('/');
    const chart = await screen.findByRole('img', { name: /^Average tables in use by hour/ });
    expect(chart).toHaveAccessibleName(
      'Average tables in use by hour, peaking at 7.8 of 9 tables at 10 PM',
    );
    expect(chart.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(17);
    const section = chart.closest('[class*="rounded-card"]') as HTMLElement;
    for (const label of ['12 PM', '4 PM', '8 PM', '10 PM peak, 7.8', '4 AM']) {
      expect(within(section).getByText(label)).toBeInTheDocument();
    }
  });

  it('the biggest debts with their age in days, the top players of 30 days, and "Needs a look"', async () => {
    renderOwner('/');
    const debts = (await screen.findByRole('heading', { name: 'Biggest debts' })).parentElement!;
    expect(debts).toHaveTextContent('Kamran Iqbal 18 days');
    expect(debts).toHaveTextContent('Rs 1,350');
    expect(debts).toHaveTextContent('Ali Haider 25 days');
    expect(debts).toHaveTextContent('Rs 1,200');
    expect(within(debts).getByRole('link', { name: 'See all 41 players who owe' })).toHaveAttribute(
      'href',
      '/players',
    );

    const top = screen.getByRole('heading', { name: 'Top players, last 30 days' }).parentElement!;
    expect(top).toHaveTextContent('Saad Hussain 22 visits');
    expect(top).toHaveTextContent('Rs 9,840');
    expect(top).toHaveTextContent('Bilal Ahmed 18 visits');
    expect(top).toHaveTextContent('Rs 8,350');
    expect(top).toHaveTextContent('Usman Tariq 15 visits');
    expect(within(top).queryByText(/Kamran/)).toBeNull();

    const needs = screen.getByRole('heading', { name: 'Needs a look' }).parentElement!;
    for (const line of [
      '1 frame charged double on Table 4, it ran 36 minutes',
      '2 discounts today, Rs 150 in total',
      'Chips: 3 left. Cigarette packs sold out.',
      '1 frame discarded on Table 6, players left',
    ]) {
      expect(within(needs).getByText(line)).toBeInTheDocument();
    }
    expect(within(needs).getByRole('link', { name: 'Open activity' })).toHaveAttribute(
      'href',
      '/activity',
    );
  });

  it('"Needs a look" has nothing to say on a night with no events, no discounts and full shelves', async () => {
    api.load({ app: 'owner', scenario: 'empty' });
    for (const item of api.db.s.canteenItems) if (item.stock !== null) item.stock = 50;
    api.db.s.today.discounts = { count: 0, total: 0 };
    api.setTime('2026-10-03T22:30:00+05:00');
    renderOwner('/');
    const needs = (await screen.findByRole('heading', { name: 'Needs a look' })).parentElement!;
    expect(needs).toHaveTextContent('Nothing needs a look.');
  });

  it('writes its own words in Urdu, with Western digits', async () => {
    setLanguage('ur');
    renderOwner('/');
    expect(await screen.findByRole('heading', { name: /^آج،/ })).toBeVisible();
    expect(screen.getByText('آج کی کمائی')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'سب سے بڑے ادھار' })).toBeInTheDocument();
    expect(screen.getByText(/33,000/)).toBeInTheDocument();
  });
});

describe('screen 53: the home on a phone', () => {
  beforeEach(() => setPhone(true));

  it('the dark hero, the four small numbers, and the links to Live and the alerts', async () => {
    renderOwner('/');
    const hero = await screen.findByRole('region', { name: 'Earned today' });
    expect(hero).toHaveTextContent('Rs 33,000');
    expect(hero).toHaveTextContent('62 frames, 214 Century minutes, 2 rooms, canteen');
    expect(within(hero).getByRole('link', { name: '6 of 9 in use' })).toHaveAttribute(
      'href',
      '/live',
    );
    expect(within(hero).getByRole('link', { name: /over 30 min$/ })).toHaveAttribute(
      'href',
      '/alerts',
    );
    expect(screen.getByRole('heading', { name: 'Today, Saturday 3 October' })).toBeVisible();
    expect(screen.getByText(/Sheet 48, open since/)).toHaveTextContent(
      'Sheet 48, open since 11:10 AM. Live, 10:30 PM.',
    );
    const smalls = hero.parentElement!;
    expect(smalls).toHaveTextContent('Received');
    expect(smalls).toHaveTextContent('Cash 18,450, online 8,600');
    expect(smalls).toHaveTextContent('Old credit paid 1,800');
    expect(smalls).toHaveTextContent('After Rs 1,450 expenses');
    expect(smalls).toHaveTextContent('Bank 3,200, Easypaisa 4,100, JazzCash 1,300');
  });

  it('needs a look, the last 7 days, the month and the three biggest debts', async () => {
    renderOwner('/');
    const needs = (await screen.findByRole('heading', { name: 'Needs a look' })).parentElement!;
    expect(needs).toHaveTextContent('2 discounts today, Rs 150 in total');
    expect(within(needs).getByRole('link', { name: 'See all alerts' })).toHaveAttribute(
      'href',
      '/alerts',
    );

    const chart = screen.getByRole('img', { name: /^Earned per day, last 7 days/ });
    expect(chart).toHaveAccessibleName(
      'Earned per day, last 7 days. Best was Sunday, Rs 35,600. Today Rs 33,000 so far.',
    );
    expect(chart.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(7);
    expect(screen.getByText('Today, hatched, is still open.')).toBeInTheDocument();

    const month = screen.getByRole('heading', { name: 'October so far, 3 days' }).parentElement!;
    expect(month).toHaveTextContent('Rs 61,900');
    const credit = screen.getByRole('heading', { name: 'Credit pending' }).closest('section')!;
    expect(credit).toHaveTextContent('Rs 48,300');
    expect(credit).toHaveTextContent('41 players. Rs 12,500 is older than 15 days.');
    expect(credit).toHaveTextContent('Kamran Iqbal 18 days');
    expect(credit).toHaveTextContent('Ali Haider 25 days');
    expect(within(credit).getAllByText(/ days$/)).toHaveLength(3);
    expect(
      within(credit).getByRole('link', { name: 'See all players who owe' }),
    ).toBeInTheDocument();
  });
});

describe('screen 37: reports and comparisons', () => {
  it('September against August: four totals, each with its change', async () => {
    renderOwner('/reports');
    const totals = await screen.findByRole('region', { name: 'Totals' });
    expect(totals).toHaveTextContent('EarnedRs 773,000+5.1% vs Rs 735,200');
    expect(totals).toHaveTextContent('ExpensesRs 214,000+2.6% vs Rs 208,500');
    expect(totals).toHaveTextContent(
      'ProfitRs 516,500+6.2% vs Rs 486,400. After expenses and canteen buying cost.',
    );
    expect(totals).toHaveTextContent(
      'Credit pending at month endRs 46,900Counted in earned, not yet received',
    );
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked();
    expect(screen.getByLabelText('Show')).toHaveValue('2026-09');
    expect(screen.getByLabelText('compared with')).toHaveValue('2026-08');
  });

  it('the running total of both months, with each total written at the end of its line', async () => {
    renderOwner('/reports');
    const chart = await screen.findByRole('img', { name: /^Running total of earnings/ });
    expect(chart).toHaveAccessibleName(
      'Running total of earnings: September ends at Rs 773,000, August at Rs 735,200',
    );
    expect(chart.querySelectorAll('.recharts-line')).toHaveLength(2);
    const card = chart.closest('[class*="rounded-card"]') as HTMLElement;
    expect(card).toHaveTextContent('Earned through the month, day by day');
    expect(within(card).getByText('Sep Rs 773,000')).toBeInTheDocument();
    expect(within(card).getByText('Aug Rs 735,200')).toBeInTheDocument();
    for (const tick of ['800k', '600k', '400k', '200k', 'Day 1', 'Day 10', 'Day 20', 'Day 31']) {
      expect(within(card).getByText(tick)).toBeInTheDocument();
    }
  });

  it('by game, by table, by payment method: the figures and changes of the PNG', async () => {
    renderOwner('/reports');
    const game = (await screen.findByRole('heading', { name: 'By game' })).parentElement!;
    const rows = within(game).getAllByRole('row');
    const text = rows.map((row) => row.textContent);
    expect(text[0]).toBe('GameSeptemberAugustChange');
    expect(text[1]).toBe('Snooker frames471,500452,000+4.3%');
    expect(text[2]).toBe('Century139,100128,900+7.9%');
    expect(text[3]).toBe('Rooms92,80088,300+5.1%');
    expect(text[4]).toBe('Canteen sales69,60066,000+5.5%');
    expect(text[5]).toBe('Pool, foosball, carrom, ludo, PlayStation––Not priced');
    expect(text[6]).toBe('Total, Rs773,000735,200+5.1%');

    const table = screen.getByRole('heading', { name: 'By table, September' }).parentElement!;
    const bars = within(table).getAllByRole('listitem');
    expect(bars.map((bar) => bar.textContent)).toEqual([
      'Table 3106,800',
      'Table 1101,200',
      'Table 294,300',
      'Table 691,400',
      'Table 477,500',
      'Table 576,100',
      'Table 763,300',
      'Room 149,500',
      'Room 243,300',
    ]);
    expect((bars[1].children[1] as HTMLElement).style.width).toBe('95%');
    expect((bars[8].children[1] as HTMLElement).style.width).toBe('41%');
    expect(table).toHaveTextContent(
      'Frames and Century together for each table. Table 7 was closed 2 days for a cloth change.',
    );

    const methods = screen.getByRole('heading', {
      name: 'Money received, by payment method',
    }).parentElement!;
    const methodRows = within(methods)
      .getAllByRole('row')
      .map((row) => row.textContent);
    expect(methodRows).toEqual([
      'MethodSeptemberAugustChange',
      'Cash512,600487,900+5.1%',
      'Bank transfer101,40095,800+5.8%',
      'Easypaisa88,90084,300+5.5%',
      'JazzCash31,30028,600+9.4%',
      'Received, Rs734,200696,600+5.4%',
    ]);
    expect(methods).toHaveTextContent('Includes old credit paid back.');
  });

  it('2026 month by month: twelve slots, Sep picked, Oct so far', async () => {
    renderOwner('/reports');
    const chart = await screen.findByRole('img', {
      name: /^Earned per month in 2026/,
    });
    expect(chart).toHaveAccessibleName(
      'Earned per month in 2026 from January Rs 641,000 to September Rs 773,000',
    );
    expect(chart.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(12);
    const card = chart.closest('[class*="rounded-card"]') as HTMLElement;
    expect(card).toHaveTextContent('2026 month by month');
    expect(card).toHaveTextContent('Earned so far this year: Rs 6,224,200');
    expect(card).toHaveTextContent('Jan');
    expect(card).toHaveTextContent('Dec');
    expect(card).toHaveTextContent('so far');
  });

  it('a different month is the same report scaled by what that month earned, and Year and Day work too', async () => {
    renderOwner('/reports');
    const show = await screen.findByLabelText('Show');
    await screen.findAllByRole('option', { name: 'July 2026' });
    await userEvent.selectOptions(show, '2026-07');
    await waitFor(() => expect(screen.getByLabelText('Show')).toHaveValue('2026-07'));
    expect(screen.getByLabelText('compared with')).toHaveValue('2026-06');
    const totals = screen.getByRole('region', { name: 'Totals' });
    await waitFor(() => expect(totals).toHaveTextContent('Rs 721,000'));
    expect(totals).toHaveTextContent('+4.8% vs Rs 688,000');

    await userEvent.click(screen.getByRole('radio', { name: 'Year' }));
    await waitFor(() => expect(screen.getByLabelText('Show')).toHaveValue('2026'));
    expect(screen.getByLabelText('compared with')).toHaveValue('2025');
    expect(await screen.findByText('Earned through the year, month by month')).toBeInTheDocument();
    expect(screen.getByText('Credit pending at year end')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Day' }));
    await waitFor(() => expect(screen.getByLabelText('Show')).toHaveValue('2026-10-03'));
    expect(screen.queryByText(/Earned through the/)).toBeNull();
    expect(screen.getByText('Credit pending at day end')).toBeInTheDocument();
  });

  it('PDF and Excel ask the server for the file of this report', async () => {
    const asked: string[] = [];
    api.server.events.on('request:start', ({ request }) =>
      asked.push(new URL(request.url).pathname + new URL(request.url).search),
    );
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:test', revokeObjectURL: () => undefined }),
    );
    renderOwner('/reports');
    await screen.findByRole('region', { name: 'Totals' });
    await userEvent.click(screen.getByRole('button', { name: 'PDF' }));
    await waitFor(() =>
      expect(
        asked.some(
          (url) =>
            url.startsWith('/api/owner/reports/export') &&
            url.includes('format=pdf') &&
            url.includes('month=2026-09'),
        ),
      ).toBe(true),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Excel' }));
    await waitFor(() => expect(asked.some((url) => url.includes('format=xlsx'))).toBe(true));
    vi.unstubAllGlobals();
  });
});

describe('screen 38: Activity', () => {
  beforeEach(() => {
    api.load({ app: 'owner', scenario: 'closed' });
    api.setTime('2026-10-04T03:45:00+05:00');
    resetOwnerState(Date.parse('2026-10-04T03:45:00+05:00'));
  });

  it('the banner, the chips with their counts, who did it, and the 12 lines of the night', async () => {
    renderOwner('/activity');
    const banner = await screen.findByRole('region', { name: 'Waiting for an owner' });
    expect(banner).toHaveTextContent('1 dispute is waiting for you');
    expect(banner).toHaveTextContent(
      'Table 3, 8:10 PM. Faisal Mehmood vs Naveed Akhtar, frame 3, Rs 250. “Both say the other fouled on the black”',
    );
    expect(
      within(banner)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Faisal pays', 'Naveed pays', 'Half each', 'Nobody pays']);

    const chips = screen.getByRole('group', { name: 'Filter' });
    expect(
      within(chips)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([
      'All, today 12',
      'Discounts 2',
      'Discarded and cancelled 2',
      'Charged double 1',
      'Damage charges 1',
      'Disputes 1',
      'Drawer expenses 1',
      'Edits by owners 1',
      'Left without checkout 1',
      'Cash short or extra 1',
    ]);
    expect(within(chips).getByRole('button', { name: 'All, today 12' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const people = screen.getByRole('group', { name: 'Done by' });
    expect(
      within(people)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Everyone', 'Shabir', 'Zain', 'Aqil', 'Adil']);

    const rows = within(screen.getByRole('table', { name: 'Activity list' })).getAllByRole('row');
    expect(rows).toHaveLength(13); // the heading and 12 events
    expect(rows[1].textContent).toContain('3:40 AMShabirCash short when sheet 48 closed');
    expect(rows[1].textContent).toContain('− 200');
    expect(rows[4].textContent).toContain('10:05 PMAdil FarooqEdited sheet 47');
  });

  it('shows each amount the way the designs write it', async () => {
    renderOwner('/activity');
    const list = await screen.findByRole('table', { name: 'Activity list' });
    const amountOf = (title: string) =>
      within(within(list).getByText(title).closest('[role=row]') as HTMLElement).getAllByRole(
        'cell',
      )[3].textContent;
    expect(amountOf('Cash short when sheet 48 closed')).toBe('− 200');
    expect(amountOf(/^Left without checkout/ as never)).toBe('700');
    expect(amountOf('Discount for Bilal Ahmed')).toBe('− 50');
    expect(amountOf('All games paused, power cut')).toBe('–');
    expect(amountOf('Frame discarded on Table 6')).toBe('250 not charged');
    expect(amountOf('Damage charge for Ali Raza, Table 1')).toBe('+ 1,500');
    expect(amountOf('Charged double on Table 4')).toBe('+ 200');
    expect(amountOf('Expense from the drawer: food')).toBe('− 500');
    expect(amountOf('Unpaid, dispute on Table 3')).toBe('250 waiting');
  });

  it('a chip shows only that kind (Discarded and cancelled is a discard and an undo), and Done by narrows it to one person', async () => {
    renderOwner('/activity');
    await screen.findByRole('table', { name: 'Activity list' });
    const rowsNow = () =>
      within(screen.getByRole('table', { name: 'Activity list' }))
        .getAllByRole('row')
        .slice(1);
    await userEvent.click(screen.getByRole('button', { name: 'Discarded and cancelled 2' }));
    expect(rowsNow().map((row) => within(row).getAllByRole('cell')[2].textContent)).toEqual([
      'Frame discarded on Table 6Players left halfway. “Tariq got a call and left after 12 minutes”',
      'Game undone on Table 5Started by mistake, undone after 40 seconds. No reason needed.',
    ]);
    expect(screen.getByRole('button', { name: 'Discarded and cancelled 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'All, today 12' }));
    await userEvent.click(screen.getByRole('button', { name: 'Adil' }));
    await waitFor(() => expect(rowsNow()).toHaveLength(1));
    expect(rowsNow()[0].textContent).toContain('Edited sheet 47');

    await userEvent.click(screen.getByRole('button', { name: 'Shabir' }));
    await waitFor(() => expect(rowsNow()).toHaveLength(2));

    await userEvent.click(screen.getByRole('button', { name: 'Aqil' }));
    await userEvent.click(screen.getByRole('button', { name: 'Damage charges 1' }));
    expect(await screen.findByText('Nothing here for this filter.')).toBeInTheDocument();
  });

  it('Faisal pays: the banner goes, the dispute is charged to Faisal, and a new line says it was decided by Aqil', async () => {
    renderOwner('/activity');
    const banner = await screen.findByRole('region', { name: 'Waiting for an owner' });
    const before = api.db.player('faisal').balance;
    await userEvent.click(within(banner).getByRole('button', { name: 'Faisal pays' }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Waiting for an owner' })).toBeNull(),
    );
    expect(api.db.player('faisal').balance).toBe(before + 250);

    const list = screen.getByRole('table', { name: 'Activity list' });
    const first = within(list).getAllByRole('row')[1];
    expect(first.textContent).toContain('Aqil Farooq');
    expect(first.textContent).toContain('Dispute on Table 3 decided');
    expect(first.textContent).toContain(
      'Faisal Mehmood vs Naveed Akhtar. Faisal Mehmood pays Rs 250.',
    );
    // The old line stays, no longer waiting.
    const old = within(list)
      .getByText('Unpaid, dispute on Table 3')
      .closest('[role=row]') as HTMLElement;
    expect(old.textContent).toContain('Decided by Aqil');
    expect(within(old).getAllByRole('cell')[3].textContent).toBe('250');
    expect(screen.getByRole('button', { name: 'Disputes 2' })).toBeInTheDocument();
  });

  it.each([
    ['Naveed pays', 0, 250],
    ['Half each', 125, 125],
    ['Nobody pays', 0, 0],
  ])('%s charges Faisal %i and Naveed %i', async (button, faisal, naveed) => {
    renderOwner('/activity');
    const banner = await screen.findByRole('region', { name: 'Waiting for an owner' });
    const was = { f: api.db.player('faisal').balance, n: api.db.player('naveed').balance };
    await userEvent.click(within(banner).getByRole('button', { name: button }));
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Waiting for an owner' })).toBeNull(),
    );
    expect(api.db.player('faisal').balance).toBe(was.f + faisal);
    expect(api.db.player('naveed').balance).toBe(was.n + naveed);
  });

  it('a link at the bottom changes the alerts, in Settings', async () => {
    renderOwner('/activity');
    const section = await screen.findByRole('region', { name: 'Alerts' });
    expect(section).toHaveTextContent(
      'Owners get a phone alert for: sheet closed, left without checkout, game discarded or cancelled, bill or sheet edited, low canteen stock.',
    );
    expect(within(section).getByRole('link', { name: 'Change alerts' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });
});
