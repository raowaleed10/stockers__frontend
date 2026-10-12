import type { Game, ISO, Owner, Player, Sheet, StatementLine, Worker } from '@stockers/shared';
import { MINUTE_MS, toClubIso, toMs } from '@stockers/shared';
import type { AppId } from '@/lib/app-id';
import { MockDb } from './db';
import { closeSheet } from './sheet';
import type { DbState, StoredWorker, TodayState } from './state';
import type {
  ScenarioName,
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

/**
 * Values read off screen 31 that the seed has no source for. They only start the counts; every write
 * in the session moves them. Written here so nobody mistakes them for seed data.
 */
const TODAY_COUNTS_FROM_SCREEN_31 = {
  doubles: 6,
  centuryGames: 5,
  newCreditPlayers: 7,
  oldCreditPlayers: 3,
};

/** The Table 3 dispute of the seed's activity (a2) names the players only in words; it needs them to be decided. */
const SEED_DISPUTES = {
  a2: { tableId: 't3', playerIds: ['faisal', 'naveed'] as [string, string], amount: 250 },
};

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
    doubles: TODAY_COUNTS_FROM_SCREEN_31.doubles,
    centuryMinutes: closingNight && final ? final.centuryMinutes : base.centuryMinutes,
    centuryGames: TODAY_COUNTS_FROM_SCREEN_31.centuryGames,
    rooms: base.rooms,
    roomMinutes: closingNight && final ? final.roomMinutes : 0,
    cashReceived: cash ? cash.received : base.cashReceived,
    online,
    newCredit: closingNight && final ? final.newCredit : base.newCredit,
    newCreditPlayers: TODAY_COUNTS_FROM_SCREEN_31.newCreditPlayers,
    oldCreditPaid: closingNight && final ? final.oldCreditPaid : base.oldCreditPaid,
    oldCreditPlayers: TODAY_COUNTS_FROM_SCREEN_31.oldCreditPlayers,
    expensesPaidToday: base.expensesPaidToday,
    moneyInHand: base.moneyInHand,
    drawerExpenses: cash ? cash.drawerExpenses : base.drawerExpenses,
    discounts: closingNight && final ? { ...final.discounts } : { count: 2, total: 150 },
    canteenSales: closingNight && final ? final.canteen.sales : 0,
  };
}

function plainPlayer(raw: SeedPlayer): Player {
  const { phone, oldestUnpaidAt, ...rest } = raw;
  return {
    ...rest,
    ...(phone ? { phone } : {}),
    ...(oldestUnpaidAt ? { oldestUnpaidAt } : {}),
  };
}

/** A short word for what a waiting bill is made of, when the seed does not give one. */
function kindFromSummary(summary: string): StatementLine['kind'] {
  if (/double/i.test(summary)) return 'double';
  if (/century/i.test(summary)) return 'century';
  if (/room/i.test(summary)) return 'room';
  return 'frame';
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
  // Who is working in a scenario: Shabir at 3:40 AM, not Zain.
  if (own?.signedIn) {
    for (const worker of workers) {
      delete worker.signedIn;
      if (worker.id === own.signedIn.id) {
        worker.signedIn = {
          at: toClubIso(toMs(own.now ?? raw.meta.demoNow.counter) - 98 * MINUTE_MS),
        };
      }
    }
  }

  const sheets = raw.sheets.map(toSheet);
  const sheetExtras: DbState['sheetExtras'] = {};
  for (const sheet of raw.sheets) {
    if (sheet.final)
      sheetExtras[sheet.id] = { byTable: sheet.final.byTable, canteen: sheet.final.canteen };
  }

  const games = (night?.games ?? raw.games).map(toGame);
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
    billSummaries: {},
    sheets,
    baseSheetCount: sheets.length,
    currentSheetId: raw.meta.currentSheetId,
    sheetExtras,
    sheetHistory: {},
    sheetEntryEdits: {},
    today: todayFrom(raw, scenarioName),
    games,
    sessions: night?.games ? [] : raw.sessions,
    canteenItems: raw.canteenItems,
    canteenSales: [],
    expenses: raw.expenses,
    activity: own?.activity ?? raw.activity,
    notifications: own?.activity?.length === 0 ? [] : raw.notifications,
    disputes: json(SEED_DISPUTES),
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

  // Who is signed in when the page opens.
  state.auth.session = initialSession(raw, options, own, workers, owners, db.nowIso());

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
  const tonightAt = toClubIso(toMs(onNow) - 15 * MINUTE_MS);
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

    if (row.playerId === 'bilal') {
      // Screen 25 shows Bilal's frames and tea. At 9:42 PM it is the two frames of session 1.
      const teaPart = 100;
      const frames = Math.round((row.tonight - teaPart) / 250);
      const times =
        frames >= 3
          ? ['2026-10-03T20:31:00+05:00', '2026-10-03T20:56:00+05:00', '2026-10-03T21:23:00+05:00']
          : ['2026-10-03T20:55:00+05:00', '2026-10-03T21:23:00+05:00'];
      if (frames >= 1 && frames <= times.length && frames * 250 + teaPart === row.tonight) {
        times.slice(times.length - frames).forEach((at, i) => {
          db.postLine('bilal', {
            kind: 'frame',
            text: `Frame ${times.length - frames + i + 1}, Table 1, lost to Ali Raza`,
            charge: 250,
            by: actor,
            at,
            tonight: true,
          });
        });
        db.postLine('bilal', {
          kind: 'canteen',
          text: 'Tea × 2, canteen',
          charge: teaPart,
          by: actor,
          at: '2026-10-03T21:30:00+05:00',
          tonight: true,
        });
        continue;
      }
    }
    // Any other bill: one line with the seed's own words.
    db.postLine(row.playerId, {
      kind: kindFromSummary(row.summary),
      text: row.summary,
      charge: row.tonight,
      by: actor,
      at: tonightAt,
      tonight: true,
    });
  }

  // The seed's own words for each bill, until something new is added to it.
  for (const row of waiting) s.billSummaries[row.playerId] = row.summary;

  // Somebody owing from tonight owes "since tonight" when nothing older is unpaid.
  for (const player of s.players) {
    if (player.balance > 0 && !player.oldestUnpaidAt) {
      player.oldestUnpaidAt =
        s.statements[player.id].find((l) => s.unsettled.has(l.id))?.at ?? tonightAt;
    }
  }
}
