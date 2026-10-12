import { describe, expect, it } from 'vitest';
import {
  balanceKind,
  creditAgeDays,
  isOldCredit,
  runningBalances,
  statementBalance,
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
