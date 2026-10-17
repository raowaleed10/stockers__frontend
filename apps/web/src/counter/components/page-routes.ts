/**
 * Counter pages that draw their own header (a back button, the title, the clock) in place of the top bar and the action
 * bar: the checkout screens of the designs (24 to 27), the canteen (28), the players (30), today's totals (31), closing the
 * sheet (32) and "Sheet 48 is closed" (33). The frame still holds the lock, the sign-in time banner and the Undo toast around
 * them. The expense (29) is a dialog over the board, so it is not here.
 */
// `/players/new` is "Add a new player" (screen 10), a dialog over the board, not the players page.
const PAGE_ROUTES =
  /^\/(checkout|canteen|today|close-sheet|sheet-closed|players(?!\/new(?![\w-])))(\/|$)/;

export const isPageRoute = (pathname: string): boolean => PAGE_ROUTES.test(pathname);
