import { create } from 'zustand';

/** A player picked for a game: what the slot shows, so it still shows after a trip to "Add a new player". */
export interface PickedPlayer {
  id: string;
  name: string;
  /** The masked number (`0333 •••• 2209`), if he has one. */
  phone?: string;
  phoneTail?: string;
}

export type StartKind = 'single' | 'double' | 'century';
export type SideIndex = 0 | 1;

/** How many players a slot list takes: two for a frame or a game, one for a Century (D11). */
export const slotCount = (kind: StartKind) => (kind === 'century' ? 1 : 2);

interface StartDraft {
  /** The table this draft is for. A different table starts a new draft. */
  tableId: string | null;
  kind: StartKind;
  /** The Century rate the worker chose; `null` is the owners' price. */
  rate: number | null;
  /** A single frame, a game or a Century: the players in order. */
  players: PickedPlayer[];
  /** A double: side A and side B, up to two players each. */
  sides: [PickedPlayer[], PickedPlayer[]];
  /** The side the next pick goes to. */
  side: SideIndex;
  /** Where "Add a new player" goes back to when it is done. */
  returnTo: string | null;

  /** Opens the flow for a table: keeps the draft when it is the same table, starts a clean one otherwise. */
  begin: (tableId: string) => void;
  /** Fills the whole draft at once: a running game that is changing type starts from its own players. */
  load: (draft: Pick<StartDraft, 'tableId' | 'kind' | 'rate' | 'players' | 'sides'>) => void;
  setKind: (kind: StartKind) => void;
  setRate: (rate: number | null) => void;
  /** Puts a player in the next free slot (or the active side of a double). Nothing if he is already picked. */
  pick: (player: PickedPlayer) => void;
  remove: (id: string) => void;
  setSide: (side: SideIndex) => void;
  setReturnTo: (path: string | null) => void;
  reset: () => void;
}

const EMPTY = {
  tableId: null,
  kind: 'single' as StartKind,
  rate: null,
  players: [] as PickedPlayer[],
  sides: [[], []] as [PickedPlayer[], PickedPlayer[]],
  side: 0 as SideIndex,
  returnTo: null,
};

/** Everyone in the draft, in any list. */
export const pickedIds = (draft: Pick<StartDraft, 'players' | 'sides'>): string[] => [
  ...draft.players.map((p) => p.id),
  ...draft.sides.flat().map((p) => p.id),
];

/** The draft of the game being started. It lives only in memory: reloading the page starts again. */
export const useStartDraft = create<StartDraft>((set) => ({
  ...EMPTY,

  begin: (tableId) => set((draft) => (draft.tableId === tableId ? draft : { ...EMPTY, tableId })),

  load: (draft) => set({ ...EMPTY, ...draft }),

  setKind: (kind) => set({ kind }),

  setRate: (rate) => set({ rate }),

  pick: (player) =>
    set((draft) => {
      if (pickedIds(draft).includes(player.id)) return draft;
      if (draft.kind === 'double') {
        const sides: [PickedPlayer[], PickedPlayer[]] = [[...draft.sides[0]], [...draft.sides[1]]];
        // The active side first; when it is full, the other one.
        const target = sides[draft.side].length < 2 ? draft.side : draft.side === 0 ? 1 : 0;
        if (sides[target].length >= 2) return draft;
        sides[target].push(player);
        // A side that is now full hands over to the other one, so the next tap goes where there is room.
        const other: SideIndex = target === 0 ? 1 : 0;
        const next: SideIndex =
          sides[target].length >= 2 && sides[other].length < 2 ? other : target;
        return { sides, side: next };
      }
      if (draft.players.length >= slotCount(draft.kind)) return draft;
      return { players: [...draft.players, player] };
    }),

  remove: (id) =>
    set((draft) => ({
      players: draft.players.filter((p) => p.id !== id),
      sides: [draft.sides[0].filter((p) => p.id !== id), draft.sides[1].filter((p) => p.id !== id)],
    })),

  setSide: (side) => set({ side }),

  setReturnTo: (returnTo) => set({ returnTo }),

  reset: () => set({ ...EMPTY }),
}));
