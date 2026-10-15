import { create } from 'zustand';

/**
 * Is the screen locked (screen 34)? The flag is kept in `sessionStorage`, so reloading the page cannot be a
 * way around the lock; a closed tab starts fresh. Storage can be blocked, so every access is guarded.
 */
const KEY = 'stockers.counter.locked';

function read(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function write(locked: boolean): void {
  try {
    if (locked) window.sessionStorage.setItem(KEY, '1');
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore: the lock still works until the page is reloaded
  }
}

interface LockState {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
}

export const useLockStore = create<LockState>((set) => ({
  locked: false,
  lock: () => {
    write(true);
    set({ locked: true });
  },
  unlock: () => {
    write(false);
    set({ locked: false });
  },
}));

/**
 * Sets the starting state. Call once before the first render: `?locked=1` opens the page locked (the route of
 * screen 34); otherwise the page is locked only if it was locked before a reload.
 */
export function initLock(search = window.location.search): void {
  const fromUrl = new URLSearchParams(search).get('locked') === '1';
  if (fromUrl) write(true);
  useLockStore.setState({ locked: fromUrl || read() });
}
