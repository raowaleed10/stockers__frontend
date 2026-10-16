/**
 * Where the screens of one table open. Like the bell's panel (D57), they are child routes of the board, so they open
 * over the tab you are on and closing returns to it: from `/` the address is `/table/t2/start`, from Pool it is
 * `/board/pool/table/po1/start`. Any other address (a screen that is not a board) opens them over the first tab.
 */
const BOARD_TAB = /^\/board\/[^/]+/;

const prefixOf = (pathname: string) => BOARD_TAB.exec(pathname)?.[0] ?? '';

/** `/table/t2` and what follows it, for example `tablePath(here, 't2', '/start/players')`. */
export function tablePath(pathname: string, tableId: string, rest = ''): string {
  return `${prefixOf(pathname)}/table/${tableId}${rest}`;
}

/** A room is started on its own screen (P08). */
export function roomPath(pathname: string, tableId: string, rest = ''): string {
  return `${prefixOf(pathname)}/room/${tableId}${rest}`;
}

/** The address of "Add a new player" for the flow of a table: `/players/new?for=t2`. */
export function newPlayerPath(pathname: string, tableId: string): string {
  return `${prefixOf(pathname)}/players/new?for=${encodeURIComponent(tableId)}`;
}

/** The board a table screen is open over: the first tab, or the tab in the address. */
export function boardOfTableScreen(pathname: string): string {
  return BOARD_TAB.exec(pathname)?.[0] ?? '/';
}
