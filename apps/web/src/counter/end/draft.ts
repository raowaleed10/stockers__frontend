import { create } from 'zustand';

/**
 * Who lost, carried from "Who lost this frame?" (17) or "Which side lost?" (20) to "Over 30 minutes: charge double?"
 * (19), which asks before anything is charged. It lives only in memory: reloading the question starts again at the
 * screen that asks who lost.
 */
interface EndDraft {
  /** The game this is for. Another game starts a new draft. */
  gameId: string | null;
  loserIds: string[];
  /** A double frame with a custom split: what each loser pays now. `null` is half each, or one player paying all. */
  split: Record<string, number> | null;
  set: (draft: {
    gameId: string;
    loserIds: string[];
    split?: Record<string, number> | null;
  }) => void;
  reset: () => void;
}

export const useEndDraft = create<EndDraft>((set) => ({
  gameId: null,
  loserIds: [],
  split: null,
  set: ({ gameId, loserIds, split }) => set({ gameId, loserIds, split: split ?? null }),
  reset: () => set({ gameId: null, loserIds: [], split: null }),
}));
