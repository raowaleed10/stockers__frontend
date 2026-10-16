import type {
  CancelRequest,
  GameView,
  PlayerTonight,
  ChangeTypeRequest,
  DamageRequest,
  DiscardRequest,
  DisputeRequest,
  EndGameRequest,
  EndGameResult,
  Game,
  GamesResult,
  GameType,
  MoveGameRequest,
  PersonRef,
  ReplacePlayerRequest,
  Rs,
  StartGameRequest,
  StartRoomRequest,
  StatementLine,
  Table,
} from '@stockers/shared';
import {
  canChangeType,
  canUndo,
  centuryCharge,
  chargeForGame,
  doubleCharge,
  doublePrice,
  elapsed,
  formatClock,
  formatRs,
  frameCharge,
  gameCharge,
  gameLimit,
  isGameOverLimit,
  MINUTE_MS,
  overtimeOptions,
  roomCharge,
} from '@stockers/shared';
import type { MockDb } from './db';
import { fail, rule } from './errors';

const TYPE_LABEL: Record<GameType, string> = {
  single: 'Single frame',
  double: 'Double frame',
  century: 'Century',
  room: 'Room',
  game: 'Game',
};

const OTHER_KINDS: Table['kind'][] = ['pool', 'foosball', 'carrom', 'ludo', 'playstation'];

type GameFields = Pick<
  Game,
  'type' | 'price' | 'maxMinutes' | 'playerIds' | 'sides' | 'underPlayerId'
>;

function isActive(game: Game): boolean {
  return game.status === 'running' || game.status === 'paused';
}

function activeGame(db: MockDb, id: string): Game {
  const game = db.game(id);
  if (!isActive(game)) fail('GAME_NOT_RUNNING', 'That game is not running.');
  return game;
}

function playerName(db: MockDb, id: string): string {
  return db.player(id).name;
}

function twoPlayers(db: MockDb, ids: [string, string] | undefined): [string, string] {
  if (!ids || ids.length !== 2 || ids[0] === ids[1])
    fail('VALIDATION', 'Pick two different players.');
  ids.forEach((id) => db.player(id));
  return [ids[0], ids[1]];
}

function sidesOf(db: MockDb, sides: [string[], string[]] | undefined): [string[], string[]] {
  if (!sides || sides.length !== 2 || sides.some((side) => side.length < 1 || side.length > 2)) {
    fail('VALIDATION', 'Pick one or two players for each side.');
  }
  const all = [...sides[0], ...sides[1]];
  if (new Set(all).size !== all.length) fail('VALIDATION', 'A player can only be on one side.');
  all.forEach((id) => db.player(id));
  return [[...sides[0]], [...sides[1]]];
}

/**
 * The time limit a new game on this table starts with: the table's own (set with its price), or the starting value of
 * the settings for a table that has none yet (D56). A game keeps it; a later change of the table does not move it.
 */
function startingLimit(db: MockDb, table: Table): number {
  return table.maxMinutes ?? db.s.settings.rules.doubleAfterMin;
}

/** What a game needs to start on this table, checked against the table, the category and the players. */
function gameFields(db: MockDb, table: Table, request: ChangeTypeRequest): GameFields {
  if (table.price === null) fail('PRICE_NOT_SET', `${table.name} has no price yet.`);
  const category = db.s.categories.find((c) => c.id === table.categoryId);

  switch (request.type) {
    case 'single':
      if (table.kind !== 'snooker') fail('VALIDATION', 'A single frame is for snooker tables.');
      return {
        type: 'single',
        price: rule(() => frameCharge(table.price as Rs)),
        maxMinutes: startingLimit(db, table),
        playerIds: twoPlayers(db, request.playerIds),
      };
    case 'double':
      if (table.kind !== 'snooker') fail('VALIDATION', 'A double frame is for snooker tables.');
      return {
        type: 'double',
        price: rule(() => doublePrice(table.price as Rs)),
        maxMinutes: startingLimit(db, table),
        sides: sidesOf(db, request.sides),
      };
    case 'century': {
      if (!category?.centuryAllowed) fail('VALIDATION', 'Century is not played on this table.');
      if (!request.underPlayerId) fail('VALIDATION', 'Pick the player who pays.');
      db.player(request.underPlayerId);
      return {
        type: 'century',
        price: request.price ?? category.centuryRate ?? 15,
        underPlayerId: request.underPlayerId,
      };
    }
    case 'room':
      if (table.kind !== 'room') fail('VALIDATION', 'A room game is for a room.');
      if (!request.underPlayerId) fail('VALIDATION', 'Pick the player who pays.');
      db.player(request.underPlayerId);
      return {
        type: 'room',
        price: request.price ?? table.price,
        underPlayerId: request.underPlayerId,
      };
    case 'game': {
      if (!OTHER_KINDS.includes(table.kind)) fail('VALIDATION', 'This is not a per-game table.');
      const price = gameCharge(table.price);
      if (price === null) return fail('PRICE_NOT_SET', `${table.name} has no price yet.`);
      return {
        type: 'game',
        price,
        maxMinutes: startingLimit(db, table),
        playerIds: twoPlayers(db, request.playerIds),
      };
    }
  }
}

function priceText(game: Pick<Game, 'type' | 'price'>): string {
  if (game.type === 'century') return `rate ${formatRs(game.price)} a minute`;
  if (game.type === 'room') return `${formatRs(game.price)} an hour`;
  return formatRs(game.price);
}

/** The players named on a game, in the order they appear. */
function playersOf(game: Game): string[] {
  return [
    ...(game.playerIds ?? []),
    ...(game.sides?.flat() ?? []),
    ...(game.underPlayerId ? [game.underPlayerId] : []),
  ];
}

function changed(db: MockDb, game: Game): void {
  db.emit('game.changed', { gameId: game.id });
  db.emit('board.changed', { tableId: game.tableId });
}

/** `GET /games/:id`: a game, running or finished, with its table and the names of its players. */
export function gameView(db: MockDb, id: string): GameView {
  const game = db.game(id);
  const players: GameView['players'] = {};
  for (const pid of playersOf(game)) players[pid] = { id: pid, name: db.player(pid).name };
  const session = db.s.sessions.find((s) => s.id === game.sessionId);
  const tonight: Record<string, PlayerTonight> = {};
  for (const pid of playersOf(game)) {
    const waiting = db.tonightLines(pid).reduce((sum, line) => sum + (line.charge ?? 0), 0);
    tonight[pid] = { won: framesWonTonight(db, pid), waiting };
  }
  return {
    game,
    table: db.table(game.tableId),
    ...(session ? { session } : {}),
    players,
    tonight,
  };
}

/**
 * Frames and games a player has won on the open sheet: the frames of every session he is in that he did not lose, and
 * the double frames and games that have ended with him in them and not among the losers.
 */
function framesWonTonight(db: MockDb, playerId: string): number {
  const inSessions = db.s.sessions
    .filter((session) => session.playerIds.includes(playerId))
    .reduce(
      (sum, session) => sum + session.frames.filter((f) => !f.loserIds.includes(playerId)).length,
      0,
    );
  const inGames = db.s.games.filter(
    (g) =>
      g.sheetId === db.s.currentSheetId &&
      g.status === 'ended' &&
      (g.type === 'double' || g.type === 'game') &&
      g.result !== undefined &&
      playersOf(g).includes(playerId) &&
      !g.result.loserIds.includes(playerId),
  ).length;
  return inSessions + inGames;
}

// Start, change ----------------------------------------------------------------------------------

export function startGame(db: MockDb, by: PersonRef, request: StartGameRequest): Game {
  const table = db.table(request.tableId);
  if (table.outOfOrder) fail('TABLE_OUT_OF_ORDER', `${table.name} is out of order.`);
  if (db.activeGameOn(table.id)) fail('TABLE_BUSY', `${table.name} is in use.`);
  const fields = gameFields(db, table, request);

  const game: Game = {
    id: db.nextId('g'),
    tableId: table.id,
    sheetId: db.s.currentSheetId,
    status: 'running',
    startedAt: db.nowIso(),
    startedBy: by,
    pausedMs: 0,
    ...fields,
  };
  if (game.type === 'single') attachSession(db, game, table.id);
  db.s.games.push(game);
  db.history(
    by,
    `Started ${TYPE_LABEL[game.type].toLowerCase()} on ${table.name}, ${priceText(game)}`,
  );
  changed(db, game);
  return game;
}

function attachSession(db: MockDb, game: Game, tableId: string): void {
  const sessionId = db.nextId('sess');
  db.s.sessions.push({
    id: sessionId,
    tableId,
    playerIds: [...(game.playerIds ?? [])],
    frames: [],
  });
  game.sessionId = sessionId;
  game.frameNo = 1;
}

/** Within 5 minutes of the start the worker can change the type (D17). */
export function changeGameType(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: ChangeTypeRequest,
): Game {
  const game = activeGame(db, id);
  if (!canChangeType(game.startedAt, db.now())) {
    fail(
      'CHANGE_TYPE_EXPIRED',
      'It is more than 5 minutes since the game started. End it or discard it first.',
    );
  }
  const table = db.table(game.tableId);
  const fields = gameFields(db, table, request);
  const was = game.type;

  delete game.playerIds;
  delete game.sides;
  delete game.underPlayerId;
  delete game.maxMinutes;
  Object.assign(game, fields);
  if (game.sessionId) {
    db.s.sessions = db.s.sessions.filter((s) => s.id !== game.sessionId);
    delete game.sessionId;
    delete game.frameNo;
  }
  if (game.type === 'single') attachSession(db, game, table.id);
  db.history(
    by,
    `Changed ${table.name} from ${TYPE_LABEL[was].toLowerCase()} to ${TYPE_LABEL[game.type].toLowerCase()}, ${priceText(game)}`,
  );
  changed(db, game);
  return game;
}

// Pause, resume ---------------------------------------------------------------------------------

function pauseOne(game: Game, atIso: string): void {
  game.status = 'paused';
  game.pausedAt = atIso;
}

function resumeOne(db: MockDb, game: Game): number {
  const pausedFor = game.pausedAt ? db.now() - Date.parse(game.pausedAt) : 0;
  game.pausedMs += Math.max(0, pausedFor);
  game.status = 'running';
  delete game.pausedAt;
  return Math.max(0, pausedFor);
}

export function pauseGame(db: MockDb, by: PersonRef, id: string): Game {
  const game = db.game(id);
  if (game.status !== 'running') fail('GAME_NOT_RUNNING', 'That game is not running.');
  pauseOne(game, db.nowIso());
  db.history(by, `Paused ${db.table(game.tableId).name}`);
  changed(db, game);
  return game;
}

export function resumeGame(db: MockDb, by: PersonRef, id: string): Game {
  const game = db.game(id);
  if (game.status !== 'paused') fail('GAME_NOT_RUNNING', 'That game is not paused.');
  resumeOne(db, game);
  db.history(by, `Resumed ${db.table(game.tableId).name}`);
  changed(db, game);
  return game;
}

/** Power cut: every running game stops its clock together (screen 16). */
export function pauseAll(db: MockDb, by: PersonRef): GamesResult {
  const at = db.nowIso();
  const games = db.s.games.filter((g) => g.status === 'running');
  games.forEach((game) => pauseOne(game, at));
  const event = db.logActivity(by, 'pause-all', 'All games paused', {
    detail: `${games.length} ${games.length === 1 ? 'game' : 'games'} paused. The time is not charged.`,
  });
  db.s.pauseAll = { at, by, activityId: event.id };
  db.history(by, 'Paused all games');
  db.emit('board.changed');
  return { games };
}

export function resumeAll(db: MockDb, by: PersonRef): GamesResult {
  const paused = db.s.games.filter((g) => g.status === 'paused');
  let notCharged = 0;
  paused.forEach((game) => {
    notCharged = Math.max(notCharged, resumeOne(db, game));
  });
  const marker = db.s.pauseAll;
  // The power cut lasted from Pause all, even if a game had been paused earlier.
  if (marker) notCharged = db.now() - Date.parse(marker.at);
  const event = marker?.activityId
    ? db.s.activity.find((a) => a.id === marker.activityId)
    : undefined;
  if (event) {
    const minutes = Math.round(notCharged / MINUTE_MS);
    event.detail = `Resumed ${formatClock(db.nowIso())}. ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} not charged on ${paused.length} ${paused.length === 1 ? 'table' : 'tables'}.`;
  }
  db.s.pauseAll = null;
  db.history(by, 'Resumed all games');
  db.emit('board.changed');
  return { games: paused };
}

// Move, replace ---------------------------------------------------------------------------------

/** A frame keeps the price of the table it started on (open question 9, default). */
export function moveGame(db: MockDb, by: PersonRef, id: string, request: MoveGameRequest): Game {
  const game = activeGame(db, id);
  const from = db.table(game.tableId);
  const to = db.table(request.toTableId);
  if (to.id === from.id) fail('VALIDATION', 'Pick another table.');
  if (to.kind !== from.kind) fail('VALIDATION', 'A game can only move to the same kind of table.');
  if (to.outOfOrder) fail('TABLE_OUT_OF_ORDER', `${to.name} is out of order.`);
  if (db.activeGameOn(to.id)) fail('TABLE_BUSY', `${to.name} is in use.`);
  if (to.price === null) fail('PRICE_NOT_SET', `${to.name} has no price yet.`);

  game.tableId = to.id;
  const session = db.s.sessions.find((s) => s.id === game.sessionId);
  if (session) session.tableId = to.id;
  db.history(by, `Moved from ${from.name} to ${to.name}, price stays ${priceText(game)}`);
  changed(db, game);
  db.emit('board.changed', { tableId: from.id });
  return game;
}

export function replacePlayer(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: ReplacePlayerRequest,
): Game {
  const game = activeGame(db, id);
  db.player(request.inId);
  if (playersOf(game).includes(request.inId))
    fail('VALIDATION', 'That player is already in this game.');
  let replaced = false;
  const swap = (ids: string[]): string[] =>
    ids.map((pid) => {
      if (pid !== request.outId) return pid;
      replaced = true;
      return request.inId;
    });
  if (game.playerIds) game.playerIds = swap(game.playerIds) as [string, string];
  if (game.sides) game.sides = [swap(game.sides[0]), swap(game.sides[1])];
  if (game.underPlayerId === request.outId) {
    game.underPlayerId = request.inId;
    replaced = true;
  }
  if (!replaced) fail('VALIDATION', 'That player is not in this game.');
  const session = db.s.sessions.find((s) => s.id === game.sessionId);
  if (session && game.playerIds) session.playerIds = [...game.playerIds];
  db.history(
    by,
    `Swapped ${playerName(db, request.outId)} for ${playerName(db, request.inId)} on ${db.table(game.tableId).name}`,
  );
  changed(db, game);
  return game;
}

// Stop without the normal charge (screen 14) ------------------------------------------------------

function finish(db: MockDb, by: PersonRef, game: Game, status: Game['status']): void {
  game.status = status;
  game.endedAt = db.nowIso();
  game.endedBy = by;
  delete game.pausedAt;
}

export function discardGame(db: MockDb, by: PersonRef, id: string, request: DiscardRequest): Game {
  const game = activeGame(db, id);
  const table = db.table(game.tableId);
  if (!request.reason?.trim()) fail('NOTE_REQUIRED', 'Choose a reason.');
  const wouldHaveBeen = chargeForGame(game, db.now());
  finish(db, by, game, 'discarded');
  const note = request.note?.trim();
  db.logActivity(by, 'discard', `Frame discarded on ${table.name}`, {
    detail: note ? `${request.reason}. “${note}”` : request.reason,
    amount: wouldHaveBeen,
  });
  db.notify(
    'cancelled-or-discarded',
    `Frame discarded on ${table.name}`,
    note ? `“${note}”` : request.reason,
    wouldHaveBeen,
  );
  db.history(by, `Discarded ${table.name}: ${request.reason}`, wouldHaveBeen);
  changed(db, game);
  return game;
}

/** A fight: nobody is charged yet and the owners decide in Activity (D15). */
export function disputeGame(db: MockDb, by: PersonRef, id: string, request: DisputeRequest): Game {
  const game = activeGame(db, id);
  const table = db.table(game.tableId);
  const note = request.note?.trim();
  if (!note) fail('NOTE_REQUIRED', 'Write what happened.');
  if (game.type !== 'single' && game.type !== 'double' && game.type !== 'game') {
    fail('VALIDATION', 'Only a frame or a game can be marked as a dispute.');
  }
  const sides = game.sides ? [game.sides[0][0], game.sides[1][0]] : game.playerIds;
  if (!sides) fail('VALIDATION', 'That game has no players.');
  const amount = chargeForGame(game, db.now());
  finish(db, by, game, 'dispute');
  const event = db.logActivity(by, 'dispute', `Unpaid, dispute on ${table.name}`, {
    detail: `${playerName(db, sides[0])} vs ${playerName(db, sides[1])}${game.frameNo ? `, frame ${game.frameNo}` : ''}. “${note}”`,
    amount,
    needsDecision: true,
  });
  db.s.disputes[event.id] = { tableId: table.id, playerIds: [sides[0], sides[1]], amount };
  db.history(by, `Dispute on ${table.name}: ${note}`, amount);
  changed(db, game);
  return game;
}

/**
 * Cancel, started by mistake (D16, D60). In the first 2 minutes of the worker's own game it acts exactly like Undo: no
 * reason, nothing charged, the same event. After that, or on another worker's game, a reason is required and the
 * owners see it.
 */
export function cancelGame(db: MockDb, by: PersonRef, id: string, request: CancelRequest): Game {
  const game = activeGame(db, id);
  if (canUndo(game.startedAt, db.now()) && game.startedBy.id === by.id) {
    return undoGame(db, by, id);
  }
  const table = db.table(game.tableId);
  const reason = request.reason?.trim();
  if (!reason) fail('NOTE_REQUIRED', 'Write why.');
  finish(db, by, game, 'cancelled');
  db.logActivity(by, 'cancel', `Game cancelled on ${table.name}`, { detail: `“${reason}”` });
  db.notify('cancelled-or-discarded', `Game cancelled on ${table.name}`, `“${reason}”`);
  db.counterAlert('game-cancelled', `Game cancelled on ${table.name}`, `“${reason}”`);
  db.history(by, `Cancelled ${table.name}: ${reason}`);
  changed(db, game);
  return game;
}

/**
 * Started by mistake: undo within 2 minutes with no reason (D16). A worker can undo only his own game (D60); the
 * owners do not use the counter, and another worker cancels with a reason.
 */
export function undoGame(db: MockDb, by: PersonRef, id: string): Game {
  const game = activeGame(db, id);
  const table = db.table(game.tableId);
  if (game.startedBy.id !== by.id) {
    fail(
      'NOT_ALLOWED',
      `${game.startedBy.name.split(' ')[0]} started this game, so only ${game.startedBy.name.split(' ')[0]} can undo it. Cancel it with a reason.`,
    );
  }
  if (!canUndo(game.startedAt, db.now())) {
    fail(
      'UNDO_EXPIRED',
      'It is more than 2 minutes since the game started. Cancel it with a reason.',
    );
  }
  const seconds = Math.round((db.now() - Date.parse(game.startedAt)) / 1000);
  finish(db, by, game, 'cancelled');
  db.s.sessions = db.s.sessions.filter((s) => s.id !== game.sessionId || s.frames.length > 0);
  db.logActivity(by, 'undo', `Game undone on ${table.name}`, {
    detail: `Started by mistake, undone after ${seconds} seconds. No reason needed.`,
  });
  db.notify(
    'cancelled-or-discarded',
    `Game cancelled on ${table.name}`,
    `Started by mistake and undone after ${seconds} seconds.`,
  );
  db.counterAlert(
    'game-cancelled',
    `Game cancelled on ${table.name}`,
    `Started by mistake and undone after ${seconds} seconds.`,
  );
  db.history(by, `Undid ${table.name} after ${seconds} seconds`);
  changed(db, game);
  return game;
}

export function damageCharge(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: DamageRequest,
): StatementLine {
  const game = activeGame(db, id);
  const table = db.table(game.tableId);
  if (!Number.isInteger(request.amount) || request.amount <= 0) {
    fail('VALIDATION', 'The charge is a whole number of rupees above 0.');
  }
  const note = request.note?.trim();
  if (!note) fail('NOTE_REQUIRED', 'Write what happened.');
  if (!request.item?.trim()) fail('VALIDATION', 'Choose what was damaged.');
  const player = db.player(request.playerId);

  const line = db.postLine(player.id, {
    kind: 'damage',
    text: `Damage: ${request.item}, ${table.name}`,
    charge: request.amount,
    by,
    tonight: true,
  });
  db.s.today.earned += request.amount;
  db.s.deltas.earned += request.amount;
  db.logActivity(by, 'damage', `Damage charge for ${player.name}, ${table.name}`, {
    detail: `${request.item}. “${note}”`,
    amount: request.amount,
  });
  db.history(by, `Damage charge for ${player.name}: ${request.item}`, request.amount);
  db.emit('waiting.changed', { playerId: player.id });
  return line;
}

// End ----------------------------------------------------------------------------------------------

function postFrameLines(
  db: MockDb,
  by: PersonRef,
  game: Game,
  loserIds: string[],
  amounts: Record<string, Rs>,
  doubled = false,
): StatementLine[] {
  const table = db.table(game.tableId);
  const winners = playersOf(game).filter((id) => !loserIds.includes(id));
  const winnerText = winners.map((id) => playerName(db, id)).join(' and ');
  const label = game.type === 'game' ? 'Game' : game.frameNo ? `Frame ${game.frameNo}` : 'Frame';
  // A statement shows when a frame started (screen 25), although it is charged when it ends.
  return loserIds.map((loserId) =>
    db.postLine(loserId, {
      kind: game.type === 'double' ? 'double' : game.type === 'game' ? 'game' : 'frame',
      text:
        game.type === 'double'
          ? `Half of a double, ${table.name}`
          : `${label}, ${table.name}, lost to ${winnerText}`,
      charge: amounts[loserId],
      by,
      at: game.startedAt,
      tonight: true,
      ...(doubled ? { doubled: true } : {}),
    }),
  );
}

/** Ends a frame or a game: the loser (or the losing side) is charged. */
export function endGame(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: EndGameRequest,
): EndGameResult {
  const game = activeGame(db, id);
  const table = db.table(game.tableId);
  if (game.type === 'century' || game.type === 'room') {
    fail('VALIDATION', 'End a Century or a room with its own button.');
  }
  const loserIds = request.loserIds ?? [];
  const all = playersOf(game);
  if (loserIds.length === 0 || loserIds.some((l) => !all.includes(l))) {
    fail('VALIDATION', 'Choose who lost.');
  }
  const elapsedMs = elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt);

  // Past the game's own time limit the worker chooses (Q2, D56): the normal price, or double. It is the same for a
  // single frame, a double frame and a game of pool, foosball, carrom, ludo or PlayStation; a double frame's price
  // is doubled, then the losing side splits it.
  const chargedDouble = request.chargeDouble === true;
  if (chargedDouble && !isGameOverLimit(game, elapsedMs)) {
    const limit = gameLimit(game);
    fail(
      'VALIDATION',
      limit === undefined
        ? 'A Century or a room is charged by the minute, never double.'
        : `A game is charged double only after ${limit} minutes.`,
    );
  }
  const normalAmount: Rs = game.price;
  let amount: Rs;
  let amounts: Record<string, Rs>;
  if (game.type === 'double') {
    const side = game.sides?.find((s) => loserIds.every((l) => s.includes(l)));
    if (!side) fail('VALIDATION', 'The losers must be on the same side.');
    // game.price is the whole double price. doubleCharge takes the price of one frame and doubles it, so
    // half of game.price gives the normal total and game.price gives the double charge.
    const result = rule(() =>
      doubleCharge(chargedDouble ? game.price : game.price / 2, loserIds, request.split),
    );
    amount = result.total;
    amounts = result.split;
  } else {
    if (loserIds.length !== 1) fail('VALIDATION', 'Choose one player who lost.');
    amount = rule(() => frameCharge(game.price));
    if (chargedDouble) amount = overtimeOptions(game.price).double;
    amounts = { [loserIds[0]]: amount };
  }

  const lines = postFrameLines(db, by, game, loserIds, amounts, chargedDouble);
  finish(db, by, game, 'ended');
  game.result = {
    loserIds,
    amount,
    ...(chargedDouble ? { chargedDouble: true } : {}),
    ...(game.type === 'double' ? { split: amounts } : {}),
    minutes: Math.floor(elapsedMs / MINUTE_MS),
    lineIds: lines.map((line) => line.id),
  };

  // Statistics and sheet totals.
  const winners = all.filter((p) => !loserIds.includes(p));
  for (const pid of all) {
    const player = db.player(pid);
    player.framesPlayed += 1;
    if (winners.includes(pid)) player.framesWon += 1;
    if (loserIds.includes(pid)) player.spent += amounts[pid] ?? 0;
  }
  const session = db.s.sessions.find((s) => s.id === game.sessionId);
  session?.frames.push({
    no: game.frameNo ?? session.frames.length + 1,
    loserIds,
    amount,
    startedAt: game.startedAt,
    endedAt: game.endedAt ?? db.nowIso(),
  });
  db.s.today.frames += 1;
  if (game.type === 'double') db.s.today.doubles += 1;
  db.s.today.earned += amount;
  db.s.deltas.earned += amount;

  if (chargedDouble) {
    const payers = loserIds.map((l) => playerName(db, l)).join(' and ');
    db.logActivity(by, 'double-charge', `Charged double on ${table.name}`, {
      detail: `${game.type === 'game' ? 'Game' : 'Frame'} ran ${Math.floor(elapsedMs / MINUTE_MS)} minutes, over its limit of ${gameLimit(game)}. ${payers} paid ${formatRs(amount)} instead of ${formatRs(normalAmount)}.`,
      amount: amount - normalAmount,
    });
  }
  db.history(
    by,
    `Ended ${table.name}: ${loserIds.map((l) => playerName(db, l)).join(' and ')} lost`,
    amount,
  );
  changed(db, game);
  db.emit('waiting.changed');
  return { game, amount, lines };
}

/** The same players, the next frame on the same table (D10, screen 18). */
export function nextFrame(db: MockDb, by: PersonRef, id: string): Game {
  const last = db.game(id);
  if (last.status !== 'ended' || last.type !== 'single' || !last.playerIds) {
    fail('VALIDATION', 'There is no frame to follow.');
  }
  const table = db.table(last.tableId);
  if (table.outOfOrder) fail('TABLE_OUT_OF_ORDER', `${table.name} is out of order.`);
  if (db.activeGameOn(table.id)) fail('TABLE_BUSY', `${table.name} is in use.`);
  const next: Game = {
    id: db.nextId('g'),
    tableId: table.id,
    sheetId: db.s.currentSheetId,
    type: 'single',
    status: 'running',
    startedAt: db.nowIso(),
    startedBy: by,
    pausedMs: 0,
    price: last.price,
    playerIds: [...last.playerIds],
    ...(last.sessionId ? { sessionId: last.sessionId } : {}),
    frameNo: (last.frameNo ?? 1) + 1,
  };
  db.s.games.push(next);
  db.history(by, `Started frame ${next.frameNo} on ${table.name}, ${priceText(next)}`);
  changed(db, next);
  return next;
}

/**
 * "Tapped the wrong player?" on screen 18 (DEFAULT, needs answer): the worker who charged a frame can take the charge
 * back for 2 minutes, as long as no other game has started on the table. The statement lines, the player's numbers,
 * the session score and the sheet's totals go back, the frame runs again from where it ended (the time since is not
 * counted), and Activity shows the undo with his name.
 */
export function undoEnd(db: MockDb, by: PersonRef, id: string): Game {
  const game = db.game(id);
  const result = game.result;
  const charged = game.type === 'single' || game.type === 'double' || game.type === 'game';
  if (game.status !== 'ended' || !charged || !result || !game.endedAt) {
    fail('GAME_NOT_RUNNING', 'That frame is not charged.');
  }
  const table = db.table(game.tableId);
  if (game.endedBy?.id !== by.id) {
    const name = game.endedBy?.name.split(' ')[0] ?? 'Another worker';
    fail('NOT_ALLOWED', `${name} charged this frame, so only ${name} can undo it.`);
  }
  if (!canUndo(game.endedAt, db.now())) {
    fail('UNDO_EXPIRED', 'It is more than 2 minutes since the frame was charged.');
  }
  if (db.activeGameOn(table.id)) fail('TABLE_BUSY', `A game has already started on ${table.name}.`);

  const names = result.loserIds.map((l) => playerName(db, l)).join(' and ');
  const lineIds = new Set(result.lineIds ?? []);
  for (const loserId of result.loserIds) {
    for (const line of [...db.statement(loserId)]) {
      if (lineIds.has(line.id)) db.removeLine(loserId, line.id);
    }
  }
  const all = playersOf(game);
  const winners = all.filter((p) => !result.loserIds.includes(p));
  for (const pid of all) {
    const player = db.player(pid);
    player.framesPlayed -= 1;
    if (winners.includes(pid)) player.framesWon -= 1;
    if (result.loserIds.includes(pid)) player.spent -= result.split?.[pid] ?? result.amount;
  }
  const session = db.s.sessions.find((s) => s.id === game.sessionId);
  if (session) {
    session.frames = session.frames.filter(
      (f) => !(f.no === game.frameNo && f.endedAt === game.endedAt),
    );
  }
  db.s.today.frames -= 1;
  if (game.type === 'double') db.s.today.doubles -= 1;
  db.s.today.earned -= result.amount;
  db.s.deltas.earned -= result.amount;
  if (result.chargedDouble) {
    db.s.activity = db.s.activity.filter(
      (a) => !(a.type === 'double-charge' && a.at === game.endedAt && a.title.endsWith(table.name)),
    );
  }

  // Running again: the time since it ended is not played time.
  game.pausedMs += Math.max(0, db.now() - Date.parse(game.endedAt));
  game.status = 'running';
  delete game.endedAt;
  delete game.endedBy;
  delete game.result;

  db.logActivity(by, 'undo', `Frame undone on ${table.name}`, {
    detail: `${formatRs(result.amount)} taken off ${names}’s bill. The frame is running again.`,
    amount: result.amount,
  });
  db.history(by, `Undid the charge of ${table.name}: ${names}`, result.amount);
  changed(db, game);
  db.emit('waiting.changed');
  return game;
}

export function endCentury(db: MockDb, by: PersonRef, id: string): EndGameResult {
  const game = activeGame(db, id);
  if (game.type !== 'century' || !game.underPlayerId) fail('VALIDATION', 'That is not a Century.');
  const table = db.table(game.tableId);
  const elapsedMs = elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt);
  const amount = centuryCharge(elapsedMs, game.price);
  const minutes = Math.floor(elapsedMs / MINUTE_MS);

  const line = db.postLine(game.underPlayerId, {
    kind: 'century',
    text: `Century, ${table.name}, ${minutes} min at ${formatRs(game.price)}`,
    charge: amount,
    by,
    at: game.startedAt,
    tonight: true,
  });
  finish(db, by, game, 'ended');
  game.result = { loserIds: [game.underPlayerId], amount, minutes };
  const player = db.player(game.underPlayerId);
  player.centuryMinutes += minutes;
  player.spent += amount;
  db.s.today.centuryMinutes += minutes;
  db.s.today.centuryGames += 1;
  db.s.today.earned += amount;
  db.s.deltas.earned += amount;
  db.history(by, `Ended Century on ${table.name}: ${minutes} min`, amount);
  changed(db, game);
  db.emit('waiting.changed');
  return { game, amount, minutes, lines: [line] };
}

export function startRoom(
  db: MockDb,
  by: PersonRef,
  tableId: string,
  request: StartRoomRequest,
): Game {
  const table = db.table(tableId);
  if (table.kind !== 'room') fail('VALIDATION', 'That is not a room.');
  return startGame(db, by, {
    tableId,
    type: 'room',
    underPlayerId: request.underPlayerId,
    price: request.hourly,
  });
}

function formatHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function endRoom(db: MockDb, by: PersonRef, id: string): EndGameResult {
  const game = activeGame(db, id);
  if (game.type !== 'room' || !game.underPlayerId) fail('VALIDATION', 'That is not a room game.');
  const table = db.table(game.tableId);
  const category = db.s.categories.find((c) => c.id === table.categoryId);
  const minMinutes = category?.minMinutes ?? db.s.settings.rules.roomMinMinutes;
  const elapsedMs = elapsed(game.startedAt, db.now(), game.pausedMs, game.pausedAt);
  const amount = roomCharge(elapsedMs, game.price, minMinutes);
  const minutes = Math.max(Math.floor(elapsedMs / MINUTE_MS), minMinutes);

  const line = db.postLine(game.underPlayerId, {
    kind: 'room',
    text: `${table.name}, ${formatHoursMinutes(minutes)}`,
    charge: amount,
    by,
    at: game.startedAt,
    tonight: true,
  });
  finish(db, by, game, 'ended');
  game.result = { loserIds: [game.underPlayerId], amount, minutes };
  db.player(game.underPlayerId).spent += amount;
  db.s.today.rooms += 1;
  db.s.today.roomMinutes += minutes;
  db.s.today.earned += amount;
  db.s.deltas.earned += amount;
  db.history(by, `Ended ${table.name}: ${formatHoursMinutes(minutes)}`, amount);
  changed(db, game);
  db.emit('waiting.changed');
  return { game, amount, minutes, lines: [line] };
}

export { isActive, playersOf };
