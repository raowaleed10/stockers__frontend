import { create } from 'zustand';

/** The reasons for a discount, in the order the screen draws them (screen 27). `key` is the word's key in the language files. */
export const DISCOUNT_REASONS = ['rounded', 'early', 'table', 'owner', 'other'] as const;
export type DiscountReason = (typeof DISCOUNT_REASONS)[number];

export interface DiscountDraft {
  amount: number;
  reason: DiscountReason;
  note: string;
}

export interface PaymentLine {
  method: string;
  amount: number;
}

/**
 * One checkout in progress, kept while the worker goes between the bill (25), the discount (27) and the part payment
 * (26). Nothing is sent to the server until a payment is saved: the discount and the payment lines are checked together
 * there (`POST /checkout/:playerId`). It lives only in memory, so reloading a page starts the bill again.
 */
interface CheckoutDraft {
  /** The player this draft is for. Another player starts a new one. */
  playerId: string | null;
  /** The last player whose bill was opened, shown with the brass border on the list (screen 24). */
  lastOpened: string | null;
  /** How the money is received when "Paid in full" is pressed (the "Paid by" choice of screen 25). */
  method: string | null;
  discount: DiscountDraft | null;
  /** The part payment: one line for each method, in the order they were added. */
  lines: PaymentLine[];
  /** The line the keypad types into. */
  typing: string | null;

  begin: (playerId: string) => void;
  setMethod: (method: string) => void;
  setDiscount: (discount: DiscountDraft | null) => void;
  /** Starts the part payment with one empty line for this method, when there are none yet. */
  startLines: (method: string) => void;
  addLine: (method: string) => void;
  removeLine: (method: string) => void;
  select: (method: string) => void;
  /** Types a digit ("0" to "9" or "00") into the selected line. */
  digit: (digit: string) => void;
  /** Takes the last digit off the selected line. */
  deleteDigit: () => void;
  reset: () => void;
}

const MAX_DIGITS = 7;

const EMPTY = {
  playerId: null,
  method: null,
  discount: null,
  lines: [] as PaymentLine[],
  typing: null,
};

export const useCheckoutDraft = create<CheckoutDraft>((set) => ({
  ...EMPTY,
  lastOpened: null,

  begin: (playerId) =>
    set((draft) =>
      draft.playerId === playerId ? draft : { ...EMPTY, playerId, lastOpened: playerId },
    ),

  setMethod: (method) => set({ method }),

  setDiscount: (discount) => set({ discount }),

  startLines: (method) =>
    set((draft) =>
      draft.lines.length > 0 ? draft : { lines: [{ method, amount: 0 }], typing: method },
    ),

  addLine: (method) =>
    set((draft) =>
      draft.lines.some((line) => line.method === method)
        ? { typing: method }
        : { lines: [...draft.lines, { method, amount: 0 }], typing: method },
    ),

  removeLine: (method) =>
    set((draft) => {
      const lines = draft.lines.filter((line) => line.method !== method);
      return {
        lines,
        typing: draft.typing === method ? (lines.at(-1)?.method ?? null) : draft.typing,
      };
    }),

  select: (method) => set({ typing: method }),

  digit: (digit) =>
    set((draft) => {
      if (!draft.typing) return draft;
      return {
        lines: draft.lines.map((line) => {
          if (line.method !== draft.typing) return line;
          const typed = `${line.amount === 0 ? '' : line.amount}${digit}`;
          // Leading zeros are never kept ("00" on an empty line stays 0), and the number stays small enough to read.
          const amount = Number(typed.replace(/^0+/, '') || '0');
          return typed.length > MAX_DIGITS ? line : { ...line, amount };
        }),
      };
    }),

  deleteDigit: () =>
    set((draft) => ({
      lines: draft.lines.map((line) =>
        line.method === draft.typing ? { ...line, amount: Math.floor(line.amount / 10) } : line,
      ),
    })),

  reset: () => set((draft) => ({ ...EMPTY, lastOpened: draft.lastOpened })),
}));
