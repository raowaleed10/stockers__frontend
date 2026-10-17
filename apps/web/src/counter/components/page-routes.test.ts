import { describe, expect, it } from 'vitest';
import { isPageRoute } from './page-routes';

describe('isPageRoute', () => {
  it('is true for the pages that draw their own header', () => {
    for (const path of [
      '/checkout',
      '/checkout/bilal/part',
      '/canteen',
      '/players',
      '/players/kamran',
      '/today',
      '/close-sheet',
      '/sheet-closed',
    ]) {
      expect(isPageRoute(path), path).toBe(true);
    }
  });

  it('is false for the board and the dialogs over it, including "Add a new player" and the expense', () => {
    for (const path of [
      '/',
      '/board/pool',
      '/table/t1',
      '/expense',
      '/board/pool/expense',
      '/players/new',
      '/alerts',
    ]) {
      expect(isPageRoute(path), path).toBe(false);
    }
  });

  it('a player whose id starts with "new" still has a page', () => {
    expect(isPageRoute('/players/newton')).toBe(true);
    expect(isPageRoute('/players/new-player-2')).toBe(true);
  });
});
