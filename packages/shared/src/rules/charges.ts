// What a game costs (docs/07 §2). Pure functions: every one takes the time as an argument.
// Money is whole rupees. Paisa is rounded to the nearest rupee only where a division happens
// (rooms and splits, Q9).

import type { Game, ISO, Rs } from '../types';
import { MINUTE_MS, type Moment, toMs } from './club-time';
import { elapsed } from './time';

function assertRupees(value: number, what: string): void {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${what} must be whole rupees`);
}

/** Single frame: the table price, and the loser pays (D8). */
export function frameCharge(price: Rs): Rs {
  assertRupees(price, 'The price');
  return price;
}

/** Splits an amount between players, to the nearest rupee. Any extra rupee goes to the first. */
export function splitEvenly(total: Rs, playerIds: string[]): Record<string, Rs> {
  if (playerIds.length === 0) throw new RangeError('Nobody to split between');
  const each = Math.floor(total / playerIds.length);
  const extra = total - each * playerIds.length;
  return Object.fromEntries(playerIds.map((id, i) => [id, each + (i === 0 ? extra : 0)]));
}

/** What a double frame costs in all on a table with this single-frame price (D9). */
export function doublePrice(price: Rs): Rs {
  assertRupees(price, 'The price');
  return price * 2;
}

export interface DoubleCharge {
  total: Rs;
  split: Record<string, Rs>;
}

/**
 * Double frame: 2 x the table price, shared by the losing side, 50/50 unless the worker adjusts it (D9).
 * One player alone on a side pays all of it. A custom split must name the losers and add up to the total.
 */
export function doubleCharge(
  price: Rs,
  loserIds: string[],
  split?: Record<string, Rs>,
): DoubleCharge {
  const total = doublePrice(price);
  if (split === undefined) return { total, split: splitEvenly(total, loserIds) };

  const named = Object.keys(split);
  const sameLosers = named.length === loserIds.length && loserIds.every((id) => named.includes(id));
  if (!sameLosers) throw new RangeError('The split must name the players who lose');
  named.forEach((id) => assertRupees(split[id], 'A share'));
  const sum = named.reduce((acc, id) => acc + split[id], 0);
  if (sum !== total) throw new RangeError(`The split adds up to ${sum}, not ${total}`);
  return { total, split: { ...split } };
}

/** At the end of a frame over 30 minutes the worker chooses (Q2): the normal price or double. */
export function overtimeOptions(price: Rs): { normal: Rs; double: Rs } {
  return { normal: frameCharge(price), double: doublePrice(price) };
}

/** Century: whole minutes x the rate, no minimum (D11). 42 min 35 s at Rs 15 is 42 x 15 = 630. */
export function centuryCharge(elapsedMs: number, ratePerMinute: Rs): Rs {
  assertRupees(ratePerMinute, 'The rate');
  return Math.floor(elapsedMs / MINUTE_MS) * ratePerMinute;
}

/**
 * Room: one hour minimum, then the hourly price / 60 x the whole minutes, to the nearest rupee (D12, Q9).
 * 1 h 40 min at Rs 1,500 is 2,500; 1 h 40 min at Rs 700 is 1,167.
 */
export function roomCharge(elapsedMs: number, hourly: Rs, minMinutes = 60): Rs {
  assertRupees(hourly, 'The hourly price');
  const minutes = Math.max(Math.floor(elapsedMs / MINUTE_MS), minMinutes);
  return Math.round((hourly * minutes) / 60);
}

/** Pool, foosball, carrom, ludo and PlayStation: per game, loser pays. `null` means the price is not set. */
export function gameCharge(price: Rs | null): Rs | null {
  if (price === null) return null;
  assertRupees(price, 'The price');
  return price;
}

/** A table with no price is shown but cannot start a game (D13, Q3). */
export function canStartGame(price: Rs | null): boolean {
  return price !== null;
}

export const UNDO_WINDOW_SEC = 120;
export const CHANGE_TYPE_WINDOW_MIN = 5;

/** Seconds left to undo a game started by mistake (D16). Zero once the 2 minutes have passed. */
export function undoSecondsLeft(startedAt: ISO, now: Moment, windowSec = UNDO_WINDOW_SEC): number {
  const since = toMs(now) - toMs(startedAt);
  return Math.max(0, Math.ceil((windowSec * 1000 - since) / 1000));
}

export function canUndo(startedAt: ISO, now: Moment, windowSec = UNDO_WINDOW_SEC): boolean {
  return undoSecondsLeft(startedAt, now, windowSec) > 0;
}

/** Whole minutes left to change the game type (D17). Zero once the 5 minutes have passed. */
export function changeTypeMinutesLeft(
  startedAt: ISO,
  now: Moment,
  windowMin = CHANGE_TYPE_WINDOW_MIN,
): number {
  const since = toMs(now) - toMs(startedAt);
  return Math.max(0, Math.ceil((windowMin * MINUTE_MS - since) / MINUTE_MS));
}

export function canChangeType(
  startedAt: ISO,
  now: Moment,
  windowMin = CHANGE_TYPE_WINDOW_MIN,
): boolean {
  return changeTypeMinutesLeft(startedAt, now, windowMin) > 0;
}

type ChargedGame = Pick<Game, 'type' | 'price' | 'startedAt' | 'pausedMs' | 'pausedAt'>;

/**
 * The amount so far for a game, the number on the tile and the amount when it ends.
 * `price` is what the game started with (D5): the frame price, the full double amount, the Century
 * rate per minute, or the room's hourly price. Paused time is not charged (D14).
 */
export function chargeForGame(game: ChargedGame, now: Moment): Rs {
  switch (game.type) {
    case 'century':
      return centuryCharge(
        elapsed(game.startedAt, toMs(now), game.pausedMs, game.pausedAt),
        game.price,
      );
    case 'room':
      return roomCharge(
        elapsed(game.startedAt, toMs(now), game.pausedMs, game.pausedAt),
        game.price,
      );
    case 'single':
    case 'game':
      return frameCharge(game.price);
    case 'double':
      return frameCharge(game.price);
  }
}
