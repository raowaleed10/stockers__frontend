import { describe, expect, it } from 'vitest';
import type { StatementLine } from '../types';
import { applyDiscount, billBreakdown, billParts, settleCheckout, waitingTotal } from './checkout';

const worker = { id: 'zain', name: 'Zain', role: 'worker' as const };
let lineNo = 0;
function line(kind: StatementLine['kind'], extra: Partial<StatementLine> = {}): StatementLine {
  lineNo += 1;
  return {
    id: `l${lineNo}`,
    playerId: 'bilal',
    at: '2026-10-03T21:00:00+05:00',
    kind,
    text: kind,
    balance: 0,
    doneBy: worker,
    ...extra,
  };
}

describe('billParts', () => {
  it('Bilal at 9:42 PM: 2 frames lost and 2 teas', () => {
    expect(
      billParts([line('frame'), line('frame'), line('canteen', { item: { name: 'Tea', qty: 2 } })]),
    ).toEqual([
      { kind: 'frame', count: 2 },
      { kind: 'canteen', count: 2, item: 'Tea' },
    ]);
  });

  it('counts a half of a double, a Century, a room, a game and a damage charge', () => {
    expect(
      billParts([line('double'), line('century'), line('room'), line('game'), line('damage')]),
    ).toEqual([
      { kind: 'game', count: 1 },
      { kind: 'double', count: 1 },
      { kind: 'century', count: 1 },
      { kind: 'room', count: 1 },
      { kind: 'damage', count: 1 },
    ]);
  });

  it('adds the quantity of the same canteen item and keeps different items apart', () => {
    expect(
      billParts([
        line('canteen', { item: { name: 'Tea', qty: 2 } }),
        line('canteen', { item: { name: 'Chips', qty: 1 } }),
        line('canteen', { item: { name: 'Tea', qty: 1 } }),
      ]),
    ).toEqual([
      { kind: 'canteen', count: 3, item: 'Tea' },
      { kind: 'canteen', count: 1, item: 'Chips' },
    ]);
  });

  it('reads the same whatever order the lines came in', () => {
    const lines = [
      line('canteen', { item: { name: 'Tea', qty: 2 } }),
      line('frame'),
      line('frame'),
    ];
    expect(billParts([...lines].reverse())).toEqual(billParts(lines));
  });

  it('leaves out what is not a charge: payments, discounts and old credit', () => {
    expect(
      billParts([line('payment'), line('discount'), line('opening'), line('advance')]),
    ).toEqual([]);
  });

  it('keeps a canteen line that has no item name as one sale with no name', () => {
    expect(billParts([line('canteen')])).toEqual([{ kind: 'canteen', count: 1 }]);
  });

  it('is empty for no lines', () => {
    expect(billParts([])).toEqual([]);
  });
});

describe('waitingTotal', () => {
  it('screen 3 at 9:42 PM: 600 + 200 + 250 + 250 + 250 = Rs 1,550', () => {
    const bills = [600, 200, 250, 250, 250].map((tonight) => ({ tonight }));
    expect(waitingTotal(bills)).toBe(1550);
  });

  it('is 0 when nobody is waiting', () => {
    expect(waitingTotal([])).toBe(0);
  });
});

describe('billBreakdown', () => {
  it('Bilal at 10:20 PM: old credit 500 + frames 750 + tea x2 100 = 1,350', () => {
    expect(billBreakdown(500, 750 + 100)).toEqual({
      oldCredit: 500,
      advance: 0,
      tonight: 850,
      total: 1350,
    });
  });

  it('Saad: Century 630 with Rs 200 advance used comes to 430', () => {
    expect(billBreakdown(-200, 630)).toEqual({
      oldCredit: 0,
      advance: 200,
      tonight: 630,
      total: 430,
    });
  });

  it('Kamran: old credit 1,100 + half a double 250 = 1,350', () => {
    expect(billBreakdown(1100, 250).total).toBe(1350);
  });

  it('Zubair: a frame 200 + a frame charged double 400 = 600 (2 frames, one double)', () => {
    expect(billBreakdown(0, 200 + 400).total).toBe(600);
  });
});

describe('applyDiscount', () => {
  it('takes the discount off the total: 1,350 less 50 is 1,300', () => {
    expect(applyDiscount(1350, { amount: 50, reason: 'Rounded the bill' })).toBe(1300);
  });

  it('leaves the total alone with no discount', () => {
    expect(applyDiscount(1350, undefined)).toBe(1350);
  });

  it('needs a reason, a whole amount above 0, and nothing more than the bill', () => {
    expect(() => applyDiscount(1350, { amount: 50, reason: '  ' })).toThrow(/reason/);
    expect(() => applyDiscount(1350, { amount: 0, reason: 'x' })).toThrow(RangeError);
    expect(() => applyDiscount(1350, { amount: 10.5, reason: 'x' })).toThrow(RangeError);
    expect(() => applyDiscount(1350, { amount: 1351, reason: 'x' })).toThrow(/more than the bill/);
  });
});

describe('settleCheckout', () => {
  it('Bilal: discount 50, cash 600 + Easypaisa 400 = 1,000, so 300 goes to credit', () => {
    expect(
      settleCheckout({
        total: 1350,
        discount: { amount: 50, reason: 'Rounded the bill' },
        parts: [
          { method: 'cash', amount: 600 },
          { method: 'easypaisa', amount: 400 },
        ],
        toCredit: 300,
      }),
    ).toEqual({
      total: 1350,
      discount: 50,
      due: 1300,
      paid: 1000,
      toCredit: 300,
      advance: 0,
      newBalance: 300,
    });
  });

  it('Saad pays the 430 and ends at 0', () => {
    const result = settleCheckout({
      total: 430,
      parts: [{ method: 'cash', amount: 430 }],
      toCredit: 0,
    });
    expect(result.newBalance).toBe(0);
    expect(result.advance).toBe(0);
  });

  it('turns an extra payment into advance (D26)', () => {
    const result = settleCheckout({
      total: 430,
      parts: [{ method: 'cash', amount: 500 }],
      toCredit: 0,
    });
    expect(result.advance).toBe(70);
    expect(result.newBalance).toBe(-70);
  });

  it('puts all of it on credit when nothing is paid', () => {
    expect(settleCheckout({ total: 600, parts: [], toCredit: 600 }).newBalance).toBe(600);
  });

  it('rejects credit that does not match what is left', () => {
    expect(() =>
      settleCheckout({ total: 1350, parts: [{ method: 'cash', amount: 1000 }], toCredit: 200 }),
    ).toThrow(/350 must go to credit, not 200/);
    expect(() =>
      settleCheckout({ total: 1350, parts: [{ method: 'cash', amount: 1500 }], toCredit: 100 }),
    ).toThrow(RangeError);
  });

  it('rejects a payment that is not whole rupees', () => {
    expect(() =>
      settleCheckout({ total: 100, parts: [{ method: 'cash', amount: -5 }], toCredit: 105 }),
    ).toThrow(RangeError);
  });
});
