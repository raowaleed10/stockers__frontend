/**
 * Where the bell's panel opens and where closing it goes. The panel is a child route of the board, so it opens over the
 * tab you are on: `/` gives `/alerts`, `/board/pool` gives `/board/pool/alerts`. Closing goes back to the same board.
 * Any other screen has no board of its own, so the panel opens over the first tab.
 */
const BOARD_TAB = /^\/board\/[^/]+/;

/** The address of the panel opened from this address. */
export function alertsPath(pathname: string): string {
  const tab = BOARD_TAB.exec(pathname)?.[0];
  return tab ? `${tab}/alerts` : '/alerts';
}

/** The board the panel is open over: the address without its last part, `/` for the first tab. */
export function boardPathOf(pathname: string): string {
  const tab = BOARD_TAB.exec(pathname)?.[0];
  return tab ?? '/';
}
