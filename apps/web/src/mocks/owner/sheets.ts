import type {
  EditEntryRequest,
  ExportFormat,
  PersonRef,
  Sheet,
  SheetDetail,
  SheetEntry,
  SheetFolder,
  SheetRow,
} from '@stockers/shared';
import { formatRs, sheetReceived } from '@stockers/shared';
import type { MockDb } from '../db/db';
import { fail } from '../db/errors';
import type { TodayState } from '../db/state';

/** The numbers of a sheet. The open sheet shows the running totals; a closed one shows what it ended on. */
function withNumbers(db: MockDb, sheet: Sheet): Sheet {
  if (sheet.id !== db.s.currentSheetId) return sheet;
  const t = db.s.today;
  return {
    ...sheet,
    earned: t.earned,
    received: sheetReceived({ cash: t.cashReceived, online: t.online }),
    newCredit: t.newCredit,
    oldCreditPaid: t.oldCreditPaid,
    discounts: { ...t.discounts },
    cash: {
      received: t.cashReceived,
      drawerExpenses: t.drawerExpenses,
      expected: t.cashReceived - t.drawerExpenses,
    },
    online: { ...t.online },
    frames: t.frames,
    centuryMinutes: t.centuryMinutes,
    roomMinutes: t.roomMinutes,
  };
}

const isOpen = (sheet: Sheet) => sheet.closedAt === undefined;

/** The things an owner can correct on a sheet (screen 42), with how to read and change each. */
const ENTRIES: {
  id: string;
  label: string;
  unit: SheetEntry['unit'];
  read: (sheet: Sheet) => number;
  writeClosed: (sheet: Sheet, value: number) => void;
  writeOpen: (today: TodayState, value: number) => void;
}[] = [
  {
    id: 'earned',
    label: 'Earned',
    unit: 'rs',
    read: (s) => s.earned,
    writeClosed: (s, v) => void (s.earned = v),
    writeOpen: (t, v) => void (t.earned = v),
  },
  {
    id: 'cash-received',
    label: 'Cash received',
    unit: 'rs',
    read: (s) => s.cash.received,
    writeClosed: (s, v) => {
      s.cash.received = v;
      s.cash.expected = v - s.cash.drawerExpenses;
      if (s.cash.counted !== undefined) s.cash.difference = s.cash.counted - s.cash.expected;
    },
    writeOpen: (t, v) => void (t.cashReceived = v),
  },
  {
    id: 'drawer-expenses',
    label: 'Expenses from the drawer',
    unit: 'rs',
    read: (s) => s.cash.drawerExpenses,
    writeClosed: (s, v) => {
      s.cash.drawerExpenses = v;
      s.cash.expected = s.cash.received - v;
      if (s.cash.counted !== undefined) s.cash.difference = s.cash.counted - s.cash.expected;
    },
    writeOpen: (t, v) => void (t.drawerExpenses = v),
  },
  {
    id: 'frames',
    label: 'Frames',
    unit: 'count',
    read: (s) => s.frames,
    writeClosed: (s, v) => void (s.frames = v),
    writeOpen: (t, v) => void (t.frames = v),
  },
  {
    id: 'century-minutes',
    label: 'Century minutes',
    unit: 'minutes',
    read: (s) => s.centuryMinutes,
    writeClosed: (s, v) => void (s.centuryMinutes = v),
    writeOpen: (t, v) => void (t.centuryMinutes = v),
  },
  {
    id: 'room-minutes',
    label: 'Room minutes',
    unit: 'minutes',
    read: (s) => s.roomMinutes,
    writeClosed: (s, v) => void (s.roomMinutes = v),
    writeOpen: (t, v) => void (t.roomMinutes = v),
  },
  {
    id: 'discounts-total',
    label: 'Discounts given',
    unit: 'rs',
    read: (s) => s.discounts.total,
    writeClosed: (s, v) => void (s.discounts.total = v),
    writeOpen: (t, v) => void (t.discounts.total = v),
  },
];

function monthOf(sheet: Sheet): string {
  return sheet.openedAt.slice(0, 7);
}

/** `GET /sheets/folders`: a folder for each month (D35). The seed holds the past months. */
export function sheetFolders(db: MockDb): SheetFolder[] {
  const currentMonth = monthOf(db.currentSheet);
  const added = db.s.sheets.length - db.s.baseSheetCount;
  return db.s.aggregates.sheetFolders.map((folder) =>
    folder.month === currentMonth
      ? {
          ...folder,
          sheets: folder.sheets + added,
          earned: folder.earned + db.s.deltas.sheetsEarned,
        }
      : { ...folder },
  );
}

/** `GET /sheets?month=`: the sheets that started in that month, newest first. */
export function sheetsOfMonth(db: MockDb, month: string): SheetRow[] {
  return db.s.sheets
    .filter((sheet) => monthOf(sheet) === month)
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .map((sheet) => ({ ...withNumbers(db, sheet), open: isOpen(sheet) }));
}

export function sheetDetail(db: MockDb, id: string): SheetDetail {
  const sheet = db.sheet(id);
  const numbers = withNumbers(db, sheet);
  const extras = db.s.sheetExtras[id];
  return {
    ...numbers,
    open: isOpen(sheet),
    entries: ENTRIES.map((entry) => ({
      id: entry.id,
      label: entry.label,
      unit: entry.unit,
      value: entry.read(numbers),
    })),
    history: [...(db.s.sheetHistory[id] ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
    ...(extras?.byTable ? { byTable: extras.byTable } : {}),
    ...(extras?.canteen ? { canteen: extras.canteen } : {}),
  };
}

const show = (unit: SheetEntry['unit'], value: number) =>
  unit === 'rs' ? formatRs(value) : String(value);

/** An owner corrects one entry of a sheet. A reason is required and every edit is recorded (D30). */
export function editEntry(
  db: MockDb,
  by: PersonRef,
  sheetId: string,
  entryId: string,
  request: EditEntryRequest,
): SheetDetail {
  const sheet = db.sheet(sheetId);
  const entry = ENTRIES.find((e) => e.id === entryId);
  if (!entry) fail('NOT_FOUND', 'That entry was not found.');
  const reason = request.reason?.trim();
  if (!reason) fail('NOTE_REQUIRED', 'Write why you are changing it.');
  if (!Number.isInteger(request.value) || request.value < 0) {
    fail('VALIDATION', 'Type a whole number, 0 or more.');
  }
  const before = entry.read(withNumbers(db, sheet));
  if (before === request.value) fail('VALIDATION', 'That is the number it already has.');

  if (isOpen(sheet)) entry.writeOpen(db.s.today, request.value);
  else entry.writeClosed(sheet, request.value);
  if (!sheet.editedBy?.some((p) => p.id === by.id))
    sheet.editedBy = [...(sheet.editedBy ?? []), by];

  const change = `${entry.label} ${show(entry.unit, before)} to ${show(entry.unit, request.value)}`;
  const amount = entry.unit === 'rs' ? request.value - before : undefined;
  db.history(
    by,
    `Edited ${entry.label.toLowerCase()}: ${show(entry.unit, before)} to ${show(entry.unit, request.value)}. “${reason}”`,
    amount,
    sheetId,
  );
  db.logActivity(by, 'edit', `Edited sheet ${sheet.number}: ${change}`, {
    detail: `“${reason}”`,
    sheetId,
    ...(amount !== undefined ? { amount } : {}),
  });
  db.notify(
    'edited',
    `${by.name.split(' ')[0]} edited sheet ${sheet.number}`,
    `${change}.`,
    amount,
  );
  db.emit('board.changed');
  return sheetDetail(db, sheetId);
}

/** A stand-in for the PDF and Excel downloads (D36); P13 builds the real files. */
export function exportSheet(db: MockDb, id: string, format: ExportFormat) {
  const sheet = db.sheet(id);
  const name = `sheet-${sheet.number}.${format === 'pdf' ? 'pdf' : 'xlsx'}.txt`;
  const content = `Sheet ${sheet.number} (${format}). This is a stand-in file from the mock server.\n`;
  return { content, type: 'text/plain; charset=utf-8', name };
}
