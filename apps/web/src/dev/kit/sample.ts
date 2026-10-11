import type { PersonRef } from '@stockers/shared';
import type { StatementRow } from '@/ui/StatementTable';

const shabir: PersonRef = { id: 'w-shabir', name: 'Shabir', role: 'worker' };
const zain: PersonRef = { id: 'w-zain', name: 'Zain', role: 'worker' };

/** Kamran Iqbal's statement, as on screen 30. */
export const STATEMENT_LINES: StatementRow[] = [
  {
    id: 'l1',
    playerId: 'kamran',
    at: '2026-09-15T21:10:00+05:00',
    kind: 'frame',
    text: 'Frame, Table 2, lost to Imran',
    charge: 250,
    balance: 250,
    doneBy: shabir,
  },
  {
    id: 'l2',
    playerId: 'kamran',
    at: '2026-09-15T21:40:00+05:00',
    kind: 'frame',
    text: 'Frame, Table 2, lost to Imran',
    charge: 250,
    balance: 500,
    doneBy: shabir,
  },
  {
    id: 'l3',
    playerId: 'kamran',
    at: '2026-09-15T22:15:00+05:00',
    kind: 'canteen',
    text: 'Cold drink, canteen',
    charge: 120,
    balance: 620,
    doneBy: zain,
  },
  {
    id: 'l4',
    playerId: 'kamran',
    at: '2026-09-16T04:02:00+05:00',
    kind: 'left-without-checkout',
    text: 'Left without checkout, moved to credit',
    balance: 620,
    doneBy: { id: 'system', name: 'System', role: 'system' },
  },
  {
    id: 'l5',
    playerId: 'kamran',
    at: '2026-10-03T21:20:00+05:00',
    kind: 'double',
    text: 'Half of a double, Table 2',
    charge: 250,
    balance: 1350,
    doneBy: zain,
  },
];

/** Bilal Ahmed's charges tonight, as on screen 25. */
export const BILL_LINES: StatementRow[] = [
  {
    id: 'b1',
    playerId: 'bilal',
    at: '2026-10-03T20:31:00+05:00',
    kind: 'frame',
    text: 'Frame 1, Table 1',
    detail: 'lost to Ali Raza',
    charge: 250,
    balance: 250,
    doneBy: shabir,
  },
  {
    id: 'b2',
    playerId: 'bilal',
    at: '2026-10-03T20:56:00+05:00',
    kind: 'frame',
    text: 'Frame 2, Table 1',
    detail: 'lost to Ali Raza',
    charge: 250,
    balance: 500,
    doneBy: shabir,
  },
  {
    id: 'b3',
    playerId: 'bilal',
    at: '2026-10-03T21:30:00+05:00',
    kind: 'canteen',
    text: 'Tea × 2, canteen',
    charge: 100,
    balance: 600,
    doneBy: zain,
  },
];

export interface ExpenseRow {
  id: string;
  when: string;
  what: 'r1' | 'r2' | 'r3';
  type: 't1' | 't2' | 't3';
  from: 'f1' | 'f2';
  by: string;
  amount: number;
}

/** Three rows of the expenses list on screen 49. Words are keys into the kit's sample text. */
export const EXPENSES: ExpenseRow[] = [
  { id: 'e1', when: '3 Oct, 8:15 PM', what: 'r1', type: 't1', from: 'f1', by: 'Zain', amount: 500 },
  { id: 'e2', when: '3 Oct, 6:15 PM', what: 'r2', type: 't2', from: 'f2', by: 'Adil', amount: 950 },
  {
    id: 'e3',
    when: '3 Oct, 4:30 PM',
    what: 'r3',
    type: 't3',
    from: 'f2',
    by: 'Adil',
    amount: 2500,
  },
];
