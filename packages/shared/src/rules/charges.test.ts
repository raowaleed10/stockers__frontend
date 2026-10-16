import { describe, expect, it } from 'vitest';
import {
  canChangeType,
  canStartGame,
  canUndo,
  centuryBreakdown,
  centuryCharge,
  changeTypeMinutesLeft,
  chargeForGame,
  doubleCharge,
  doublePrice,
  frameCharge,
  gameCharge,
  overtimeOptions,
  roomBreakdown,
  roomCharge,
  roomPreview,
  splitEvenly,
  undoSecondsLeft,
} from './charges';

const MIN = 60_000;
const SEC = 1000;
const at = (iso: string) => Date.parse(iso);

describe('frameCharge', () => {
  it('is the table price: Table 1 is 250, Table 4 is 200', () => {
    expect(frameCharge(250)).toBe(250);
    expect(frameCharge(200)).toBe(200);
  });

  it('refuses a price that is not whole rupees', () => {
    expect(() => frameCharge(12.5)).toThrow(RangeError);
    expect(() => frameCharge(-1)).toThrow(RangeError);
  });
});

describe('doubleCharge', () => {
  it('is 2 x the price, split 50/50: Table 5 (200) is 400, Imran 200 and Naveed 200', () => {
    expect(doubleCharge(200, ['imran', 'naveed'])).toEqual({
      total: 400,
      split: { imran: 200, naveed: 200 },
    });
  });

  it('makes one player alone on a side pay all of it', () => {
    expect(doubleCharge(200, ['imran'])).toEqual({ total: 400, split: { imran: 400 } });
  });

  it('shows Double Rs 500 on a Rs 250 table', () => {
    expect(doubleCharge(250, ['a', 'b']).total).toBe(500);
  });

  it('accepts a custom split that adds up to the total', () => {
    expect(doubleCharge(200, ['imran', 'naveed'], { imran: 300, naveed: 100 }).split).toEqual({
      imran: 300,
      naveed: 100,
    });
  });

  it('rejects a custom split that does not add up, or names someone else', () => {
    expect(() => doubleCharge(200, ['imran', 'naveed'], { imran: 300, naveed: 50 })).toThrow(
      /adds up to 350, not 400/,
    );
    expect(() => doubleCharge(200, ['imran', 'naveed'], { imran: 200, faisal: 200 })).toThrow(
      /must name the players/,
    );
  });
});

describe('doublePrice', () => {
  it('is twice the single-frame price: Rs 250 becomes Rs 500', () => {
    expect(doublePrice(250)).toBe(500);
    expect(doublePrice(200)).toBe(400);
  });
});

describe('splitEvenly', () => {
  it('gives an odd rupee to the first player so the total always matches', () => {
    expect(splitEvenly(501, ['a', 'b'])).toEqual({ a: 251, b: 250 });
  });

  it('needs at least one player', () => {
    expect(() => splitEvenly(400, [])).toThrow(RangeError);
  });
});

describe('overtimeOptions', () => {
  it('offers the normal price or double: Table 4 is Rs 200 or Rs 400', () => {
    expect(overtimeOptions(200)).toEqual({ normal: 200, double: 400 });
  });
});

describe('a double frame over its limit (Q2, D56)', () => {
  it('offers the normal double price or double that: Table 5 is Rs 400 or Rs 800', () => {
    expect(overtimeOptions(400)).toEqual({ normal: 400, double: 800 });
  });

  it('charge double doubles the double-frame price, then the losing side splits it', () => {
    expect(doubleCharge(400, ['imran', 'naveed'])).toEqual({
      total: 800,
      split: { imran: 400, naveed: 400 },
    });
    expect(doubleCharge(400, ['imran', 'naveed'], { imran: 500, naveed: 300 }).split).toEqual({
      imran: 500,
      naveed: 300,
    });
    expect(() => doubleCharge(400, ['imran', 'naveed'], { imran: 300, naveed: 100 })).toThrow(
      /adds up to 400, not 800/,
    );
  });
});

describe('centuryCharge', () => {
  it('counts whole minutes: 42 min 35 s at Rs 15 is 42 x 15 = 630', () => {
    expect(centuryCharge(42 * MIN + 35 * SEC, 15)).toBe(630);
  });

  it('shows 37:05 on the tile as Rs 555', () => {
    expect(centuryCharge(37 * MIN + 5 * SEC, 15)).toBe(555);
  });

  it('has no minimum', () => {
    expect(centuryCharge(59 * SEC, 15)).toBe(0);
    expect(centuryCharge(MIN, 15)).toBe(15);
  });
});

describe('roomCharge', () => {
  it('1 h 40 min at Rs 1,500 is Rs 2,500', () => {
    expect(roomCharge(100 * MIN, 1500)).toBe(2500);
  });

  it('1 h 12 min at Rs 1,500 is Rs 1,800', () => {
    expect(roomCharge(72 * MIN, 1500)).toBe(1800);
  });

  it('Room 1 at 1:12:05 shows Rs 1,800 on the tile (whole minutes)', () => {
    expect(roomCharge(72 * MIN + 5 * SEC, 1500)).toBe(1800);
  });

  it('charges the 1 hour minimum for 6 minutes', () => {
    expect(roomCharge(6 * MIN, 1500)).toBe(1500);
    expect(roomCharge(0, 1500)).toBe(1500);
  });

  it('rounds to the nearest rupee: 1 h 40 min at Rs 700 is Rs 1,167', () => {
    expect(roomCharge(100 * MIN, 700)).toBe(1167);
  });
});

describe('gameCharge', () => {
  it('is the price, and null while the price is not set', () => {
    expect(gameCharge(300)).toBe(300);
    expect(gameCharge(null)).toBeNull();
  });

  it('cannot start while the price is not set', () => {
    expect(canStartGame(null)).toBe(false);
    expect(canStartGame(300)).toBe(true);
  });
});

describe('canUndo', () => {
  const started = '2026-10-03T21:23:18+05:00';

  it('has 1:42 left 18 seconds after the start', () => {
    const now = at('2026-10-03T21:23:36+05:00');
    expect(undoSecondsLeft(started, now)).toBe(102);
    expect(canUndo(started, now)).toBe(true);
  });

  it('stops at exactly 2 minutes', () => {
    expect(canUndo(started, at('2026-10-03T21:25:17+05:00'))).toBe(true);
    expect(canUndo(started, at('2026-10-03T21:25:18+05:00'))).toBe(false);
    expect(undoSecondsLeft(started, at('2026-10-03T22:00:00+05:00'))).toBe(0);
  });
});

describe('canChangeType', () => {
  it('started 9:50, now 9:53: allowed, 2 minutes left', () => {
    const started = '2026-10-03T21:50:00+05:00';
    const now = at('2026-10-03T21:53:00+05:00');
    expect(canChangeType(started, now)).toBe(true);
    expect(changeTypeMinutesLeft(started, now)).toBe(2);
  });

  it('is not allowed after 5 minutes', () => {
    const started = '2026-10-03T21:50:00+05:00';
    expect(canChangeType(started, at('2026-10-03T21:55:00+05:00'))).toBe(false);
    expect(changeTypeMinutesLeft(started, at('2026-10-03T21:56:00+05:00'))).toBe(0);
  });
});

describe('chargeForGame: the amount so far on a tile', () => {
  const now = at('2026-10-03T21:42:00+05:00');
  const base = { pausedMs: 0 };

  it('Table 3 Century, 37:05 at Rs 15: Rs 555', () => {
    expect(
      chargeForGame(
        { ...base, type: 'century', price: 15, startedAt: '2026-10-03T21:04:55+05:00' },
        now,
      ),
    ).toBe(555);
  });

  it('Room 1, 1:12:05 at Rs 1,500: Rs 1,800', () => {
    expect(
      chargeForGame(
        { ...base, type: 'room', price: 1500, startedAt: '2026-10-03T20:29:55+05:00' },
        now,
      ),
    ).toBe(1800);
  });

  it('a single frame is its price, and a double is the full double amount', () => {
    expect(
      chargeForGame(
        { ...base, type: 'single', price: 250, startedAt: '2026-10-03T21:23:18+05:00' },
        now,
      ),
    ).toBe(250);
    expect(
      chargeForGame(
        { ...base, type: 'double', price: 400, startedAt: '2026-10-03T21:19:50+05:00' },
        now,
      ),
    ).toBe(400);
  });

  it('does not count paused time (D14): a paused Century stays where it stopped', () => {
    const paused = {
      type: 'century' as const,
      price: 15,
      startedAt: '2026-10-03T21:00:00+05:00',
      pausedMs: 0,
      pausedAt: '2026-10-03T21:12:04+05:00',
    };
    expect(chargeForGame(paused, now)).toBe(12 * 15);
    expect(chargeForGame({ ...paused, pausedAt: undefined, pausedMs: 10 * MIN }, now)).toBe(
      32 * 15,
    );
  });

  it('a moved frame keeps the price of the table it started on', () => {
    // Table 1 (250) moved to Table 4 (200): the game still carries 250.
    expect(
      chargeForGame(
        { ...base, type: 'single', price: 250, startedAt: '2026-10-03T21:23:18+05:00' },
        now,
      ),
    ).toBe(250);
  });
});

describe('centuryBreakdown (screen 21)', () => {
  const century = {
    startedAt: '2026-10-03T21:04:25+05:00',
    pausedMs: 0,
    price: 15,
  };

  it('Table 3 at 9:47:00 PM: 42 min 35 sec on the table, 42 minutes charged, Rs 630', () => {
    expect(centuryBreakdown(century, at('2026-10-03T21:47:00+05:00'))).toEqual({
      onTableMs: 42 * MIN + 35 * SEC,
      chargedMinutes: 42,
      pausedMinutes: 0,
      rate: 15,
      amount: 630,
    });
  });

  it('does not charge the paused minutes, and says how many there were', () => {
    const paused = { ...century, pausedMs: 5 * MIN + 20 * SEC };
    expect(centuryBreakdown(paused, at('2026-10-03T21:47:00+05:00'))).toMatchObject({
      onTableMs: 42 * MIN + 35 * SEC,
      chargedMinutes: 37,
      pausedMinutes: 5,
      amount: 555,
    });
  });

  it('counts a pause that is still going on, so the minutes add up to the time on the table', () => {
    const now = at('2026-10-03T21:47:00+05:00');
    const stillPaused = { ...century, pausedAt: '2026-10-03T21:40:00+05:00' };
    expect(centuryBreakdown(stillPaused, now)).toMatchObject({
      chargedMinutes: 35,
      pausedMinutes: 7,
      amount: 525,
    });
  });
});

describe('roomBreakdown (screen 23)', () => {
  const room = { startedAt: '2026-10-03T20:29:55+05:00', pausedMs: 5 * MIN, price: 1500 };

  it('Room 1 at 10:15 PM: 1 h 45 min in the room, 5 min paused, first hour 1,500 and 40 minutes at Rs 25 = 2,500', () => {
    const result = roomBreakdown(room, at('2026-10-03T22:15:00+05:00'));
    expect(result).toEqual({
      onRoomMs: 105 * MIN + 5 * SEC,
      pausedMinutes: 5,
      chargedMinutes: 100,
      minMinutes: 60,
      firstAmount: 1500,
      extraMinutes: 40,
      extraAmount: 1000,
      amount: 2500,
    });
    expect(result.firstAmount + result.extraAmount).toBe(result.amount);
  });

  it('charges the first hour at least: 6 minutes is Rs 1,500 and no minutes after it', () => {
    const result = roomBreakdown(
      { startedAt: '2026-10-03T22:09:00+05:00', pausedMs: 0, price: 1500 },
      at('2026-10-03T22:15:00+05:00'),
    );
    expect(result).toMatchObject({
      chargedMinutes: 60,
      extraMinutes: 0,
      extraAmount: 0,
      amount: 1500,
    });
  });

  it('rounds the paisa once, so the two parts still add up: 1 h 40 min at Rs 700 is Rs 1,167', () => {
    const result = roomBreakdown(
      { startedAt: '2026-10-03T20:35:00+05:00', pausedMs: 0, price: 700 },
      at('2026-10-03T22:15:00+05:00'),
    );
    expect(result.amount).toBe(1167);
    expect(result.firstAmount + result.extraAmount).toBe(1167);
  });
});

describe('roomPreview (screen 22)', () => {
  it('Rs 1,500 an hour: the first hour Rs 1,500, Rs 25 a minute after it, 1 hour 40 min is Rs 2,500', () => {
    expect(roomPreview(1500)).toEqual({
      firstAmount: 1500,
      perMinute: 25,
      exampleMinutes: 100,
      exampleAmount: 2500,
    });
  });

  it('follows the price when the worker changes it: Rs 700 is not a whole rupee a minute', () => {
    const preview = roomPreview(700);
    expect(preview.firstAmount).toBe(700);
    expect(preview.perMinute).toBeCloseTo(11.67, 2);
    expect(preview.exampleAmount).toBe(1167);
  });

  it('refuses a price that is not whole rupees', () => {
    expect(() => roomPreview(1500.5)).toThrow(RangeError);
  });
});
