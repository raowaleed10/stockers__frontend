// Elapsed time of a game and its time limit, the red card (docs/07_RULES_FOR_SCREENS.md §2, docs/02 D56).
// Paused time is never charged (D14), so it is taken off and a paused game stays frozen.

import type { Game, GameType, ISO } from '../types';

/** The maximum time a per-game table starts with, until the owners set its own (D56). */
export const DEFAULT_MAX_MINUTES = 30;
export const MIN_MAX_MINUTES = 5;
export const MAX_MAX_MINUTES = 180;

/** A maximum time is a whole number of minutes from 5 to 180. */
export function isValidMaxMinutes(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_MAX_MINUTES &&
    value <= MAX_MAX_MINUTES
  );
}

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

/** The red card shows from the game's limit on: at exactly `maxMinutes`:00 (Q2, D56). */
export function isOverLimit(elapsedMs: number, maxMinutes: number): boolean {
  return elapsedMs >= maxMinutes * 60 * 1000;
}

/**
 * Games with a time limit are the ones charged per game: a single frame, a double frame, and a game of pool,
 * foosball, carrom, ludo or PlayStation. A Century and a room are charged by the minute and have no limit.
 */
export function hasTimeLimit(type: GameType): boolean {
  return type === 'single' || type === 'double' || type === 'game';
}

/**
 * The limit of a running game in minutes, or `undefined` when it has none. A game keeps the limit it started with;
 * one saved without a limit (older data) gets the default.
 */
export function gameLimit(game: Pick<Game, 'type' | 'maxMinutes'>): number | undefined {
  return hasTimeLimit(game.type) ? (game.maxMinutes ?? DEFAULT_MAX_MINUTES) : undefined;
}

/** A game that has a limit and has run to it. It is what the red card, the pill and the "charge double?" choice follow. */
export function isGameOverLimit(
  game: Pick<Game, 'type' | 'maxMinutes'>,
  elapsedMs: number,
): boolean {
  const limit = gameLimit(game);
  return limit !== undefined && isOverLimit(elapsedMs, limit);
}
