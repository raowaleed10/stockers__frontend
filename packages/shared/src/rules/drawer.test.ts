import { describe, expect, it } from 'vitest';
import {
  closeNoteRequired,
  drawerAfterExpense,
  drawerDifference,
  expectedDrawerCash,
} from './drawer';

describe('drawer cash', () => {
  it('Zain adds an expense at 8:15 PM: drawer Rs 12,300 becomes Rs 11,800 (screen 29)', () => {
    expect(drawerAfterExpense(12300, 500)).toBe(11800);
  });

  it("today's totals at 10:30 PM: cash received 18,450 less 500 is Rs 17,950 (screen 31)", () => {
    expect(expectedDrawerCash({ cashReceived: 18450, drawerExpenses: 500 })).toBe(17950);
  });

  it('close at 3:40 AM: received 22,250 less 500 is 21,750; counted 21,550 is short Rs 200 (screen 32)', () => {
    const expected = expectedDrawerCash({ cashReceived: 22250, drawerExpenses: 500 });
    expect(expected).toBe(21750);
    expect(drawerDifference(21550, expected)).toBe(-200);
  });

  it('is positive when there is extra cash', () => {
    expect(drawerDifference(21800, 21750)).toBe(50);
  });

  it('asks for a note whenever the difference is not 0', () => {
    expect(closeNoteRequired(-200)).toBe(true);
    expect(closeNoteRequired(50)).toBe(true);
    expect(closeNoteRequired(0)).toBe(false);
  });

  it('refuses an expense that is not whole rupees above 0', () => {
    expect(() => drawerAfterExpense(12300, 0)).toThrow(RangeError);
    expect(() => drawerAfterExpense(12300, 10.5)).toThrow(RangeError);
  });
});
