/** After this long without a touch the screen locks (D44, open question 10: 5 minutes). */
export const IDLE_LOCK_MS = 5 * 60_000;

/**
 * How long the screen may sit untouched. Tests shorten it with `?lockAfter=<seconds>`; that switch exists only
 * in development, so a production build has no way to change the 5 minutes.
 */
export function idleLockMs(search = window.location.search): number {
  if (import.meta.env.DEV) {
    const seconds = Number(new URLSearchParams(search).get('lockAfter'));
    if (seconds > 0) return seconds * 1000;
  }
  return IDLE_LOCK_MS;
}
