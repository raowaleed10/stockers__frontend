import { elapsed, MINUTE_MS, type Game } from '@stockers/shared';

/** "Ali Raza" is "Ali" where the screens are short of room (the two sides of a double, "Ali 2 – 0 Bilal"). */
export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

/** Everyone named on a game, in the order they appear: the two players, the sides, or the one it is under. */
export function gamePlayerIds(game: Game): string[] {
  return [
    ...(game.playerIds ?? []),
    ...(game.sides?.flat() ?? []),
    ...(game.underPlayerId ? [game.underPlayerId] : []),
  ];
}

/** Whole minutes played so far, not counting the time paused (screen 13: "19 minutes so far"). */
export function minutesSoFar(game: Game, now: number): number {
  return Math.floor(elapsed(game.startedAt, now, game.pausedMs, game.pausedAt) / MINUTE_MS);
}

/** "Ali Raza vs Bilal Ahmed", or the two sides of a double as first names, or the player a Century is under. */
export function whoIsPlaying(
  game: Game,
  nameOf: (id: string) => string,
  vs: string,
  short = false,
): string {
  if (game.sides) {
    const side = (ids: string[]) => ids.map((id) => firstName(nameOf(id))).join(', ');
    return `${side(game.sides[0])} ${vs} ${side(game.sides[1])}`;
  }
  if (game.playerIds) {
    const [a, b] = game.playerIds;
    const name = (id: string) => (short ? firstName(nameOf(id)) : nameOf(id));
    return `${name(a)} ${vs} ${name(b)}`;
  }
  return game.underPlayerId ? nameOf(game.underPlayerId) : '';
}
