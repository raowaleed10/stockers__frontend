import type {
  Game,
  ISO,
  Owner,
  Player,
  Session,
  Sheet,
  StatementLine,
  Worker,
} from '@stockers/shared';
import { MINUTE_MS, slotEndAfter, toClubIso, toMs } from '@stockers/shared';
import type { AppId } from '@/lib/app-id';
import { MockDb } from './db';
import { closeSheet } from './sheet';
import type { DbState, StoredWorker, TodayState } from './state';
import type {
  ScenarioName,
  SeedBillLine,
  SeedFile,
  SeedPlayer,
  SeedScenario,
  SeedSheet,
  SeedWaiting,
} from './seed-types';

export interface CreateDbOptions {
  /** `?scenario=`: another moment of the same night. */
  scenario?: ScenarioName | null;
  /** `?as=`: who is signed in at the start. `none`, a worker id or an owner id. */
  as?: string | null;
  /** Which app the page is, so the default session is a worker (counter) or an owner. */
  app?: AppId;
  /** The demo clock. Defaults to the demo clock of the page. */
  now: () => number;
}

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** A bill with no lines of its own in the seed gets one line, dated a little before the moment of the story. */
const GENERIC_BILL_MINUTES_AGO = 15;

function toGame(raw: SeedFile['games'][number]): Game {
  const { rate, price, ...rest } = raw;
  return { ...rest, price: price ?? rate ?? 0 };
}

function toSheet(raw: SeedSheet): Sheet {
  const earned = raw.earned ?? 0;
  return {
    id: raw.id,
    number: raw.number,
    openedAt: raw.openedAt,
    openedBy: raw.openedBy,
    ...(raw.closedAt ? { closedAt: raw.closedAt } : {}),
    ...(raw.closedBy ? { closedBy: raw.closedBy } : {}),
    earned,
    received: earned,
    newCredit: 0,
    oldCreditPaid: 0,
    discounts: { count: 0, total: 0 },
    cash: { received: earned, drawerExpenses: 0, expected: earned },
    online: {},
    frames: 0,
    centuryMinutes: 0,
    roomMinutes: 0,
    ...(raw.editedBy ? { editedBy: raw.editedBy } : {}),
  };
}

function todayFrom(seed: SeedFile, scenario: ScenarioName | null): TodayState {
  const base = seed.aggregates.today;
  const final = seed.sheets.find((s) => s.final)?.final;
  const closingNight = scenario === 'closing' || scenario === 'closed';
  const online = closingNight && final ? { ...final.online } : { ...base.onlineByMethod };
  const cash = closingNight && final ? final.cash : null;
  return {
    earned: closingNight && final ? final.earned : base.earned,
    frames: closingNight && final ? final.frames : base.frames,
    doubles: base.doubles,
    centuryMinutes: closingNight && final ? final.centuryMinutes : base.centuryMinutes,
    centuryGames: base.centuryGames,
    rooms: base.rooms,
    roomMinutes: closingNight && final ? final.roomMinutes : 0,
    cashReceived: cash ? cash.received : base.cashReceived,
    online,
    newCredit: closingNight && final ? final.newCredit : base.newCredit,
    newCreditPlayers: base.playersPutOnCredit,
    oldCreditPaid: closingNight && final ? final.oldCreditPaid : base.oldCreditPaid,
    oldCreditPlayers: base.playersPaidOldCredit,
    expensesPaidToday: base.expensesPaidToday,
    moneyInHand: base.moneyInHand,
    drawerExpenses: cash ? cash.drawerExpenses : base.drawerExpenses,
    discounts: closingNight && final ? { ...final.discounts } : { ...base.discounts },
    canteenSales: closingNight && final ? final.canteen.sales : 0,
  };
}

/**
 * A session shows the frames already charged. A frame the seed dates in the future of a running game
 * (frame 3 of Table 1 ends at 9:51 PM, but at 9:42 PM it is the game on the table) is not shown yet.
 */
function sessionsWithoutRunningFrames(sessions: Session[], games: Game[]): Session[] {
  return sessions.map((session) => {
    const running = games.find(
      (g) => g.sessionId === session.id && (g.status === 'running' || g.status === 'paused'),
    );
    return {
      ...session,
      frames: session.frames.filter(
        (f) => running?.frameNo === undefined || f.no < running.frameNo,
      ),
    };
  });
}

function plainPlayer(raw: SeedPlayer): Player {
  const { phone, oldestUnpaidAt, ...rest } = raw;
  return {
    ...rest,
    ...(phone ? { phone } : {}),
    ...(oldestUnpaidAt ? { oldestUnpaidAt } : {}),
  };
}

/** The statement text of a charge the seed describes only by its kind (a bill that no session explains). */
function textOf(line: SeedBillLine): string {
  switch (line.kind) {
    case 'frame':
      return 'Frame lost';
    case 'game':
      return 'Game lost';
    case 'double':
      return 'Half of a double';
    case 'century':
      return 'Century';
    case 'room':
      return 'Room';
    case 'canteen':
      return line.item
        ? `${line.item.name}${line.item.qty > 1 ? ` × ${line.item.qty}` : ''}, canteen`
        : 'Canteen';
  }
}

function initialSession(
  seed: SeedFile,
  options: CreateDbOptions,
  scenario: SeedScenario | undefined,
  workers: StoredWorker[],
  owners: Owner[],
  at: ISO,
): DbState['auth']['session'] {
  const as = options.as?.toLowerCase();
  if (as === 'none') return null;
  if (as) {
    const worker = workers.find((w) => w.id === as);
    if (worker) return { kind: 'worker', workerId: worker.id, at };
    const owner = owners.find((o) => o.id === as);
    if (owner) return { kind: 'owner', ownerId: owner.id, at };
  }
  if ((options.app ?? 'counter') === 'owner') return { kind: 'owner', ownerId: 'aqil', at };
  const workerId = scenario?.signedIn?.id ?? seed.workers.find((w) => w.signedIn)?.id;
  return workerId ? { kind: 'worker', workerId, at } : null;
}

/** Builds the store for one page load: the seed, the scenario on top of it, and who is signed in. */
export function createDb(seed: SeedFile, options: CreateDbOptions): MockDb {
  const raw = json(seed);
  const scenarioName = options.scenario ?? null;
  const own = scenarioName ? raw.scenarios[scenarioName] : undefined;
  // `closed` is `closing` plus the close itself, which is run below.
  const night: SeedScenario | undefined = scenarioName === 'closed' ? raw.scenarios.closing : own;
  const nowMs = () => options.now();

  const owners = raw.owners;
  const workers: StoredWorker[] = raw.workers.map(
    ({ demoPin, ...worker }: Worker & { demoPin: string }) => ({
      ...worker,
      pin: demoPin,
    }),
  );
  const sheets = raw.sheets.map(toSheet);
  const sheetExtras: DbState['sheetExtras'] = {};
  for (const sheet of raw.sheets) {
    if (sheet.final)
      sheetExtras[sheet.id] = { byTable: sheet.final.byTable, canteen: sheet.final.canteen };
  }

  const games = [...(night?.games ?? raw.games), ...(own?.addGames ?? [])].map(toGame);
  const state: DbState = {
    scenario: scenarioName,
    owners,
    workers,
    paymentMethods: raw.paymentMethods,
    categories: raw.categories,
    tables: raw.tables,
    players: raw.players.map(plainPlayer),
    statements: {},
    unsettled: new Set(),
    billOrder: [],
    sheets,
    baseSheetCount: sheets.length,
    currentSheetId: raw.meta.currentSheetId,
    sheetExtras,
    sheetHistory: {},
    sheetEntryEdits: {},
    today: todayFrom(raw, scenarioName),
    games,
    sessions: sessionsWithoutRunningFrames(
      night?.games ? (night.sessions ?? []) : raw.sessions,
      games,
    ),
    canteenItems: raw.canteenItems,
    canteenSales: [],
    expenses: raw.expenses,
    activity: own?.activity ?? raw.activity,
    notifications: own?.activity?.length === 0 ? [] : raw.notifications,
    counterAlerts: own?.activity?.length === 0 ? [] : raw.counterAlerts,
    workerEvents: [],
    disputes: Object.fromEntries(
      raw.disputes.map((d) => [
        d.activityId,
        { tableId: d.tableId, playerIds: d.playerIds, amount: d.amount },
      ]),
    ),
    checkoutUndo: {},
    settings: {
      ...raw.settings,
      // The seed lists the payment methods at its top level; Settings shows the same list.
      paymentMethods: raw.paymentMethods,
      email: {
        ...(raw.settings.email.aqil ? { aqil: raw.settings.email.aqil } : {}),
        ...(raw.settings.email.adil ? { adil: raw.settings.email.adil } : {}),
      },
      club: {
        name: raw.settings.club.name,
        address: raw.settings.club.address,
        ...(raw.settings.club.logo ? { logo: raw.settings.club.logo } : {}),
        ...(raw.settings.club.domain ? { domain: raw.settings.club.domain } : {}),
      },
    },
    pauseAll: null,
    lastBackupAt: null,
    deltas: {
      earned: 0,
      expenses: 0,
      canteenCost: 0,
      creditOwed: 0,
      advanceHeld: 0,
      sheetsEarned: 0,
    },
    aggregates: raw.aggregates,
    auth: { session: null, pinTries: {}, ownerTries: { count: 0, lockedUntil: 0 } },
    seq: {},
  };

  const db = new MockDb(state, nowMs);

  seedWorkerEvents(db, raw, own);

  // Who is signed in when the page opens.
  state.auth.session = initialSession(raw, options, own, workers, owners, db.nowIso());
  openWorkerSession(db);

  // Power cut: every game running was paused together (screen 16).
  if (own?.pauseAll) {
    const { at, doneBy } = own.pauseAll;
    for (const game of games) {
      if (game.status === 'running') {
        game.status = 'paused';
        game.pausedAt = at;
      }
    }
    state.pauseAll = {
      at,
      by: doneBy,
      activityId: state.activity.find((a) => a.type === 'pause-all')?.id,
    };
  }

  seedLedger(db, raw, night, own);

  // The counts the screens show start from the seed; only writes made now move them.
  state.deltas = {
    earned: 0,
    expenses: 0,
    canteenCost: 0,
    creditOwed: 0,
    advanceHeld: 0,
    sheetsEarned: 0,
  };

  // `closed`: the close at 3:40 AM has already happened (the seed holds its activity and notifications).
  const closer = own?.signedIn;
  const final = raw.sheets.find((s) => s.final)?.final;
  if (scenarioName === 'closed' && closer && final) {
    db.runAt(toMs(final.closedAt), () =>
      closeSheet(
        db,
        closer,
        { counted: final.cash.counted, note: final.cash.note },
        { silent: true },
      ),
    );
    state.deltas.sheetsEarned = 0;
    state.baseSheetCount = state.sheets.length;
  }
  return db;
}

/**
 * The sign-in history the seed implies (screen 50): Shabir signed in at 2:04 AM and was signed out when
 * his time ended at 10:00 AM; Zain has been signed in since 2:06 PM. In a scenario at 3:40 AM Zain was
 * signed out automatically at 11:00 PM and Shabir signed in at the scenario's `signedInSince`.
 */
function seedWorkerEvents(db: MockDb, raw: SeedFile, own: SeedScenario | undefined): void {
  const { s } = db;
  const events: { at: ISO; workerId: string; kind: 'sign-in' | 'auto-sign-out' }[] = [];
  for (const seeded of raw.workers) {
    if (seeded.lastSignIn) {
      events.push({ at: seeded.lastSignIn.at, workerId: seeded.id, kind: 'sign-in' });
      if (seeded.lastSignIn.until) {
        events.push({ at: seeded.lastSignIn.until, workerId: seeded.id, kind: 'auto-sign-out' });
      }
    }
    if (seeded.signedIn)
      events.push({ at: seeded.signedIn.at, workerId: seeded.id, kind: 'sign-in' });
  }
  for (const worker of s.workers) {
    if (worker.signedIn && !worker.lastSignIn) worker.lastSignIn = { at: worker.signedIn.at };
  }
  if (own?.signedIn && own.signedInSince) {
    for (const worker of s.workers) {
      if (worker.id === own.signedIn.id || !worker.signedIn) continue;
      const end = toClubIso(slotEndAfter(worker.signedIn.at, worker.slot).getTime());
      events.push({ at: end, workerId: worker.id, kind: 'auto-sign-out' });
      worker.lastSignIn = { at: worker.signedIn.at, until: end };
      delete worker.signedIn;
    }
    const worker = s.workers.find((w) => w.id === own.signedIn?.id);
    if (worker) {
      worker.signedIn = { at: own.signedInSince };
      worker.lastSignIn = { at: own.signedInSince };
      events.push({ at: own.signedInSince, workerId: worker.id, kind: 'sign-in' });
    }
  }
  events
    .sort((a, b) => a.at.localeCompare(b.at))
    .forEach((event) => db.workerEvent(event.workerId, event.kind, event.at));
}

/** A session opened with `?as=` is a real sign-in too: the worker is marked signed in, and the other signed out. */
function openWorkerSession(db: MockDb): void {
  const session = db.s.auth.session;
  if (session?.kind !== 'worker') return;
  const worker = db.s.workers.find((w) => w.id === session.workerId);
  if (!worker || worker.signedIn) return;
  for (const other of db.s.workers) {
    if (!other.signedIn) continue;
    if (other.lastSignIn) other.lastSignIn.until = db.nowIso();
    delete other.signedIn;
    db.workerEvent(other.id, 'sign-out');
  }
  worker.signedIn = { at: db.nowIso() };
  worker.lastSignIn = { at: db.nowIso() };
  db.workerEvent(worker.id, 'sign-in');
}

/**
 * The lines of one waiting bill: the frames the player lost in the sessions, dated when each frame
 * started (screen 25), and the charges the seed lists for tonight (Bilal's teas). The lines are the
 * ones that add up to the bill; if none do, the seed's own `lines` for the bill are used.
 */
function billLines(
  db: MockDb,
  raw: SeedFile,
  row: SeedWaiting,
): {
  at: ISO;
  kind: StatementLine['kind'];
  text: string;
  charge: number;
  item?: StatementLine['item'];
}[] {
  const name = (id: string) => db.player(id).name;
  const frames = raw.sessions
    .flatMap((session) =>
      session.frames
        .filter((f) => f.loserIds.includes(row.playerId))
        .map((f) => {
          const winners = session.playerIds.filter((id) => !f.loserIds.includes(id));
          return {
            at: f.startedAt,
            kind: 'frame' as const,
            text: `Frame ${f.no}, ${db.table(session.tableId).name}, lost to ${winners.map(name).join(' and ')}`,
            charge: f.amount,
            no: f.no,
          };
        }),
    )
    .sort((a, b) => a.no - b.no);
  const extras = raw.tonightCharges
    .filter((c) => c.playerId === row.playerId)
    .map(({ at, kind, text, charge, item }) => ({
      at,
      kind,
      text,
      charge,
      ...(item ? { item } : {}),
    }));
  const sum = (items: { charge: number }[]) =>
    items.reduce((total, item) => total + item.charge, 0);

  // The first frames that, with the listed charges, make the bill.
  for (let count = frames.length; count >= 0; count -= 1) {
    const lines = [...frames.slice(0, count), ...extras];
    if (lines.length > 0 && sum(lines) === row.tonight) return lines;
  }
  return [];
}

/**
 * Builds every player's statement and posts tonight's bills (decision 3 of the P03 plan).
 * The seed's `balance` is the credit from before tonight; the waiting bills are tonight's charges.
 * Posting them as statement lines makes balance equal the sum of the lines for every player.
 */
function seedLedger(
  db: MockDb,
  raw: SeedFile,
  night: SeedScenario | undefined,
  own: SeedScenario | undefined,
): void {
  const { s } = db;
  const sheetOpened = s.sheets.find((sheet) => sheet.id === s.currentSheetId)?.openedAt ?? '';
  const aqil = db.ownerPerson(s.owners.find((o) => o.id === 'aqil') ?? s.owners[0]);
  const waiting: SeedWaiting[] = night?.waiting ?? raw.waiting;
  const onNow = own?.now ?? raw.meta.demoNow.counter;
  const actor = own?.signedIn ?? db.workerPerson(s.workers.find((w) => w.signedIn) ?? s.workers[0]);
  const tonightAt = toClubIso(toMs(onNow) - GENERIC_BILL_MINUTES_AGO * MINUTE_MS);
  const waitingIds = new Set(waiting.map((row) => row.playerId));

  for (const player of s.players) {
    const example = raw.statementExamples[player.id];
    if (example) {
      // A statement the seed wrote out. Lines from tonight stay unchecked-out while the player is waiting.
      s.statements[player.id] = example.map((line, i) => ({
        id: `l-${player.id}-${i + 1}`,
        playerId: player.id,
        at: line.at,
        kind: line.kind,
        text: line.text,
        ...(line.charge !== undefined ? { charge: line.charge } : {}),
        ...(line.paid !== undefined ? { paid: line.paid } : {}),
        balance: line.balance,
        doneBy: line.doneBy,
        ...(line.method ? { method: line.method } : {}),
        ...(line.at >= sheetOpened ? { sheetId: s.currentSheetId } : {}),
      }));
      const last = s.statements[player.id].at(-1);
      player.balance = last?.balance ?? player.balance;
      if (waitingIds.has(player.id)) {
        for (const line of s.statements[player.id]) {
          if (line.sheetId === s.currentSheetId && (line.charge ?? 0) > 0) s.unsettled.add(line.id);
        }
      }
    } else if (player.balance !== 0) {
      // Old credit from the register, entered by the owners as an opening balance (D28).
      const owes = player.balance > 0;
      s.statements[player.id] = [
        {
          id: `l-${player.id}-0`,
          playerId: player.id,
          at: player.oldestUnpaidAt ?? player.since,
          kind: owes ? 'opening' : 'advance',
          text: owes ? 'Opening balance from the register' : 'Advance paid',
          ...(owes ? { charge: player.balance } : { paid: -player.balance }),
          balance: player.balance,
          doneBy: aqil,
        },
      ];
    } else {
      s.statements[player.id] = [];
    }
  }

  for (const row of waiting) {
    if (s.statements[row.playerId].some((line) => s.unsettled.has(line.id))) continue;

    const lines = billLines(db, raw, row);
    if (lines.length > 0) {
      for (const line of lines) {
        db.postLine(row.playerId, { ...line, by: actor, tonight: true });
      }
      continue;
    }
    // Any other bill: the lines the seed lists for it, which must add up to the bill.
    const listed = row.lines ?? [];
    const total = listed.reduce((sum, line) => sum + line.charge, 0);
    if (listed.length === 0 || total !== row.tonight) {
      throw new Error(
        `The seed's waiting bill for ${row.playerId} is Rs ${row.tonight} but its lines add up to Rs ${total}`,
      );
    }
    listed.forEach((line, index) => {
      db.postLine(row.playerId, {
        kind: line.kind,
        text: line.text ?? textOf(line),
        charge: line.charge,
        ...(line.item ? { item: line.item } : {}),
        ...(line.doubled ? { doubled: true } : {}),
        by: actor,
        // One minute apart, so the lines keep the order the seed lists them in.
        at: toClubIso(toMs(tonightAt) + index * MINUTE_MS),
        tonight: true,
      });
    });
  }

  // The waiting list is in the order the seed lists it.
  s.billOrder = waiting.map((row) => row.playerId);

  // Somebody owing from tonight owes "since tonight" when nothing older is unpaid.
  for (const player of s.players) {
    if (player.balance > 0 && !player.oldestUnpaidAt) {
      player.oldestUnpaidAt =
        s.statements[player.id].find((l) => s.unsettled.has(l.id))?.at ?? tonightAt;
    }
  }
}
