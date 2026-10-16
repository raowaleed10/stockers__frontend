import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_MINUTES,
  elapsed,
  gameLimit,
  hasTimeLimit,
  isOverLimit,
  isValidMaxMinutes,
} from './time';

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

describe('isOverLimit', () => {
  it('turns on at exactly the limit, whatever the limit is', () => {
    expect(isOverLimit(30 * 60_000 - 1, 30)).toBe(false);
    expect(isOverLimit(30 * 60_000, 30)).toBe(true);
    expect(isOverLimit(34 * 60_000 + 10_000, 30)).toBe(true);
    expect(isOverLimit(20 * 60_000 - 1, 20)).toBe(false);
    expect(isOverLimit(20 * 60_000, 20)).toBe(true);
    expect(isOverLimit(34 * 60_000, 45)).toBe(false);
  });
});

describe('a time limit belongs to games charged per game', () => {
  it('a single frame, a double frame and a game have one; a Century and a room do not', () => {
    expect(['single', 'double', 'game'].map((type) => hasTimeLimit(type as 'single'))).toEqual([
      true,
      true,
      true,
    ]);
    expect(hasTimeLimit('century')).toBe(false);
    expect(hasTimeLimit('room')).toBe(false);
  });

  it('gives the limit the game started with, and the default for an older game that has none', () => {
    expect(gameLimit({ type: 'single', maxMinutes: 20 })).toBe(20);
    expect(gameLimit({ type: 'game', maxMinutes: 45 })).toBe(45);
    expect(gameLimit({ type: 'double' })).toBe(DEFAULT_MAX_MINUTES);
    expect(gameLimit({ type: 'century', maxMinutes: 20 })).toBeUndefined();
    expect(gameLimit({ type: 'room' })).toBeUndefined();
  });

  it('accepts whole minutes from 5 to 180 and nothing else', () => {
    for (const ok of [5, 30, 90, 180]) expect(isValidMaxMinutes(ok)).toBe(true);
    for (const bad of [4, 181, 0, -30, 30.5, Number.NaN, '30', null, undefined]) {
      expect(isValidMaxMinutes(bad), String(bad)).toBe(false);
    }
  });
});
