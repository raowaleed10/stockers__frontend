// Finding a player at the counter (docs/07 §2a): how the results of a search are put in order, what "Last played"
// says, and which saved names look like the one being typed. Pure functions, no clock.

import type { ISO, Rs } from '../types';
import { clubDayNumber, type Moment } from './club-time';

interface Searchable {
  id: string;
  name: string;
  nick?: string;
}

const clean = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Puts the results of a search in the order the counter shows them. Names that start with what was typed come first
 * ("ali" gives the Alis before Hamid Ali), then the others. In each group a player who is free comes before one who is
 * playing (D21 asks only that the phone is shown, but a worker mostly wants someone free), the players who are playing
 * keep the order of their tables, and the rest are alphabetical.
 *
 * `busyOrder` maps a player's id to the position of the table he is on; a player not in it is free.
 */
export function rankPlayerResults<T extends Searchable>(
  players: readonly T[],
  query: string,
  busyOrder: ReadonlyMap<string, number> = new Map(),
): T[] {
  const needle = clean(query);
  const group = (player: T) =>
    needle !== '' &&
    (clean(player.name).startsWith(needle) || clean(player.nick ?? '').startsWith(needle))
      ? 0
      : 1;
  return [...players].sort((a, b) => {
    const byGroup = group(a) - group(b);
    if (byGroup !== 0) return byGroup;
    const busyA = busyOrder.get(a.id);
    const busyB = busyOrder.get(b.id);
    if ((busyA === undefined) !== (busyB === undefined)) return busyA === undefined ? -1 : 1;
    if (busyA !== undefined && busyB !== undefined && busyA !== busyB) return busyA - busyB;
    return a.name.localeCompare(b.name);
  });
}

export type LastPlayed =
  | { kind: 'today' }
  | { kind: 'yesterday' }
  /** Within the last six days: the weekday is enough ("Last played Thursday"). */
  | { kind: 'weekday'; at: ISO }
  /** Longer ago: the day and month ("Last played 24 Sep"). */
  | { kind: 'date'; at: ISO };

/** How long ago a player last played, in the steps the counter says it. Club days, not 24-hour periods. */
export function lastPlayedWhen(at: ISO, now: Moment): LastPlayed {
  const days = clubDayNumber(now) - clubDayNumber(at);
  if (days <= 0) return { kind: 'today' };
  if (days === 1) return { kind: 'yesterday' };
  if (days <= 6) return { kind: 'weekday', at };
  return { kind: 'date', at };
}

/** The number of single-letter changes between two texts. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }
  return previous[b.length];
}

/**
 * The saved players whose names look like the one being typed in "Add a new player" (screen 10), so a second account
 * is not made for someone who already has one. A saved name is similar when it starts with what was typed, when what
 * was typed starts with it ("Ali Shahzad" and "Ali Shah"), or when it is only a couple of letters away ("Ali Shahid").
 * Nothing is suggested for fewer than three letters. The closest come first.
 */
export function similarPlayers<T extends { name: string }>(
  players: readonly T[],
  typed: string,
  limit = 4,
): T[] {
  const name = clean(typed);
  if (name.length < 3) return [];
  return players
    .map((player) => ({ player, saved: clean(player.name) }))
    .filter(({ saved }) => {
      if (saved === name) return true;
      if (saved.startsWith(name) || name.startsWith(saved)) return saved.length >= 3;
      return distance(saved, name) <= Math.min(2, Math.floor(name.length / 4));
    })
    .sort(
      (a, b) => distance(a.saved, name) - distance(b.saved, name) || a.saved.localeCompare(b.saved),
    )
    .slice(0, limit)
    .map(({ player }) => player);
}

/** The filters of the players list (screen 30). */
export type AccountFilter = 'all' | 'owe' | 'advance';

interface Account {
  name: string;
  /** More than 0 he owes the club; less than 0 the club holds an advance. */
  balance: Rs;
}

/** How many players each filter holds: "All 312", "Owe money 41", "Advance 6". */
export function accountCounts(players: readonly Account[]): Record<AccountFilter, number> {
  return {
    all: players.length,
    owe: players.filter((p) => p.balance > 0).length,
    advance: players.filter((p) => p.balance < 0).length,
  };
}

/**
 * The players a filter shows, in the order the list has them: everyone alphabetically; the ones who owe, the most first;
 * the ones with an advance, the biggest first. Equal amounts are alphabetical.
 */
export function accountList<T extends Account>(players: readonly T[], filter: AccountFilter): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  if (filter === 'owe') {
    return players
      .filter((p) => p.balance > 0)
      .sort((a, b) => b.balance - a.balance || byName(a, b));
  }
  if (filter === 'advance') {
    return players
      .filter((p) => p.balance < 0)
      .sort((a, b) => a.balance - b.balance || byName(a, b));
  }
  return [...players].sort(byName);
}
