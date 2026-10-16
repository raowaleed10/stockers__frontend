/**
 * Counter pages that draw their own header (a back button, the title, the clock) in place of the top bar and the action
 * bar: the checkout screens of the designs (24 to 27). The frame still holds the lock, the sign-in time banner and the Undo
 * toast around them. Later steps add the other pages of the action bar (Canteen, Players, Today's totals, Close sheet).
 */
const PAGE_ROUTES = /^\/checkout(\/|$)/;

export const isPageRoute = (pathname: string): boolean => PAGE_ROUTES.test(pathname);
