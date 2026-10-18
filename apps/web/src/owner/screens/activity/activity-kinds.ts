import { formatAmount, type ActivityEvent, type ActivityType } from '@stockers/shared';

/** The filter chips of screen 38. A chip may be several event types ("Discarded and cancelled" is a discard, a cancel and an undo). */
export const KINDS = [
  { id: 'all', types: null },
  { id: 'discounts', types: ['discount'] },
  { id: 'cancelled', types: ['discard', 'cancel', 'undo'] },
  { id: 'double', types: ['double-charge'] },
  { id: 'damage', types: ['damage'] },
  { id: 'disputes', types: ['dispute'] },
  { id: 'drawer', types: ['drawer-expense'] },
  { id: 'edits', types: ['edit'] },
  { id: 'left', types: ['left-without-checkout'] },
  { id: 'cash', types: ['cash-difference'] },
] as const satisfies readonly { id: string; types: readonly ActivityType[] | null }[];

export type KindId = (typeof KINDS)[number]['id'];

/** How many events a chip holds, from the server's count of each type (`counts.all` is every event). */
export function kindCount(counts: Record<string, number>, id: KindId): number {
  const kind = KINDS.find((item) => item.id === id);
  if (!kind || kind.types === null) return counts.all ?? 0;
  return kind.types.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
}

export function inKind(event: ActivityEvent, id: KindId): boolean {
  const kind = KINDS.find((item) => item.id === id);
  if (!kind || kind.types === null) return true;
  return (kind.types as readonly ActivityType[]).includes(event.type);
}

/** The colour of an amount in the list: red for what left the drawer or the sheet, green for what was charged on top, amber for what waits. */
export type AmountTone = 'red' | 'green' | 'amber' | 'plain' | 'muted';

export interface AmountView {
  /** The figure written the way the designs write it: `− 200`, `+ 1,500`, `700`, or `–` when there is none. */
  text: string;
  /** Words that go with it (`not charged`, `waiting`), by key, for the screen to translate. */
  note?: 'notCharged' | 'waiting';
  tone: AmountTone;
  bold: boolean;
}

/**
 * What the Amount column shows for an event (screen 38): a sign and the figure for money that moved, "250 not charged" for a
 * discarded frame, "250 waiting" for a dispute nobody has decided, and a dash when there is no amount. The sign comes from
 * the amount (a negative amount took money off), so the list says the same as the server.
 */
export function amountView(event: ActivityEvent): AmountView {
  const { amount } = event;
  if (amount === undefined || amount === null) return { text: '–', tone: 'muted', bold: false };
  const figure = formatAmount(Math.abs(amount));
  switch (event.type) {
    case 'dispute':
      return event.needsDecision
        ? { text: figure, note: 'waiting', tone: 'amber', bold: true }
        : { text: figure, tone: 'plain', bold: true };
    case 'discard':
      return { text: figure, note: 'notCharged', tone: 'plain', bold: true };
    case 'left-without-checkout':
      return { text: figure, tone: 'amber', bold: true };
    default:
      if (amount < 0) {
        const red = event.type === 'cash-difference' || event.type === 'drawer-expense';
        return { text: `− ${figure}`, tone: red ? 'red' : 'plain', bold: true };
      }
      return { text: `+ ${figure}`, tone: 'green', bold: true };
  }
}
