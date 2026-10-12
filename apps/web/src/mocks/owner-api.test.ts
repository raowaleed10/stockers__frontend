import { statementBalance } from '@stockers/shared';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as counter from '@/counter/api/calls';
import * as owner from '@/owner/api/calls';
import { ApiError, isApiError, isTooManyTries } from '@/lib/api-client';
import { eventBus } from '@/lib/events';
import { createTestApi } from './test-server';

const api = createTestApi();
beforeAll(() => api.server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => eventBus.clear());
afterAll(() => api.server.close());

async function refused(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call;
  } catch (error) {
    if (isApiError(error)) return error;
    throw error;
  }
  throw new Error('Expected the call to be refused');
}

const asZain = () => counter.signIn({ workerId: 'zain', pin: '2222' });
const asAqil = () => owner.signIn({ ownerId: 'aqil', password: 'dev' });

describe('owner sign-in', () => {
  it('lets either owner in with any password while the mock is on', async () => {
    api.load({ as: 'none', app: 'owner' });
    expect((await owner.signIn({ ownerId: 'adil', password: 'x' })).owner.name).toBe('Adil Farooq');
    expect((await owner.getMe()).owner.id).toBe('adil');
    await owner.signOut();
    expect((await refused(owner.getMe())).status).toBe(401);
  });

  it('says wrong password for an empty one, and after 5 tries makes the owner wait 15 minutes', async () => {
    api.load({ as: 'none', app: 'owner' });
    const wrong = await refused(owner.signIn({ ownerId: 'aqil', password: '' }));
    expect([wrong.status, wrong.code]).toEqual([401, 'WRONG_PASSWORD']);
    for (let i = 0; i < 3; i += 1) await refused(owner.signIn({ ownerId: 'aqil', password: '' }));
    const locked = await refused(owner.signIn({ ownerId: 'aqil', password: '' }));
    expect(isTooManyTries(locked)).toBe(true);
    expect(locked.details).toEqual({ retryAfterSec: 900 });
    expect((await refused(owner.signIn({ ownerId: 'aqil', password: 'right' }))).status).toBe(429);
  });
});

describe('dashboard and reports (screens 36, 37, 53)', () => {
  it('shows the seed numbers at 9:42 PM, with tables in use and red cards counted live', async () => {
    api.load({ app: 'owner' });
    const d = await owner.getDashboard();
    expect(d.today).toMatchObject({
      earned: 33000,
      frames: 62,
      centuryMinutes: 214,
      received: 27050,
      cashReceived: 18450,
      online: 8600,
      newCredit: 2350,
      oldCreditPaid: 1800,
      moneyInHand: 25600,
      tablesInUse: 6,
      tablesTotal: 9,
      over30: 1,
      drawerExpected: 17950,
    });
    expect(d.month).toMatchObject({
      key: '2026-10',
      earned: 86000,
      expenses: 19000,
      canteenCost: 5100,
      profit: 61900,
    });
    expect(d.credit).toMatchObject({ total: 48300, advanceHeld: 3400 });
    expect(d.topPlayers.map((p) => p.playerId)).toEqual([
      'kamran',
      'ali-raza',
      'bilal',
      'faisal',
      'waqas',
    ]);
    expect(d.topDebtors.map((p) => [p.playerId, p.balance])).toEqual([
      ['kamran', 1350],
      ['ali-haider', 1200],
      ['bilal', 1100],
      ['waqas', 950],
      ['junaid', 900],
    ]);
    expect(d.earnedPerDay.values).toHaveLength(30);
    expect(d.busyHours['22']).toBe(7.8);
  });

  it('moves with what the counter writes: a frame ends, the numbers go up', async () => {
    api.load({ app: 'owner' });
    await asZain();
    await counter.endGame('g-t1-3', { loserIds: ['bilal'] });
    await asAqil();
    const d = await owner.getDashboard();
    expect(d.today).toMatchObject({ earned: 33250, frames: 63, tablesInUse: 5 });
    expect(d.month).toMatchObject({ earned: 86250, profit: 62150 });
    expect(d.credit.total).toBe(48550);
  });

  it('serves the September against August report', async () => {
    api.load({ app: 'owner' });
    const r = await owner.getReports({ period: 'month', month: '2026-09', compare: '2026-08' });
    expect(r).toMatchObject({
      month: '2026-09',
      compare: '2026-08',
      earned: [773000, 735200],
      profit: [516500, 486400],
    });
    expect(r.byTable.t3).toBe(106800);
    expect(r.year['09']).toBe(773000);
  });

  it('shows the live board of every table, read only', async () => {
    api.load({ app: 'owner' });
    const live = await owner.getLive();
    expect(live.tables).toHaveLength(28);
    expect(live.tables.filter((t) => t.game)).toHaveLength(6);
  });
});

describe('activity (screen 38)', () => {
  it('lists only what has happened by the demo clock, newest first, with counts', async () => {
    api.load({ app: 'owner' });
    const list = await owner.getActivity();
    expect(list.events.map((e) => e.id)).toEqual(['a4', 'a3', 'a2', 'a1']);
    expect(list.counts).toMatchObject({
      all: 4,
      discount: 1,
      dispute: 1,
      undo: 1,
      'drawer-expense': 1,
    });
    expect(list.needsDecision).toBe(1);
  });

  it('shows all 12 events once the night is over, and filters by type and by who did it', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    const all = await owner.getActivity();
    expect(all.events).toHaveLength(12);
    expect(all.counts.discount).toBe(2);
    expect((await owner.getActivity({ type: 'discount' })).events.map((e) => e.id)).toEqual([
      'a10',
      'a1',
    ]);
    expect((await owner.getActivity({ by: 'shabir' })).events.map((e) => e.id)).toEqual([
      'a12',
      'a11',
    ]);
    expect((await owner.getActivity({ by: 'adil' })).events.map((e) => e.id)).toEqual(['a9']);
    const window = await owner.getActivity({
      from: '2026-10-03T21:45:00+05:00',
      to: '2026-10-03T22:00:00+05:00',
    });
    expect(window.events.map((e) => e.id)).toEqual(['a8', 'a7', 'a6', 'a5']);
  });

  it('lets an owner decide a dispute: half each charges both and keeps the event', async () => {
    api.load({ app: 'owner' });
    const event = await owner.decideDispute('a2', { payer: 'half' });
    expect(event.needsDecision).toBe(false);
    expect(event.detail).toBe(
      'Faisal Mehmood vs Naveed Akhtar, frame 3. “Both say the other fouled on the black” Decided by Aqil: Half each (Rs 125 and Rs 125).',
    );
    const faisal = await owner.getPlayer('faisal');
    expect(faisal.player.balance).toBe(250 + 125);
    expect(faisal.lines.at(-1)).toMatchObject({
      kind: 'frame',
      charge: 125,
      text: 'Frame, Table 3, dispute decided by Aqil',
      doneBy: { name: 'Aqil Farooq', role: 'owner' },
    });
    expect((await owner.getPlayer('naveed')).player.balance).toBe(125);
    expect((await owner.getActivity()).needsDecision).toBe(0);
    expect((await refused(owner.decideDispute('a2', { payer: 'half' }))).status).toBe(400);
  });

  it('can make one player pay all of it, or nobody', async () => {
    api.load({ app: 'owner' });
    await owner.decideDispute('a2', { payer: 'second' });
    expect((await owner.getPlayer('naveed')).player.balance).toBe(250);
    expect((await owner.getPlayer('faisal')).player.balance).toBe(250);

    api.load({ app: 'owner' });
    await owner.decideDispute('a2', { payer: 'nobody' });
    expect((await owner.getPlayer('naveed')).player.balance).toBe(0);
    expect((await refused(owner.decideDispute('a1', { payer: 'first' }))).status).toBe(400);
    expect((await refused(owner.decideDispute('nope', { payer: 'first' }))).status).toBe(404);
  });
});

describe('sheets (screens 39 to 42, 55)', () => {
  it('lists the month folders and the sheets of a month, newest first', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    const folders = await owner.getSheetFolders();
    expect(folders).toHaveLength(8);
    expect(folders[0]).toMatchObject({ month: '2026-10', days: 4, sheets: 4, earned: 89600 });
    const sheets = await owner.getSheets('2026-10');
    expect(sheets.map((s) => [s.id, s.open])).toEqual([
      ['s49', true],
      ['s48', false],
      ['s47', false],
      ['s46', false],
    ]);
    expect(sheets[2]).toMatchObject({ earned: 28400, editedBy: [{ name: 'Adil Farooq' }] });
    expect(await owner.getSheets('2026-08')).toEqual([]);
  });

  it('shows a day’s sheet: who closed it, the cash check and the history with names (screens 41, 42)', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    const sheet = await owner.getSheet('s48');
    expect(sheet).toMatchObject({
      number: 48,
      open: false,
      closedBy: { name: 'Shabir' },
      earned: 35150,
      received: 33300,
      cash: {
        expected: 21750,
        counted: 21550,
        difference: -200,
        note: 'Gave Rs 200 change from the drawer for a bank payment',
      },
      online: { bank: 4400, easypaisa: 5350, jazzcash: 1300 },
      byTable: { t1: 5250, r2: 3750 },
      canteen: { sales: 4560, items: 97, profit: 1780 },
    });
    expect(sheet.entries.map((e) => e.id)).toContain('century-minutes');
    expect(sheet.history.at(-1)).toMatchObject({
      by: { name: 'Shabir' },
      text: 'Closed sheet 48: counted Rs 21,550',
    });
    expect((await owner.getSheet('s49')).open).toBe(true);
    expect((await refused(owner.getSheet('s99'))).status).toBe(404);
  });

  it('lets an owner correct an entry with a reason, and records who, what and why (D30)', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    const edited = await owner.editSheetEntry('s48', 'earned', {
      value: 35000,
      reason: 'Counted twice',
    });
    expect(edited.earned).toBe(35000);
    expect(edited.entries.find((e) => e.id === 'earned')?.value).toBe(35000);
    expect(edited.editedBy?.map((p) => p.name)).toEqual(['Aqil Farooq']);
    expect(edited.history.at(-1)).toMatchObject({
      by: { name: 'Aqil Farooq' },
      text: 'Edited earned: Rs 35,150 to Rs 35,000. “Counted twice”',
      amount: -150,
    });
    const events = (await owner.getActivity()).events;
    expect(events[0]).toMatchObject({
      type: 'edit',
      title: 'Edited sheet 48: Earned Rs 35,150 to Rs 35,000',
      detail: '“Counted twice”',
      amount: -150,
      sheetId: 's48',
      by: { name: 'Aqil Farooq' },
    });
    expect((await owner.getNotifications()).notifications[0]).toMatchObject({
      kind: 'edited',
      title: 'Aqil edited sheet 48',
      read: false,
    });
  });

  it('works out the cash check again when the cash received is corrected', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    const edited = await owner.editSheetEntry('s48', 'cash-received', {
      value: 22450,
      reason: 'Missed a payment',
    });
    expect(edited.cash).toMatchObject({
      received: 22450,
      expected: 21950,
      counted: 21550,
      difference: -400,
    });
  });

  it('refuses an edit with no reason, a bad number, or no change', async () => {
    api.load({ app: 'owner', scenario: 'closed' });
    expect(
      (await refused(owner.editSheetEntry('s48', 'earned', { value: 1, reason: ' ' }))).code,
    ).toBe('NOTE_REQUIRED');
    expect(
      (await refused(owner.editSheetEntry('s48', 'earned', { value: -5, reason: 'x' }))).code,
    ).toBe('VALIDATION');
    expect(
      (await refused(owner.editSheetEntry('s48', 'earned', { value: 35150, reason: 'x' }))).code,
    ).toBe('VALIDATION');
    expect(
      (await refused(owner.editSheetEntry('s48', 'nothing', { value: 1, reason: 'x' }))).status,
    ).toBe(404);
  });

  it('corrects the open sheet’s running totals too', async () => {
    api.load({ app: 'owner' });
    await owner.editSheetEntry('s48', 'frames', { value: 60, reason: 'Two frames were practice' });
    expect((await owner.getSheet('s48')).frames).toBe(60);
    await asZain();
    expect((await counter.getToday()).frames).toBe(60);
  });

  it('gives a download for each format', async () => {
    api.load({ app: 'owner' });
    const pdf = await owner.exportSheet('s48', 'pdf');
    expect(await pdf.text()).toContain('Sheet 48 (pdf)');
    expect(await (await owner.exportSheet('s48', 'xlsx')).text()).toContain('Sheet 48 (xlsx)');
  });
});

describe('players and credit (screens 43, 44, 56)', () => {
  it('counts who owes, who holds an advance and who owes old credit', async () => {
    api.load({ app: 'owner' });
    const all = await owner.getPlayers();
    expect(all.counts).toEqual({ all: 21, owe: 10, advance: 1, old: 4 });
    expect(all.totals).toEqual({ credit: 48300, olderThan15Days: 12500, advanceHeld: 3400 });
    expect((await owner.getPlayers('old')).players.map((p) => p.id).sort()).toEqual([
      'ali-haider',
      'junaid',
      'kamran',
      'rizwan',
    ]);
    expect((await owner.getPlayers('advance')).players.map((p) => p.id)).toEqual(['saad']);
  });

  it('shows the whole phone number and the statement, oldest first', async () => {
    api.load({ app: 'owner' });
    const { player, lines } = await owner.getPlayer('kamran');
    expect(player).toMatchObject({ phone: '0313 1452276', phoneTail: '•••• 2276', balance: 1350 });
    expect(lines).toHaveLength(8);
    expect(statementBalance(lines)).toBe(1350);
  });

  it('records a payment from the player’s page under the owner’s name', async () => {
    api.load({ app: 'owner' });
    const result = await owner.addPayment('kamran', {
      method: 'cash',
      amount: 500,
      note: 'Paid in person',
    });
    expect(result.player.balance).toBe(850);
    expect(result.line).toMatchObject({
      kind: 'payment',
      paid: 500,
      balance: 850,
      method: 'cash',
      doneBy: { name: 'Aqil Farooq', role: 'owner' },
    });
    await asZain();
    expect(await counter.getToday()).toMatchObject({ cashReceived: 18950, oldCreditPaid: 2300 });
    await asAqil();
    expect((await refused(owner.addPayment('kamran', { method: 'cash', amount: 0 }))).status).toBe(
      400,
    );
    expect(
      (await refused(owner.addPayment('kamran', { method: 'barter', amount: 100 }))).status,
    ).toBe(400);
  });

  it('enters old credit from the register as an opening balance (D28), or an advance', async () => {
    api.load({ app: 'owner' });
    const credit = await owner.setOpeningBalance('hamid', {
      amount: 700,
      note: 'From the register',
    });
    expect(credit.line).toMatchObject({ kind: 'opening', charge: 700, text: 'From the register' });
    expect(credit.player.balance).toBe(700);
    const advance = await owner.setOpeningBalance('imran', { amount: -300 });
    expect(advance.line).toMatchObject({ kind: 'advance', paid: 300 });
    expect(advance.player.balance).toBe(-300);
    for (const id of ['hamid', 'imran']) {
      const { player, lines } = await owner.getPlayer(id);
      expect(statementBalance(lines)).toBe(player.balance);
    }
    expect((await refused(owner.setOpeningBalance('hamid', { amount: 0 }))).status).toBe(400);
  });

  it('corrects a statement line: every balance after it is worked out again, and the edit is recorded', async () => {
    api.load({ app: 'owner' });
    const change = await owner.patchStatementLine('l-kamran-1', {
      charge: 300,
      reason: 'It was Rs 300',
    });
    expect(change.player.balance).toBe(1400);
    const { lines } = await owner.getPlayer('kamran');
    expect(lines.map((l) => l.balance)).toEqual([300, 50, 300, 550, 670, 670, 1150, 1400]);
    expect(statementBalance(lines)).toBe(1400);
    expect((await owner.getActivity()).events[0]).toMatchObject({
      type: 'edit',
      by: { name: 'Aqil Farooq' },
      detail: 'Rs 250 to Rs 300. “It was Rs 300”',
      amount: 50,
    });
    expect(
      (await refused(owner.patchStatementLine('l-kamran-1', { charge: 1, reason: '' }))).code,
    ).toBe('NOTE_REQUIRED');
    expect(
      (await refused(owner.patchStatementLine('nope', { charge: 1, reason: 'x' }))).status,
    ).toBe(404);
  });

  it('changes a player’s details', async () => {
    api.load({ app: 'owner' });
    const player = await owner.patchPlayer('kamran', { nick: 'Kamo', note: 'Pays on Fridays' });
    expect(player).toMatchObject({ nick: 'Kamo', note: 'Pays on Fridays' });
    expect((await refused(owner.patchPlayer('kamran', { name: ' ' }))).code).toBe('VALIDATION');
  });
});

describe('prices and games (screens 45 to 47, 57)', () => {
  it('sets a price on several tables at once; a game already started keeps its price (D5)', async () => {
    api.load({ app: 'owner' });
    const tables = await owner.patchTable('t1', { price: 270, alsoTableIds: ['t2', 't3'] });
    expect(tables.map((t) => [t.id, t.price])).toEqual([
      ['t1', 270],
      ['t2', 270],
      ['t3', 270],
    ]);
    const prices = await owner.getPrices();
    expect(prices.categories.find((c) => c.id === 'snooker')?.tables.map((t) => t.price)).toEqual([
      270, 270, 270, 200, 200, 250, 200,
    ]);
    expect((await owner.getActivity()).events[0]).toMatchObject({
      type: 'price-change',
      title: 'Price changed: Table 1, Table 2, Table 3',
      detail: 'Rs 250 to Rs 270. Games already started keep the old price.',
      by: { name: 'Aqil Farooq' },
    });
    await asZain();
    const board = await counter.getBoard();
    expect(board.tables.find((t) => t.id === 't1')).toMatchObject({
      price: 270,
      game: { price: 250 },
    });
    expect((await counter.endGame('g-t1-3', { loserIds: ['bilal'] })).amount).toBe(250);
    const next = await counter.nextFrame('g-t1-3');
    expect(next.price).toBe(250); // the next frame keeps the price the session started at
  });

  it('only lets tables of the same game share a price, and refuses a bad price', async () => {
    api.load({ app: 'owner' });
    expect(
      (await refused(owner.patchTable('t1', { price: 270, alsoTableIds: ['po1'] }))).status,
    ).toBe(400);
    expect((await refused(owner.patchTable('t1', { price: 12.5 }))).status).toBe(400);
    expect((await refused(owner.patchTable('t1', { price: -1 }))).status).toBe(400);
  });

  it('puts a table out of order with a note, and back (screen 16)', async () => {
    api.load({ app: 'owner' });
    expect((await refused(owner.patchTable('t1', { outOfOrder: { note: 'Cloth' } }))).code).toBe(
      'TABLE_BUSY',
    );
    expect((await refused(owner.patchTable('t2', { outOfOrder: { note: ' ' } }))).code).toBe(
      'NOTE_REQUIRED',
    );
    const [t2] = await owner.patchTable('t2', { outOfOrder: { note: 'Cloth change' } });
    expect(t2.outOfOrder).toMatchObject({ note: 'Cloth change', by: { name: 'Aqil Farooq' } });
    await asZain();
    expect(
      (
        await refused(
          counter.startGame({ tableId: 't2', type: 'single', playerIds: ['imran', 'naveed'] }),
        )
      ).code,
    ).toBe('TABLE_OUT_OF_ORDER');
    await asAqil();
    expect((await owner.patchTable('t2', { outOfOrder: null }))[0].outOfOrder).toBeUndefined();
  });

  it('sets a price card for a whole game: pool tables unlock and the counter can start a game', async () => {
    api.load({ app: 'owner' });
    const card = await owner.patchCategory('pool', { price: 300 });
    expect(card.tables.map((t) => t.price)).toEqual([300, 300, 300, 300]);
    await asZain();
    const game = await counter.startGame({
      tableId: 'po1',
      type: 'game',
      playerIds: ['imran', 'naveed'],
    });
    expect(game).toMatchObject({ type: 'game', price: 300 });
    expect((await counter.endGame(game.id, { loserIds: ['naveed'] })).lines[0]).toMatchObject({
      kind: 'game',
      charge: 300,
    });
  });

  it('sets the Century rate on the price card for snooker only', async () => {
    api.load({ app: 'owner' });
    expect((await owner.patchCategory('snooker', { centuryRate: 20 })).centuryRate).toBe(20);
    expect((await refused(owner.patchCategory('pool', { centuryRate: 20 }))).status).toBe(400);
    expect((await refused(owner.patchCategory('chess', { price: 5 }))).status).toBe(404);
    await asZain();
    expect(
      (await counter.startGame({ tableId: 't2', type: 'century', underPlayerId: 'saad' })).price,
    ).toBe(20);
  });

  it('adds the next table to a game, or a new game with its first table (D4)', async () => {
    api.load({ app: 'owner' });
    expect(await owner.addTable({ categoryId: 'snooker', price: 250 })).toMatchObject({
      id: 't8',
      name: 'Table 8',
      number: '8',
      kind: 'snooker',
      price: 250,
    });
    expect(await owner.addTable({ categoryId: 'room', price: 1500 })).toMatchObject({
      id: 'r3',
      name: 'Room 3',
      number: 'R3',
    });
    expect(await owner.addTable({ categoryId: 'pool', price: null })).toMatchObject({
      id: 'po5',
      name: 'Pool table 5',
      price: null,
    });
    const first = await owner.addTable({
      categoryName: 'Table tennis',
      kind: 'foosball',
      price: null,
    });
    expect(first).toMatchObject({ id: 'table-tennis1', name: 'Table tennis 1', number: '1' });
    const prices = await owner.getPrices();
    expect(prices.categories.map((c) => c.id).at(-1)).toBe('table-tennis');
    expect((await refused(owner.addTable({ price: 100 }))).status).toBe(400);
    expect(
      (
        await refused(
          owner.addTable({ categoryName: 'Table tennis', kind: 'foosball', price: null }),
        )
      ).status,
    ).toBe(400);
    await asZain();
    expect((await counter.getBoard('table-tennis')).tables).toHaveLength(1);
  });
});

describe('canteen (screen 48)', () => {
  it('shows the buying price and stock to the owners', async () => {
    api.load({ app: 'owner' });
    const { items } = await owner.getCanteen();
    expect(items.find((i) => i.id === 'tea')).toMatchObject({
      sell: 50,
      buy: 18,
      buyIsEstimate: true,
      stock: null,
    });
    expect(items.find((i) => i.id === 'chips')).toMatchObject({ stock: 3, lowAt: 5 });
  });

  it('adds an item and stock, and refuses stock for an item that is made fresh', async () => {
    api.load({ app: 'owner' });
    const item = await owner.addCanteenItem({
      name: 'Juice box',
      category: 'drinks',
      sell: 90,
      buy: 60,
      stock: 10,
      lowAt: 3,
    });
    expect(item.id).toBe('juice-box');
    expect((await owner.addStock({ itemId: 'juice-box', add: 5 })).stock).toBe(15);
    expect((await owner.addStock({ itemId: 'juice-box', add: -15 })).stock).toBe(0);
    expect((await refused(owner.addStock({ itemId: 'juice-box', add: -1 }))).status).toBe(400);
    expect((await refused(owner.addStock({ itemId: 'tea', add: 5 }))).message).toBe(
      'Tea is made fresh, so it has no stock.',
    );
    expect(
      (
        await refused(
          owner.addCanteenItem({ name: '', category: 'food', sell: 1, buy: 1, stock: 1, lowAt: 1 }),
        )
      ).status,
    ).toBe(400);
    await asZain();
    expect((await counter.getCanteenItems()).find((i) => i.id === 'juice-box')).toEqual({
      id: 'juice-box',
      name: 'Juice box',
      category: 'drinks',
      sell: 90,
      stock: 0,
      lowAt: 3,
    });
  });

  it('lists the sales the counter made, with who sold them', async () => {
    api.load({ app: 'owner' });
    await asZain();
    await counter.sellCanteen({
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'tea', qty: 2 }],
    });
    await asAqil();
    const { sales } = await owner.getCanteen();
    expect(sales[0]).toMatchObject({ total: 100, paidNow: 'cash', doneBy: { name: 'Zain' } });
  });
});

describe('expenses (screen 49)', () => {
  it('lists October with the month total and what came from the drawer, who added each', async () => {
    api.load({ app: 'owner' });
    const list = await owner.getExpenses();
    expect(list).toMatchObject({ month: '2026-10', total: 19000, drawerTotal: 500 });
    expect(list.items).toHaveLength(8);
    expect(list.items[0]).toMatchObject({
      what: 'Dinner for staff',
      paidFrom: 'drawer',
      source: 'counter',
      doneBy: { name: 'Zain' },
    });
    expect((await owner.getExpenses('2026-09')).items).toEqual([]);
  });

  it('adds, changes and removes an expense, and the month profit follows', async () => {
    api.load({ app: 'owner' });
    const added = await owner.addExpense({
      what: 'Internet bill, October',
      category: 'bills',
      amount: 1000,
      paidFrom: 'bank',
    });
    expect(added).toMatchObject({
      source: 'owner',
      doneBy: { name: 'Aqil Farooq', role: 'owner' },
      amount: 1000,
    });
    expect((await owner.getDashboard()).month).toMatchObject({ expenses: 20000, profit: 60900 });
    expect((await owner.getExpenses()).items[0].id).toBe(added.id);

    const changed = await owner.patchExpense(added.id, { amount: 1500 });
    expect(changed.amount).toBe(1500);
    expect((await owner.getDashboard()).month.expenses).toBe(20500);

    expect((await owner.deleteExpense(added.id)).id).toBe(added.id);
    expect((await owner.getDashboard()).month).toMatchObject({ expenses: 19000, profit: 61900 });
    expect((await owner.getExpenses()).items).toHaveLength(8);
    const log = (await owner.getActivity()).events.slice(0, 2).map((e) => e.title);
    expect(log).toEqual([
      'Removed expense: Internet bill, October',
      'Edited expense: Internet bill, October',
    ]);
  });

  it('records a staff salary or advance with the staff name (Q15)', async () => {
    api.load({ app: 'owner' });
    const advance = await owner.addExpense({
      what: 'Advance, Zain',
      category: 'staff',
      amount: 3000,
      paidFrom: 'owner',
      staffName: 'Zain',
    });
    expect(advance.staffName).toBe('Zain');
    expect(
      (
        await refused(
          owner.addExpense({
            what: 'x',
            category: 'staff',
            amount: 5,
            paidFrom: 'owner',
            staffName: ' ',
          }),
        )
      ).status,
    ).toBe(400);
  });

  it('an expense paid from the drawer comes off what the drawer should have', async () => {
    api.load({ app: 'owner' });
    const expense = await owner.addExpense({
      what: 'Tape',
      category: 'repairs',
      amount: 200,
      paidFrom: 'drawer',
    });
    expect(expense.sheetId).toBe('s48');
    await asZain();
    expect(await counter.getToday()).toMatchObject({ drawerExpenses: 700, drawerExpected: 17750 });
    await asAqil();
    await owner.deleteExpense(expense.id);
    await asZain();
    expect((await counter.getToday()).drawerExpected).toBe(17950);
  });

  it('refuses a missing description or a bad amount, and an unknown expense', async () => {
    api.load({ app: 'owner' });
    expect(
      (
        await refused(
          owner.addExpense({ what: ' ', category: 'bills', amount: 5, paidFrom: 'owner' }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await refused(
          owner.addExpense({ what: 'x', category: 'bills', amount: 0, paidFrom: 'owner' }),
        )
      ).status,
    ).toBe(400);
    expect((await refused(owner.patchExpense('e99', { amount: 5 }))).status).toBe(404);
    expect((await refused(owner.deleteExpense('e99'))).status).toBe(404);
  });
});

describe('workers (screen 50)', () => {
  it('lists the workers and their times, and never sends a PIN', async () => {
    api.load({ app: 'owner' });
    const workers = await owner.getWorkers();
    expect(workers.map((w) => [w.name, w.slot.start, w.slot.end, w.enabled, w.pinSet])).toEqual([
      ['Shabir', '02:00', '10:00', true, true],
      ['Zain', '14:00', '23:00', true, true],
    ]);
    expect(JSON.stringify(workers)).not.toMatch(/1111|2222|"pin"/);
    expect(workers[1].signedIn?.at).toBe('2026-10-03T14:06:00+05:00');
  });

  it('adds a worker with his own PIN and time, who can then sign in at his time', async () => {
    api.load({ app: 'owner' });
    const sajid = await owner.addWorker({
      name: 'Sajid',
      slot: { start: '22:00', end: '06:00' },
      pin: '3333',
    });
    expect(sajid).toMatchObject({ id: 'sajid', enabled: true, pinSet: true });
    expect(sajid).not.toHaveProperty('pin');
    expect((await counter.getPublicWorkers()).find((w) => w.id === 'sajid')?.canSignInNow).toBe(
      false,
    );
    api.setTime('2026-10-03T22:30:00+05:00');
    expect((await counter.signIn({ workerId: 'sajid', pin: '3333' })).until).toBe(
      '2026-10-04T06:00:00+05:00',
    );
  });

  it('changing a time signs a worker out when his time has already ended, and the counter list follows', async () => {
    api.load({ app: 'owner' });
    await owner.patchWorker('zain', { slot: { start: '14:00', end: '21:00' } });
    expect((await counter.getPublicWorkers()).find((w) => w.id === 'zain')).toMatchObject({
      slot: { start: '14:00', end: '21:00' },
      canSignInNow: false,
    });
    api.db.s.auth.session = { kind: 'worker', workerId: 'zain', at: '2026-10-03T14:06:00+05:00' };
    expect((await refused(counter.getBoard())).code).toBe('SESSION_ENDED');
    await asAqil();
    expect((await owner.getActivity()).events[0]).toMatchObject({
      type: 'worker-change',
      title: 'Sign-in time changed for Zain',
      detail: '2:00 PM to 11:00 PM, changed to 2:00 PM to 9:00 PM',
    });
  });

  it('turns a worker’s sign-in off, and he disappears from the counter list', async () => {
    api.load({ app: 'owner' });
    await owner.patchWorker('shabir', { enabled: false });
    expect((await counter.getPublicWorkers()).map((w) => w.id)).toEqual(['zain']);
    expect((await owner.getWorkers())[0].enabled).toBe(false);
  });

  it('sets a new PIN: the old one stops working, and the PIN is never written to Activity', async () => {
    api.load({ app: 'owner' });
    await owner.setWorkerPin('zain', { pin: '5555' });
    expect((await refused(counter.signIn({ workerId: 'zain', pin: '2222' }))).code).toBe(
      'WRONG_PIN',
    );
    expect((await counter.signIn({ workerId: 'zain', pin: '5555' })).worker.id).toBe('zain');
    await asAqil();
    const log = JSON.stringify((await owner.getActivity()).events);
    expect(log).toContain('PIN changed for Zain');
    expect(log).not.toContain('5555');
  });

  it('refuses a PIN that is not 4 digits and a time with no span', async () => {
    api.load({ app: 'owner' });
    expect((await refused(owner.setWorkerPin('zain', { pin: 'abcd' }))).status).toBe(400);
    expect((await refused(owner.setWorkerPin('zain', { pin: '123' }))).status).toBe(400);
    expect(
      (await refused(owner.patchWorker('zain', { slot: { start: '10:00', end: '10:00' } }))).status,
    ).toBe(400);
    expect(
      (await refused(owner.patchWorker('zain', { slot: { start: '25:00', end: '10:00' } }))).status,
    ).toBe(400);
    expect(
      (
        await refused(
          owner.addWorker({ name: '', slot: { start: '01:00', end: '02:00' }, pin: '1234' }),
        )
      ).status,
    ).toBe(400);
    expect((await refused(owner.patchWorker('nobody', { enabled: false }))).status).toBe(404);
  });
});

describe('settings and the private address (screen 51)', () => {
  it('shows the rules, the payment methods and the club', async () => {
    api.load({ app: 'owner' });
    const settings = await owner.getSettings();
    expect(settings.rules).toEqual({
      doubleAfterMin: 30,
      lockAfterMin: 5,
      undoWindowSec: 120,
      changeTypeWindowMin: 5,
      oldCreditDays: 15,
      roomMinMinutes: 60,
      slotWarningMin: 10,
    });
    expect(settings.paymentMethods.map((m) => m.id)).toEqual([
      'cash',
      'bank',
      'easypaisa',
      'jazzcash',
    ]);
    expect(settings.club).toEqual({ name: 'Stockers', address: 'Mian Plaza' });
    expect(settings.email).toEqual({});
    expect(settings.backups).toMatchObject({ keep: 60, usb: true });
  });

  it('switching an alert off stops those notifications', async () => {
    api.load({ app: 'owner' });
    await owner.patchSettings({
      alerts: {
        'low-stock': false,
        'sheet-closed': true,
        'left-without-checkout': true,
        'cancelled-or-discarded': true,
        edited: true,
      },
    });
    await asZain();
    await counter.sellCanteen({
      playerId: null,
      payNow: 'cash',
      items: [{ itemId: 'cold-drink', qty: 19 }],
    });
    await asAqil();
    expect(
      (await owner.getNotifications()).notifications.some(
        (n) => n.kind === 'low-stock' && n.title === 'Cold drink running low',
      ),
    ).toBe(false);
  });

  it('adds a payment method the counter then offers, and keeps cash always on', async () => {
    api.load({ app: 'owner' });
    const methods = (await owner.getSettings()).paymentMethods;
    await owner.patchSettings({
      paymentMethods: [...methods, { id: 'cheque', name: 'Cheque', enabled: true }],
    });
    await asZain();
    expect((await counter.getCheckoutBill('bilal')).methods.map((m) => m.id)).toContain('cheque');
    await asAqil();
    expect(
      (
        await refused(
          owner.patchSettings({
            paymentMethods: methods.map((m) => (m.id === 'cash' ? { ...m, enabled: false } : m)),
          }),
        )
      ).message,
    ).toBe('Cash is always on.');
    expect(
      (await refused(owner.patchSettings({ paymentMethods: [...methods, methods[1]] }))).status,
    ).toBe(400);
  });

  it('saves email addresses, and refuses one that does not look right', async () => {
    api.load({ app: 'owner' });
    expect((await owner.patchSettings({ email: { aqil: 'aqil@example.pk' } })).email).toEqual({
      aqil: 'aqil@example.pk',
    });
    expect(
      (await refused(owner.patchSettings({ email: { adil: 'adil-at-example' } }))).status,
    ).toBe(400);
    expect((await owner.getActivity()).events[0]).toMatchObject({
      type: 'settings-change',
      title: 'Settings changed: email addresses',
      by: { name: 'Aqil Farooq' },
    });
  });

  it('makes a new private address, shows it once, signs every owner out and never writes it down', async () => {
    api.load({ app: 'owner' });
    const { address } = await owner.changeOwnerAddress();
    expect(address).toMatch(/^stockers\.pk\/owner-[a-z0-9]{6}\/$/);
    expect((await refused(owner.getMe())).status).toBe(401);
    await asAqil();
    const log = JSON.stringify((await owner.getActivity()).events);
    expect(log).toContain('Private address changed');
    expect(log).not.toContain(address.split('/')[1]);
  });

  it('signs out every owner on request', async () => {
    api.load({ app: 'owner' });
    await owner.signOutAll();
    expect((await refused(owner.getDashboard())).status).toBe(401);
  });
});

describe('notifications (screen 58)', () => {
  it('lists what has happened by the clock, and marks them all read', async () => {
    api.load({ app: 'owner' });
    const first = await owner.getNotifications();
    expect(first.notifications.map((n) => n.id)).toEqual(['n2', 'n1']);
    expect(first.unread).toBe(0);

    api.load({ app: 'owner', scenario: 'closed' });
    const closed = await owner.getNotifications();
    expect(closed.notifications).toHaveLength(6);
    expect(closed.unread).toBe(2);
    const after = await owner.readAllNotifications();
    expect(after.unread).toBe(0);
    expect((await owner.getDashboard()).unread).toBe(0);
  });

  it('tells the owners when the counter closes a sheet, with the numbers', async () => {
    api.load({ app: 'owner', scenario: 'closing' });
    await counter.signIn({ workerId: 'shabir', pin: '1111' });
    const result = await counter.closeSheet({ counted: 21550, note: 'Change for a bank payment' });
    expect(result.newSheet.id).toBe('s49');
    await asAqil();
    const { notifications, unread } = await owner.getNotifications();
    expect(notifications[0]).toMatchObject({
      kind: 'sheet-closed',
      title: 'Sheet 48 closed by Shabir',
      text: 'Earned Rs 35,150. Cash counted Rs 21,550, Rs 200 short.',
    });
    expect(unread).toBeGreaterThanOrEqual(2);
    expect((await owner.getSheetFolders())[0]).toMatchObject({ sheets: 5, earned: 89600 + 35150 });
  });
});

describe('every action has a name (D52)', () => {
  it('puts the right name on everything a night of work records', async () => {
    const db = api.load({ app: 'owner' });
    const known = async () => new Set((await owner.getActivity()).events.map((e) => e.id));
    const before = await known();

    await counter.signIn({ workerId: 'zain', pin: '2222' });
    const game = await counter.startGame({
      tableId: 't2',
      type: 'single',
      playerIds: ['ahmed-nawaz', 'ali-akbar'],
    });
    api.advance(30_000);
    await counter.undoGame(game.id);
    await counter.discardGame('g-t6-1', { reason: 'Players left', note: 'Phone call' });
    await counter.damageCharge('g-t1-3', {
      playerId: 'ali-raza',
      item: 'Cue',
      amount: 1500,
      note: 'Snapped',
    });
    await counter.endGame('g-t4-1', { loserIds: ['zubair'], chargeDouble: true });
    await counter.addDrawerExpense({ category: 'other', amount: 100, note: 'Tape' });
    await counter.sellCanteen({ playerId: 'bilal', items: [{ itemId: 'tea', qty: 1 }] });
    await counter.payCheckout('bilal', {
      playerId: 'bilal',
      parts: [{ method: 'cash', amount: 100 }],
      toCredit: 1000,
      discount: { amount: 50, reason: 'Rounded the bill' },
    });
    await asAqil();
    await owner.patchTable('t1', { price: 260 });
    await owner.addExpense({ what: 'Chalk', category: 'repairs', amount: 300, paidFrom: 'owner' });

    const added = (await owner.getActivity()).events.filter((e) => !before.has(e.id));
    expect(added.map((e) => [e.type, e.by.name]).sort()).toEqual([
      ['damage', 'Zain'],
      ['discard', 'Zain'],
      ['discount', 'Zain'],
      ['double-charge', 'Zain'],
      ['drawer-expense', 'Zain'],
      ['price-change', 'Aqil Farooq'],
      ['undo', 'Zain'],
    ]);

    // Every record in the store, not only Activity, carries a real person's name.
    const people = new Set(['Zain', 'Shabir', 'Aqil Farooq', 'Adil Farooq']);
    for (const lines of Object.values(db.s.sheetHistory))
      for (const line of lines) expect(people).toContain(line.by.name);
    for (const lines of Object.values(db.s.statements))
      for (const line of lines) expect(people).toContain(line.doneBy.name);
    for (const expense of db.s.expenses) expect(people).toContain(expense.doneBy.name);
    for (const game of db.s.games) expect(people).toContain(game.startedBy.name);
    expect(db.s.sheetHistory.s48.length).toBeGreaterThanOrEqual(8);
  });
});
