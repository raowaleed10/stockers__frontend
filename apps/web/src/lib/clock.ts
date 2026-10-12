import { useEffect, useState } from 'react';
import type { AppId } from './app-id';

/** The moment of the approved designs (docs/10). The demo clock starts here and ticks. */
const DEMO_START: Record<AppId, string> = {
  counter: '2026-10-03T21:42:00+05:00',
  owner: '2026-10-03T22:30:00+05:00',
};

let offsetMs = 0;

/**
 * `?now=2026-10-03T21:42:00+05:00`. In a URL a bare "+" arrives as a space, so put it back.
 * Returns epoch milliseconds, or null when the value is missing or not a date.
 */
export function parseNowParam(raw: string | null): number | null {
  if (!raw) return null;
  const fixed = raw.trim().replace(/ (\d{2}:?\d{2})$/, '+$1');
  const time = Date.parse(fixed);
  return Number.isNaN(time) ? null : time;
}

export interface ClockOptions {
  app: AppId;
  /** Defaults to the page query string. */
  search?: string;
  /** Defaults to VITE_DEMO_CLOCK !== "off". */
  demo?: boolean;
}

export const clock = {
  /** Sets where the clock starts. Call once, before the first render. */
  init({
    app,
    search = typeof window === 'undefined' ? '' : window.location.search,
    demo = import.meta.env.VITE_DEMO_CLOCK !== 'off',
  }: ClockOptions): void {
    const fromUrl = parseNowParam(new URLSearchParams(search).get('now'));
    const start = fromUrl ?? (demo ? Date.parse(DEMO_START[app]) : null);
    offsetMs = start === null ? 0 : start - Date.now();
  },

  /** Moves the clock so that it reads `startMs` now and ticks on from there (a scenario's moment). */
  setStart(startMs: number): void {
    offsetMs = startMs - Date.now();
  },

  /** Current time in epoch milliseconds. Components use this, never `Date.now()`. */
  now(): number {
    return Date.now() + offsetMs;
  },

  /** Back to the real time (tests). */
  reset(): void {
    offsetMs = 0;
  },
};

/** The current time, refreshed every `intervalMs`. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const id = setInterval(() => setNow(clock.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
