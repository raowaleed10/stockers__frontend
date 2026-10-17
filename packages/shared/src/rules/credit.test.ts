import { describe, expect, it } from 'vitest';
import {
  balanceKind,
  creditAgeDays,
  isOldCredit,
  runningBalances,
  statementBalance,
  statementSince,
} from './credit';

const at = (iso: string) => Date.parse(iso);
const NIGHT = at('2026-10-03T22:25:00+05:00');

describe('creditAgeDays', () => {
  it('counts calendar days in club time, as on screen 30', () => {
    expect(creditAgeDays('2026-09-15T21:10:00+05:00', NIGHT)).toBe(18); // Kamran
    expect(creditAgeDays('2026-09-08T20:30:00+05:00', NIGHT)).toBe(25); // Ali Haider
    expect(creditAgeDays('2026-09-27T21:00:00+05:00', NIGHT)).toBe(6); // Waqas
    expect(creditAgeDays('2026-09-30T23:10:00+05:00', NIGHT)).toBe(3); // Shoaib
  });

  it('is 0 for a charge from tonight', () => {
    expect(creditAgeDays('2026-10-03T20:00:00+05:00', NIGHT)).toBe(0);
  });

  it('changes day at midnight in Pakistan, not at midnight UTC', () => {
    // 23:30 on 2 Oct (club) is 18:30 UTC; 00:30 on 3 Oct (club) is 19:30 UTC on the 2nd.
    expect(creditAgeDays('2026-10-02T23:30:00+05:00', at('2026-10-03T00:30:00+05:00'))).toBe(1);
  });
});

describe('isOldCredit', () => {
  it('is old only when more than 15 days', () => {
    expect(isOldCredit('2026-09-18T12:00:00+05:00', NIGHT)).toBe(false); // 15 days
    expect(isOldCredit('2026-09-17T12:00:00+05:00', NIGHT)).toBe(true); // 16 days
    expect(isOldCredit('2026-09-15T21:10:00+05:00', NIGHT)).toBe(true); // Kamran
  });

  it('is never old when nothing is unpaid', () => {
    expect(isOldCredit(null, NIGHT)).toBe(false);
    expect(isOldCredit(undefined, NIGHT)).toBe(false);
  });
});

describe('statementBalance', () => {
  it('is charges minus payments', () => {
    expect(
      statementBalance([{ charge: 250 }, { paid: 250 }, { charge: 250 }, { charge: 120 }]),
    ).toBe(370);
  });

  it('is negative when the club holds an advance', () => {
    expect(statementBalance([{ charge: 100 }, { paid: 300 }])).toBe(-200);
  });

  it('ignores lines with no amount, such as "Left without checkout"', () => {
    expect(statementBalance([{ charge: 620 }, {}])).toBe(620);
  });

  it("matches Kamran's statement on screen 30, line by line", () => {
    const lines = [
      { charge: 250 },
      { paid: 250 },
      { charge: 250 },
      { charge: 250 },
      { charge: 120 },
      {},
      { charge: 480 },
      { charge: 250 },
    ];
    expect(runningBalances(lines)).toEqual([250, 0, 250, 500, 620, 620, 1100, 1350]);
    expect(statementBalance(lines)).toBe(1350);
  });
});

describe('balanceKind', () => {
  it('says owes, advance or clear', () => {
    expect(balanceKind(300)).toBe('owes');
    expect(balanceKind(-200)).toBe('advance');
    expect(balanceKind(0)).toBe('clear');
  });
});

describe('statementSince (screen 30)', () => {
  // Kamran: nothing owed before 15 Sep, then 250, 500, 620, the move to credit, 1,100 and 1,350.
  const line = (at: string, balance: number) => ({ at, balance });
  const kamran = [
    line('2026-09-02T20:00:00+05:00', 0), // paid up on 2 Sep
    line('2026-09-15T21:10:00+05:00', 250),
    line('2026-09-15T21:40:00+05:00', 500),
    line('2026-09-15T22:15:00+05:00', 620),
    line('2026-09-16T04:02:00+05:00', 620),
    line('2026-09-22T20:20:00+05:00', 1100),
    line('2026-10-03T21:20:00+05:00', 1350),
  ];

  it('since last zero starts after the last time the balance was nothing', () => {
    const lines = statementSince(kamran, 'zero', NIGHT);
    expect(lines).toHaveLength(6);
    expect(lines[0]?.balance).toBe(250);
    expect(lines.at(-1)?.balance).toBe(1350);
  });

  it('a player who has never been at zero shows everything', () => {
    expect(statementSince(kamran.slice(1), 'zero', NIGHT)).toHaveLength(6);
  });

  it('a player who has paid up shows the stretch that ended at zero', () => {
    const paid = [
      line('2026-09-02T20:00:00+05:00', 0),
      line('2026-09-10T20:00:00+05:00', 250),
      line('2026-09-10T21:00:00+05:00', 500),
      line('2026-09-11T20:00:00+05:00', 0),
    ];
    expect(statementSince(paid, 'zero', NIGHT).map((l) => l.balance)).toEqual([250, 500, 0]);
  });

  it('a player with no lines shows nothing', () => {
    expect(statementSince([], 'zero', NIGHT)).toEqual([]);
    expect(statementSince([], 'month', NIGHT)).toEqual([]);
  });

  it('this month is the calendar month in club time', () => {
    expect(statementSince(kamran, 'month', NIGHT).map((l) => l.balance)).toEqual([1350]);
    // 1 Oct 00:30 club time is still 30 Sep in UTC: it belongs to October.
    const edge = [line('2026-10-01T00:30:00+05:00', 100), line('2026-09-30T23:50:00+05:00', 50)];
    expect(statementSince(edge, 'month', NIGHT)).toHaveLength(1);
  });

  it('all is every line, as a copy', () => {
    const all = statementSince(kamran, 'all', NIGHT);
    expect(all).toHaveLength(7);
    expect(all).not.toBe(kamran);
  });
});
