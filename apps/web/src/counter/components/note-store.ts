import { create } from 'zustand';

/**
 * A short sentence that says what a worker just did on a page that closes by itself (an expense taken from the drawer, a
 * canteen sale), shown for a few seconds in the cream toast area. Words are written in the language of the page when it is
 * said, with the amounts in them, so nothing is looked up later.
 */
interface NoteStore {
  message: string | null;
  say: (message: string) => void;
  clear: () => void;
}

export const useNote = create<NoteStore>((set) => ({
  message: null,
  say: (message) => set({ message }),
  clear: () => set({ message: null }),
}));
