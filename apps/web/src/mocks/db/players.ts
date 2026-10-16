import type {
  Game,
  LineKind,
  NewPlayerRequest,
  Player,
  PlayerStatement,
  PlayerWithTail,
} from '@stockers/shared';
import { maskPhone, phoneTail } from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';

/** The counter sees a masked phone number (screens 25 and 30); the owners see the whole number. */
export function presentPlayer(
  player: Player,
  mask: boolean,
  lastPlayedAt?: string,
): PlayerWithTail {
  const { phone, ...rest } = player;
  return {
    ...rest,
    ...(phone ? { phone: mask ? maskPhone(phone) : phone, phoneTail: phoneTail(phone) } : {}),
    ...(lastPlayedAt ? { lastPlayedAt } : {}),
  };
}

/** The lines on a statement that mean the player played (not a payment, a discount or a canteen sale). */
const PLAYED: ReadonlySet<LineKind> = new Set(['frame', 'double', 'century', 'room', 'game']);

const playersOf = (game: Game): string[] => [
  ...(game.playerIds ?? []),
  ...(game.sides?.flat() ?? []),
  ...(game.underPlayerId ? [game.underPlayerId] : []),
];

/**
 * When a player last played: the start of his latest frame, game, Century or room that has happened by now, or the
 * start of the game he is in. Nothing for a player who has not played yet.
 */
export function lastPlayedAt(db: MockDb, playerId: string): string | undefined {
  const now = db.now();
  let latest: { at: string; ms: number } | undefined;
  const consider = (at: string) => {
    const ms = Date.parse(at);
    if (ms <= now && (!latest || ms > latest.ms)) latest = { at, ms };
  };
  for (const line of db.statement(playerId)) if (PLAYED.has(line.kind)) consider(line.at);
  for (const game of db.s.games) {
    if (
      (game.status === 'running' || game.status === 'paused') &&
      playersOf(game).includes(playerId)
    ) {
      consider(game.startedAt);
    }
  }
  return (latest as { at: string; ms: number } | undefined)?.at;
}

/** True when the text starts the name or one of its words: "ali" is in "Ali Raza" and "Hamid Ali", not in "Malik". */
function startsAWord(text: string, needle: string): boolean {
  const lower = text.toLowerCase();
  return lower.startsWith(needle) || lower.includes(` ${needle}`);
}

/** `GET /players?q=`: by name, nickname or number, with the same name told apart by number (D21). */
export function searchPlayers(
  db: MockDb,
  query: string | undefined,
  mask: boolean,
): PlayerWithTail[] {
  const needle = (query ?? '').trim().toLowerCase();
  const digits = needle.replace(/\D/g, '');
  return db.s.players
    .filter((player) => {
      if (!needle) return true;
      if (startsAWord(player.name, needle)) return true;
      if (player.nick && startsAWord(player.nick, needle)) return true;
      return digits.length >= 3 && (player.phone ?? '').replace(/\D/g, '').includes(digits);
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((player) => presentPlayer(player, mask, lastPlayedAt(db, player.id)));
}

/** `GET /players/recent`: who played here lately, the latest first (the "Played here recently" chips of screen 8). */
export function recentPlayers(db: MockDb, limit: number, mask: boolean): PlayerWithTail[] {
  return db.s.players
    .map((player) => ({ player, at: lastPlayedAt(db, player.id) }))
    .filter((entry): entry is { player: Player; at: string } => entry.at !== undefined)
    .sort(
      (a, b) => Date.parse(b.at) - Date.parse(a.at) || a.player.name.localeCompare(b.player.name),
    )
    .slice(0, limit)
    .map(({ player, at }) => presentPlayer(player, mask, at));
}

/** Quick add (D20): the account is made at once; the phone number is asked for but can be skipped (Q18). */
export function createPlayer(db: MockDb, request: NewPlayerRequest, mask: boolean): PlayerWithTail {
  const name = request.name?.trim();
  if (!name) fail('VALIDATION', 'Type the player’s name.');
  const phone = request.phone?.trim();
  if (phone && phone.replace(/\D/g, '').length < 10)
    fail('VALIDATION', 'That phone number looks too short.');

  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'player';
  let id = base;
  for (let n = 2; db.s.players.some((p) => p.id === id); n += 1) id = `${base}-${n}`;

  const player: Player = {
    id,
    name,
    ...(phone ? { phone } : {}),
    since: db.nowIso(),
    balance: 0,
    visits: 0,
    framesWon: 0,
    framesPlayed: 0,
    centuryMinutes: 0,
    spent: 0,
  };
  db.s.players.push(player);
  db.s.statements[id] = [];
  return presentPlayer(player, mask);
}

export function statementOf(db: MockDb, playerId: string, mask: boolean): PlayerStatement {
  const player = db.player(playerId);
  return { player: presentPlayer(player, mask), lines: [...db.statement(playerId)] };
}
