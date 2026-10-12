import { describe, expect, it } from 'vitest';
import { planClose, sheetEarned, sheetProfit, sheetReceived } from './sheet';

describe('sheet 48 at close (screen 32)', () => {
  it('received is cash plus every online method: 22,250 + 4,400 + 5,350 + 1,300 = 33,300', () => {
    expect(
      sheetReceived({ cash: 22250, online: { bank: 4400, easypaisa: 5350, jazzcash: 1300 } }),
    ).toBe(33300);
  });

  it('earned is received + new credit - old credit paid: 33,300 + 3,650 - 1,800 = 35,150', () => {
    expect(sheetEarned({ received: 33300, newCredit: 3650, oldCreditPaid: 1800 })).toBe(35150);
  });
});

describe('sheetProfit', () => {
  it('is earned - expenses - canteen buying cost: October so far is 61,900', () => {
    expect(sheetProfit({ earned: 86000, expenses: 19000, canteenCost: 5100 })).toBe(61900);
  });
});

describe('planClose', () => {
  it('moves the running Century and sends Waqas and Shoaib to credit', () => {
    const plan = planClose({
      games: [
        { id: 'g-t2-c', status: 'running' },
        { id: 'g-old', status: 'ended' },
      ],
      bills: [
        { playerId: 'waqas', tonight: 450 },
        { playerId: 'shoaib', tonight: 250 },
      ],
    });
    expect(plan.moveGameIds).toEqual(['g-t2-c']);
    expect(plan.leftWithoutCheckout.map((bill) => bill.playerId)).toEqual(['waqas', 'shoaib']);
    expect(plan.leftTotal).toBe(700);
  });

  it('moves paused games too, and ignores discarded, cancelled and ended ones', () => {
    const plan = planClose({
      games: [
        { id: 'a', status: 'paused' },
        { id: 'b', status: 'discarded' },
        { id: 'c', status: 'cancelled' },
        { id: 'd', status: 'dispute' },
      ],
      bills: [],
    });
    expect(plan.moveGameIds).toEqual(['a']);
  });

  it('skips bills with nothing to pay', () => {
    const plan = planClose({ games: [], bills: [{ playerId: 'tariq', tonight: 0 }] });
    expect(plan.leftWithoutCheckout).toEqual([]);
    expect(plan.leftTotal).toBe(0);
  });
});
