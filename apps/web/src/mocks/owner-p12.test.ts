import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from '@/lib/events';
import { canteenSale } from './db/canteen';
import type { MockDb } from './db/db';
import { MockApiError } from './db/errors';
import { discardGame, disputeGame, endGame } from './db/games';
import { createDb, type CreateDbOptions } from './db/load';
import { seed } from './db/seed';
import { activityList, decideDispute } from './owner/activity';
import { dashboard, reports } from './owner/reports';

/** The owner's three reads of P12 (screens 36, 37, 38, 53) and what the counter's writes do to them. */
const at = (iso: string) => Date.parse(iso);
let clock = at('2026-10-03T22:30:00+05:00');
const make = (options: Partial<CreateDbOptions> = {}): MockDb => {
  const own = options.scenario ? seed.scenarios[options.scenario].now : undefined;
  clock = own ? at(own) : at('2026-10-03T22:30:00+05:00');
  return createDb(seed, { app: 'owner', now: () => clock, ...options });
};
const aqil = { id: 'aqil', name: 'Aqil Farooq', role: 'owner' as const };
const zain = { id: 'zain', name: 'Zain', role: 'worker' as const };

beforeEach(() => eventBus.clear());

describe('GET /dashboard: Needs a look as data', () => {
  it('at 10:30 PM: a double on Table 4, two discounts, Chips low and cigarette packs sold out, one discard on Table 6', () => {
    const d = dashboard(make());
    expect(d.needsLook).toEqual([
      {
        kind: 'double',
        tone: 'red',
        count: 1,
        table: { kind: 'snooker', number: '4' },
        minutes: 36,
      },
      { kind: 'discounts', tone: 'amber', count: 2, total: 150 },
      {
        kind: 'stock',
        tone: 'amber',
        low: [{ name: 'Chips', left: 3 }],
        soldOut: ['Cigarette packs'],
      },
      {
        kind: 'discard',
        tone: 'grey',
        count: 1,
        table: { kind: 'snooker', number: '6' },
        reason: 'left',
      },
    ]);
  });

  it('carries the sheet, the limit, and the top players of 30 days with their visits', () => {
    const d = dashboard(make());
    expect(d.sheet).toMatchObject({ id: 's48', number: 48, openedAt: '2026-10-03T11:10:00+05:00' });
    expect(d.today.limitMinutes).toBe(30);
    expect(d.topPlayers).toEqual([
      { playerId: 'saad', name: 'Saad Hussain', visits: 22, spent: 9840 },
      { playerId: 'bilal', name: 'Bilal Ahmed', visits: 18, spent: 8350 },
      { playerId: 'ali-hassan', name: 'Ali Hassan', visits: 9, spent: 7900 },
      { playerId: 'usman-t', name: 'Usman Tariq', visits: 15, spent: 6120 },
    ]);
  });

  it('a frame charged double on the counter adds to it, with its table and minutes', () => {
    const db = make();
    clock = at('2026-10-03T22:06:00+05:00');
    const by = zain;
    // Table 5's double frame is past its limit at 10 PM: the worker charges double.
    endGame(db, by, 'g-t5-d', { loserIds: ['imran', 'naveed'], chargeDouble: true });
    clock = at('2026-10-03T22:30:00+05:00');
    const double = dashboard(db).needsLook.find((item) => item.kind === 'double');
    expect(double).toMatchObject({ count: 2, table: { kind: 'snooker', number: '5' } });
    expect((double as { minutes: number }).minutes).toBeGreaterThan(30);
  });

  it('a frame discarded, a reason of the stop screen, becomes the reason of the sentence', () => {
    const db = make();
    const by = zain;
    discardGame(db, by, 'g-t1-3', { reason: 'Power cut ended the game' });
    const discard = dashboard(db).needsLook.find((item) => item.kind === 'discard');
    expect(discard).toMatchObject({ count: 2, reason: 'power' });
  });

  it('an item that runs out joins the stock line, and a night with nothing says nothing', () => {
    const db = make();
    const by = zain;
    canteenSale(db, by, { playerId: null, payNow: 'cash', items: [{ itemId: 'chips', qty: 3 }] });
    const stock = dashboard(db).needsLook.find((item) => item.kind === 'stock');
    expect(stock).toMatchObject({ low: [], soldOut: ['Chips', 'Cigarette packs'] });

    const quiet = make({ scenario: 'empty' });
    for (const item of quiet.s.canteenItems) if (item.stock !== null) item.stock = 50;
    quiet.s.today.discounts = { count: 0, total: 0 };
    expect(dashboard(quiet).needsLook).toEqual([]);
  });
});

describe('GET /reports: any pair of periods', () => {
  it('September against August is exactly what the seed holds', () => {
    const r = reports(make(), {});
    expect(r).toMatchObject({
      period: 'month',
      month: '2026-09',
      compare: '2026-08',
      earned: [773000, 735200],
      expenses: [214000, 208500],
      canteenCost: [42500, 40300],
      profit: [516500, 486400],
      creditPendingAtEnd: 46900,
    });
    expect(r.byTable[0]).toEqual({ table: { kind: 'snooker', number: '3' }, earned: 106800 });
    expect(r.byTable).toHaveLength(9);
    expect(r.byMethod.map((m) => [m.name, m.amounts[0]])).toEqual([
      ['Cash', 512600],
      ['Bank transfer', 101400],
      ['Easypaisa', 88900],
      ['JazzCash', 31300],
    ]);
    expect(r.race.shown).toHaveLength(30);
    expect(r.race.compared).toHaveLength(31);
    expect(r.race.shown.at(-1)).toBe(773000);
    expect(r.race.compared.at(-1)).toBe(735200);
    expect(r.closedTables).toEqual([
      { table: { kind: 'snooker', number: '7' }, days: 2, note: 'a cloth change' },
    ]);
    expect(r.periods.slice(0, 2)).toEqual(['2026-10', '2026-09']);
    expect(r.periods).toContain('2025-12');
  });

  it('every running total only goes up', () => {
    const r = reports(make(), {});
    for (const series of [r.race.shown, r.race.compared]) {
      series.forEach((value, i) => i === 0 || expect(value).toBeGreaterThanOrEqual(series[i - 1]));
    }
  });

  it('another month is the same report scaled by what it earned, and its profit is still earned − expenses − buying cost', () => {
    const r = reports(make(), { month: '2026-07', compare: '2026-06' });
    expect(r.earned).toEqual([721000, 688000]);
    expect(r.profit[0]).toBe(r.earned[0] - r.expenses[0] - r.canteenCost[0]);
    expect(r.profit[1]).toBe(r.earned[1] - r.expenses[1] - r.canteenCost[1]);
    expect(r.closedTables).toEqual([]);
    expect(r.race.shown.at(-1)).toBe(721000);
    // The compare period is the month before when none is asked for.
    expect(reports(make(), { month: '2026-07' }).compare).toBe('2026-06');
    expect(reports(make(), { month: '2026-01' }).compare).toBe('2025-12');
  });

  it('a year is the months added up, month by month, against the year before', () => {
    const r = reports(make(), { period: 'year' });
    expect(r.month).toBe('2026');
    expect(r.compare).toBe('2025');
    expect(r.earned[0]).toBe(6224200);
    expect(r.race.shown).toHaveLength(10);
    expect(r.race.compared).toHaveLength(12);
    expect(r.race.shown.at(-1)).toBe(6224200);
    expect(r.periods).toEqual(['2026', '2025']);
  });

  it('a day is a sheet’s earned against the day before, with no running total', () => {
    const r = reports(make(), { period: 'day' });
    expect(r.period).toBe('day');
    expect(r.month).toBe('2026-10-03');
    expect(r.compare).toBe('2026-10-02');
    expect(r.earned[0]).toBe(33000);
    expect(r.race).toEqual({ shown: [], compared: [] });
  });

  it('a period with no report is refused', () => {
    let error: unknown;
    try {
      reports(make(), { month: '2031-01' });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).body.code).toBe('NOT_FOUND');
  });
});

describe('GET /activity: the dispute as data', () => {
  it('lists the waiting dispute with its table, players, frame, amount and note, and counts it', () => {
    const list = activityList(make({ scenario: 'closed' }), {});
    expect(list.needsDecision).toBe(1);
    expect(list.disputes).toEqual([
      {
        eventId: 'a2',
        at: '2026-10-03T20:10:00+05:00',
        table: { kind: 'snooker', number: '3' },
        players: [
          { id: 'faisal', name: 'Faisal Mehmood' },
          { id: 'naveed', name: 'Naveed Akhtar' },
        ],
        frameNo: 3,
        amount: 250,
        note: 'Both say the other fouled on the black',
      },
    ]);
    expect(list.counts.all).toBe(12);
  });

  it('a fight marked at the counter has its frame and note, and the oldest waits first', () => {
    const db = make();
    const by = zain;
    disputeGame(db, by, 'g-t4-1', { note: 'Both say the other fouled' });
    const list = activityList(db, {});
    expect(list.disputes.map((d) => d.eventId)).toEqual(['a2', db.s.activity[0].id]);
    expect(list.disputes[1]).toMatchObject({
      table: { kind: 'snooker', number: '4' },
      note: 'Both say the other fouled',
      amount: 200,
    });
  });

  it('deciding writes a new line by the owner, takes the dispute off the list and keeps the old line', () => {
    const db = make({ scenario: 'closed' });
    const decided = decideDispute(db, aqil, 'a2', { payer: 'nobody' });
    expect(decided).toMatchObject({
      type: 'dispute',
      by: aqil,
      title: 'Dispute on Table 3 decided',
    });
    expect(decided.detail).toBe('Faisal Mehmood vs Naveed Akhtar. Nobody pays.');
    expect(decided.amount).toBeUndefined();
    const list = activityList(db, {});
    expect(list.disputes).toEqual([]);
    expect(list.needsDecision).toBe(0);
    expect(list.events[0].id).toBe(decided.id);
    expect(list.counts.all).toBe(13);
    expect(list.counts.dispute).toBe(2);
    expect(list.events.find((e) => e.id === 'a2')?.needsDecision).toBe(false);
  });
});
