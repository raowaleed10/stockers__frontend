// Elapsed time of a game and the 30-minute red card (docs/07_RULES_FOR_SCREENS.md §2).
// Paused time is never charged (D14), so it is taken off and a paused game stays frozen.

import type { ISO } from '../types';

export const OVER30_MS = 30 * 60 * 1000;

/**
 * Milliseconds played so far.
 * @param startedAt when the game started
 * @param now the time to measure to, in epoch milliseconds
 * @param pausedMs total time already spent paused
 * @param pausedAt set while the game is paused right now: the clock stops at that moment
 */
export function elapsed(startedAt: ISO, now: number, pausedMs = 0, pausedAt?: ISO): number {
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) throw new RangeError(`Not a date-time: ${startedAt}`);
  const until = pausedAt === undefined ? now : Date.parse(pausedAt);
  return Math.max(0, until - start - pausedMs);
}

/** The red card shows from 30:00 on (Q2). */
export function isOver30(elapsedMs: number): boolean {
  return elapsedMs >= OVER30_MS;
}
