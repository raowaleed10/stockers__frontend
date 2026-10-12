import type { NewPlayerRequest, Player, PlayerStatement, PlayerWithTail } from '@stockers/shared';
import { maskPhone, phoneTail } from '@stockers/shared';
import type { MockDb } from './db';
import { fail } from './errors';

/** The counter sees a masked phone number (screens 25 and 30); the owners see the whole number. */
export function presentPlayer(player: Player, mask: boolean): PlayerWithTail {
  const { phone, ...rest } = player;
  return {
    ...rest,
    ...(phone ? { phone: mask ? maskPhone(phone) : phone, phoneTail: phoneTail(phone) } : {}),
  };
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
      if (player.name.toLowerCase().includes(needle)) return true;
      if (player.nick?.toLowerCase().includes(needle)) return true;
      return digits.length >= 3 && (player.phone ?? '').replace(/\D/g, '').includes(digits);
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((player) => presentPlayer(player, mask));
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
