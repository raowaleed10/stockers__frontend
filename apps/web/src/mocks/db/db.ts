import type {
  ActivityEvent,
  ActivityFacts,
  CounterAlert,
  ActivityType,
  AppNotification,
  Game,
  ISO,
  Owner,
  PersonRef,
  Player,
  Sheet,
  StatementLine,
  Table,
  WorkerSessionEvent,
  WorkerSessionEventKind,
} from '@stockers/shared';
import { runningBalances, toClubIso } from '@stockers/shared';
import { eventBus, type LiveEventName, type LiveEventPayload } from '@/lib/events';
import { fail } from './errors';
import type { DbState, StoredWorker } from './state';

/**
 * The in-memory store behind the mock API. It holds the state and the small helpers every operation
 * uses: the time, new ids, names for "done by", and the activity, notification and history logs.
 * Operations themselves live in the other files of this folder.
 */
export class MockDb {
  readonly s: DbState;
  private clockNow: () => number;

  constructor(state: DbState, now: () => number) {
    this.s = state;
    this.clockNow = now;
  }

  /** Runs `run` as if it were `atMs` (used to replay the 3:40 AM close of the `closed` scenario). */
  runAt<T>(atMs: number, run: () => T): T {
    const real = this.clockNow;
    this.clockNow = () => atMs;
    try {
      return run();
    } finally {
      this.clockNow = real;
    }
  }

  /** The demo clock, in epoch milliseconds. */
  now(): number {
    return this.clockNow();
  }

  nowIso(): ISO {
    return toClubIso(this.now());
  }

  /** `g-12`, `l-345`: a new id with a counter per prefix. */
  nextId(prefix: string): string {
    this.s.seq[prefix] = (this.s.seq[prefix] ?? 0) + 1;
    return `${prefix}-${this.s.seq[prefix]}`;
  }

  emit(name: LiveEventName, payload?: LiveEventPayload): void {
    eventBus.emit(name, payload);
  }

  // People -------------------------------------------------------------------------------------

  workerPerson(worker: Pick<StoredWorker, 'id' | 'name'>): PersonRef {
    return { id: worker.id, name: worker.name, role: 'worker' };
  }

  ownerPerson(owner: Pick<Owner, 'id' | 'name'>): PersonRef {
    return { id: owner.id, name: owner.name, role: 'owner' };
  }

  // Lookups ------------------------------------------------------------------------------------

  player(id: string): Player {
    return (
      this.s.players.find((p) => p.id === id) ?? fail('NOT_FOUND', 'That player was not found.')
    );
  }

  table(id: string): Table {
    return this.s.tables.find((t) => t.id === id) ?? fail('NOT_FOUND', 'That table was not found.');
  }

  game(id: string): Game {
    return this.s.games.find((g) => g.id === id) ?? fail('NOT_FOUND', 'That game was not found.');
  }

  sheet(id: string): Sheet {
    return this.s.sheets.find((s) => s.id === id) ?? fail('NOT_FOUND', 'That sheet was not found.');
  }

  get currentSheet(): Sheet {
    return this.sheet(this.s.currentSheetId);
  }

  /** The game on a table that is running or paused. */
  activeGameOn(tableId: string): Game | undefined {
    return this.s.games.find(
      (g) => g.tableId === tableId && (g.status === 'running' || g.status === 'paused'),
    );
  }

  methodName(id: string): string {
    return this.s.paymentMethods.find((m) => m.id === id)?.name ?? id;
  }

  // Logs ---------------------------------------------------------------------------------------

  /** Adds an event to Activity (newest first). */
  logActivity(
    by: PersonRef,
    type: ActivityType,
    title: string,
    options: {
      detail?: string;
      amount?: number;
      sheetId?: string | null;
      needsDecision?: boolean;
      facts?: ActivityFacts;
    } = {},
  ): ActivityEvent {
    const event: ActivityEvent = {
      id: this.nextId('a'),
      at: this.nowIso(),
      by,
      type,
      title,
      ...(options.detail !== undefined ? { detail: options.detail } : {}),
      ...(options.amount !== undefined ? { amount: options.amount } : {}),
      ...(options.sheetId === null ? {} : { sheetId: options.sheetId ?? this.s.currentSheetId }),
      ...(options.needsDecision ? { needsDecision: true } : {}),
      ...(options.facts ? { facts: options.facts } : {}),
    };
    this.s.activity.unshift(event);
    return event;
  }

  /** Adds an owner notification (unless the owners switched that kind off) and tells the screens. */
  notify(
    kind: AppNotification['kind'],
    title: string,
    text: string,
    amount?: number,
  ): AppNotification | null {
    if (!this.s.settings.alerts[kind]) return null;
    const note: AppNotification = {
      id: this.nextId('n'),
      at: this.nowIso(),
      kind,
      title,
      text,
      ...(amount !== undefined ? { amount } : {}),
      read: false,
    };
    this.s.notifications.unshift(note);
    this.emit('notification.created', { id: note.id });
    return note;
  }

  /** A line in the sheet's history: who did what (screen 42). */
  history(by: PersonRef, text: string, amount?: number, sheetId?: string): void {
    const id = sheetId ?? this.s.currentSheetId;
    const lines = (this.s.sheetHistory[id] ??= []);
    lines.push({
      id: this.nextId('h'),
      at: this.nowIso(),
      by,
      text,
      ...(amount !== undefined ? { amount } : {}),
    });
  }

  /** A sign-in, sign-out, automatic sign-out, refusal or lockout of a worker. Not part of Activity. */
  workerEvent(workerId: string, kind: WorkerSessionEventKind, at?: ISO): WorkerSessionEvent {
    const event: WorkerSessionEvent = {
      id: this.nextId('w'),
      at: at ?? this.nowIso(),
      workerId,
      kind,
    };
    this.s.workerEvents.push(event);
    return event;
  }

  /** An alert on the counter's bell. Counter alerts are separate from the owners' notifications. */
  counterAlert(kind: CounterAlert['kind'], title: string, text: string): CounterAlert {
    const alert: CounterAlert = {
      id: this.nextId('c'),
      at: this.nowIso(),
      kind,
      title,
      text,
      read: false,
    };
    this.s.counterAlerts.unshift(alert);
    this.emit('notification.created', { id: alert.id });
    return alert;
  }

  // Statements ---------------------------------------------------------------------------------

  statement(playerId: string): StatementLine[] {
    return (this.s.statements[playerId] ??= []);
  }

  /** Tonight's lines: charges not checked out yet. */
  tonightLines(playerId: string): StatementLine[] {
    return this.statement(playerId).filter((line) => this.s.unsettled.has(line.id));
  }

  /**
   * Adds a line to a player's statement and moves his balance (charge up, payment down).
   * The line carries the balance after it. A charge that is not paid yet is "tonight" until checkout.
   */
  postLine(
    playerId: string,
    input: {
      kind: StatementLine['kind'];
      text: string;
      charge?: number;
      paid?: number;
      by: PersonRef;
      method?: string;
      at?: ISO;
      tonight?: boolean;
      sheetId?: string;
      /** A canteen sale: what was sold and how many. */
      item?: StatementLine['item'];
      /** A frame or game charged double (Q2). */
      doubled?: boolean;
    },
  ): StatementLine {
    const player = this.player(playerId);
    const before = player.balance;
    const after = before + (input.charge ?? 0) - (input.paid ?? 0);
    const line: StatementLine = {
      id: this.nextId('l'),
      playerId,
      at: input.at ?? this.nowIso(),
      kind: input.kind,
      text: input.text,
      ...(input.charge !== undefined ? { charge: input.charge } : {}),
      ...(input.paid !== undefined ? { paid: input.paid } : {}),
      balance: after,
      doneBy: input.by,
      ...(input.method !== undefined ? { method: input.method } : {}),
      ...(input.item ? { item: input.item } : {}),
      ...(input.doubled ? { doubled: true } : {}),
      sheetId: input.sheetId ?? this.s.currentSheetId,
    };
    // A statement is in time order. A frame is posted when it ends but dated when it started, so it can
    // belong before lines posted since; the balance after each line is then worked out again.
    const lines = this.statement(playerId);
    let index = lines.length;
    while (index > 0 && lines[index - 1].at > line.at) index -= 1;
    lines.splice(index, 0, line);
    if (index < lines.length - 1) {
      runningBalances(lines).forEach((balance, i) => {
        lines[i].balance = balance;
      });
    }
    if (input.tonight) this.s.unsettled.add(line.id);
    this.setBalance(player, after, line.at);
    return line;
  }

  /**
   * Takes a line off a player's statement again (an undone frame): his balance goes back, the lines after it are worked
   * out again, and it is no longer "tonight".
   */
  removeLine(playerId: string, lineId: string): StatementLine | undefined {
    const lines = this.statement(playerId);
    const index = lines.findIndex((line) => line.id === lineId);
    if (index < 0) return undefined;
    const [line] = lines.splice(index, 1);
    runningBalances(lines).forEach((balance, i) => {
      lines[i].balance = balance;
    });
    this.s.unsettled.delete(line.id);
    const player = this.player(playerId);
    this.setBalance(player, player.balance - (line.charge ?? 0) + (line.paid ?? 0), line.at);
    return line;
  }

  /** Sets a balance and keeps "oldest unpaid" and the credit totals right. */
  setBalance(player: Player, balance: number, at: ISO): void {
    const before = player.balance;
    this.s.deltas.creditOwed += Math.max(0, balance) - Math.max(0, before);
    this.s.deltas.advanceHeld += Math.max(0, -balance) - Math.max(0, -before);
    player.balance = balance;
    if (balance > 0 && !player.oldestUnpaidAt) player.oldestUnpaidAt = at;
    if (balance <= 0) delete player.oldestUnpaidAt;
  }
}
