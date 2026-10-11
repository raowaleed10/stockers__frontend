import { describe, expect, it } from 'vitest';
import { elapsed, isOver30 } from './time';

const STARTED = '2026-10-03T21:00:00+05:00';
const at = (iso: string) => Date.parse(iso);

describe('elapsed', () => {
  it('counts from the start to now', () => {
    expect(elapsed(STARTED, at('2026-10-03T21:18:42+05:00'))).toBe(18 * 60_000 + 42_000);
  });

  it('takes the time already spent paused off', () => {
    expect(elapsed(STARTED, at('2026-10-03T21:30:00+05:00'), 5 * 60_000)).toBe(25 * 60_000);
  });

  it('stays frozen while the game is paused', () => {
    const pausedAt = '2026-10-03T21:12:04+05:00';
    const later = at('2026-10-03T21:40:00+05:00');
    expect(elapsed(STARTED, later, 0, pausedAt)).toBe(12 * 60_000 + 4_000);
  });

  it('never goes below zero', () => {
    expect(elapsed(STARTED, at('2026-10-03T20:59:00+05:00'))).toBe(0);
    expect(elapsed(STARTED, at('2026-10-03T21:01:00+05:00'), 10 * 60_000)).toBe(0);
  });

  it('refuses a start that is not a date-time', () => {
    expect(() => elapsed('soon', 0)).toThrow(RangeError);
  });
});

describe('isOver30', () => {
  it('turns on at exactly 30:00', () => {
    expect(isOver30(30 * 60_000 - 1)).toBe(false);
    expect(isOver30(30 * 60_000)).toBe(true);
    expect(isOver30(34 * 60_000 + 10_000)).toBe(true);
  });
});
