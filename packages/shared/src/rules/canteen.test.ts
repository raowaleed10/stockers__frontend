import { describe, expect, it } from 'vitest';
import { basketTotal, canAddOne, stockState } from './canteen';

describe('basketTotal (screen 28)', () => {
  it('two cold drinks at Rs 120 and one chips at Rs 60 are Rs 300', () => {
    expect(
      basketTotal([
        { sell: 120, qty: 2 },
        { sell: 60, qty: 1 },
      ]),
    ).toBe(300);
  });

  it('an empty basket is nothing, and whole rupees stay whole', () => {
    expect(basketTotal([])).toBe(0);
    expect(basketTotal([{ sell: 650, qty: 3 }])).toBe(1950);
  });
});

describe('stockState', () => {
  it('is fresh for an item with no stock, sold out at none, low at or under the owners’ number', () => {
    expect(stockState({ stock: null, lowAt: 0 })).toBe('fresh'); // Tea
    expect(stockState({ stock: 0, lowAt: 1 })).toBe('soldOut'); // Cigarette pack
    expect(stockState({ stock: 3, lowAt: 5 })).toBe('low'); // Chips, "3 left, low"
    expect(stockState({ stock: 5, lowAt: 5 })).toBe('low');
    expect(stockState({ stock: 6, lowAt: 5 })).toBe('ok');
    expect(stockState({ stock: 24, lowAt: 6 })).toBe('ok'); // Cold drink
    expect(stockState({ stock: 8, lowAt: 3 })).toBe('ok'); // Energy drink
  });
});

describe('canAddOne', () => {
  it('stops at the stock, and never for an item made fresh', () => {
    expect(canAddOne({ stock: 3 }, 2)).toBe(true);
    expect(canAddOne({ stock: 3 }, 3)).toBe(false);
    expect(canAddOne({ stock: 0 }, 0)).toBe(false);
    expect(canAddOne({ stock: null }, 500)).toBe(true);
  });
});
