import type {
  ActivityEvent,
  ActivityList,
  ActivityQuery,
  DecideRequest,
  PersonRef,
} from '@stockers/shared';
import { formatRs } from '@stockers/shared';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';

/** `GET /activity`: what changed money outside a normal game, newest first, only what has happened. */
export function activityList(db: MockDb, query: ActivityQuery): ActivityList {
  const now = db.now();
  const happened = db.s.activity.filter((event) => Date.parse(event.at) <= now);
  const from = query.from ? Date.parse(query.from) : null;
  const to = query.to ? Date.parse(query.to) : null;

  const events = happened.filter((event) => {
    if (query.type && event.type !== query.type) return false;
    if (query.by && event.by.id !== query.by) return false;
    const at = Date.parse(event.at);
    if (from !== null && !Number.isNaN(from) && at < from) return false;
    if (to !== null && !Number.isNaN(to) && at > to) return false;
    return true;
  });

  const counts: Record<string, number> = { all: happened.length };
  for (const event of happened) counts[event.type] = (counts[event.type] ?? 0) + 1;
  return { events, counts, needsDecision: happened.filter((e) => e.needsDecision).length };
}

/**
 * The owners decide a dispute (screen 38): one player pays, the other pays, half each, or nobody.
 * What is decided is added to his statement; the event is kept, marked as decided.
 */
export function decideDispute(
  db: MockDb,
  by: PersonRef,
  id: string,
  request: DecideRequest,
): ActivityEvent {
  const event = db.s.activity.find((e) => e.id === id);
  if (!event) fail('NOT_FOUND', 'That event was not found.');
  const info = db.s.disputes[id];
  if (!event.needsDecision || !info) fail('VALIDATION', 'There is nothing to decide here.');

  if (!['first', 'second', 'half', 'nobody'].includes(request.payer)) {
    fail('VALIDATION', 'Choose who pays.');
  }
  const [first, second] = info.playerIds;
  const payers: [string, number][] =
    request.payer === 'first'
      ? [[first, info.amount]]
      : request.payer === 'second'
        ? [[second, info.amount]]
        : request.payer === 'half'
          ? [
              [first, Math.ceil(info.amount / 2)],
              [second, Math.floor(info.amount / 2)],
            ]
          : [];

  const table = db.table(info.tableId);
  for (const [playerId, amount] of payers) {
    db.postLine(playerId, {
      kind: 'frame',
      text: `Frame, ${table.name}, dispute decided by ${by.name.split(' ')[0]}`,
      charge: amount,
      by,
      sheetId: event.sheetId,
    });
  }
  const names = payers.map(([playerId]) => db.player(playerId).name).join(' and ');
  const decision =
    payers.length === 0
      ? 'Nobody pays'
      : request.payer === 'half'
        ? `Half each (${formatRs(payers[0][1])} and ${formatRs(payers[1][1])})`
        : `${names} pays ${formatRs(info.amount)}`;
  event.needsDecision = false;
  event.detail = `${event.detail ?? ''} Decided by ${by.name.split(' ')[0]}: ${decision}.`.trim();
  db.history(by, `Decided the dispute on ${table.name}: ${decision}`, info.amount, event.sheetId);
  delete db.s.disputes[id];
  db.emit('waiting.changed');
  return event;
}
