import { DAY_MS, toMs, type Moment } from './club-time';

// What the owner pages (dashboard, reports, Activity) work out from the numbers they are given. The screens never do this
// arithmetic themselves (CLAUDE.md, golden rule 6), so the backend and the app say the same thing.

/**
 * How much more or less than the period compared with, as a percentage to one decimal: 773,000 against 735,200 is 5.1.
 * Nothing to compare with (a zero or a missing number) gives `null`, so a screen writes no figure rather than "Infinity".
 */
export function percentChange(now: number, before: number): number | null {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return Math.round(((now - before) / Math.abs(before)) * 1000) / 10;
}

/** `+5.1%`, `−2.6%` (the minus sign of the money columns), `0%`, and `–` when there is nothing to compare with. */
export function formatChange(change: number | null): string {
  if (change === null) return '–';
  if (change === 0) return '0%';
  const digits = Number.isInteger(change) ? String(Math.abs(change)) : Math.abs(change).toFixed(1);
  return `${change > 0 ? '+' : '−'}${digits}%`;
}

/** A part of a total as a whole number of percent: 51,400 of 86,000 is 60. A total of 0 gives 0. */
export function share(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** A bar as a whole number of percent of the longest one: 101,200 against 106,800 is 95. */
export function barWidth(value: number, max: number): number {
  return Math.min(100, share(value, max));
}

/**
 * Money written short for an axis or above a bar: 36,000 is `36k`, 35,600 is `35.6k`, 641,000 is `641k`. From 100,000 up
 * it is whole thousands (`735k` for 735,200); under it one decimal, and a trailing `.0` is dropped.
 */
export function compactMoney(value: number): string {
  const sign = value < 0 ? '−' : '';
  const thousands = Math.abs(value) / 1000;
  if (thousands < 1) return `${sign}${Math.round(Math.abs(value))}`;
  if (Math.round(thousands) >= 1000) return `${sign}${Math.round(thousands / 100) / 10}m`;
  const text =
    thousands >= 100 ? String(Math.round(thousands)) : String(Math.round(thousands * 10) / 10);
  return `${sign}${text}k`;
}

/** Whole days from `since` to `now` (`dayAge(now, since)`): the age of a debt, "18 days". Never negative. */
export function dayAge(now: Moment, since: Moment): number {
  return Math.max(0, Math.floor((toMs(now) - toMs(since)) / DAY_MS));
}

/** The steps a bar chart's axis may use, written as a multiple of a power of ten. */
const STEPS = [1, 1.2, 1.5, 2, 2.4, 3, 4, 5, 6, 8, 10];

export interface Axis {
  /** The top of the axis: the highest value always fits under it. */
  max: number;
  /** From 0 to `max`, in equal steps. */
  ticks: number[];
}

/**
 * A round top and equal steps for a chart: the highest day of 35,600 gives 0, 12k, 24k and 36k; a running total of 773,000
 * in four steps gives 0 to 800k in steps of 200k. `steps` is how many intervals the axis has.
 */
export function niceAxis(max: number, steps: number): Axis {
  if (!Number.isFinite(max) || max <= 0 || steps < 1) {
    return { max: steps, ticks: Array.from({ length: steps + 1 }, (_, i) => i) };
  }
  const raw = max / steps;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (STEPS.find((candidate) => candidate * magnitude >= raw) ?? 10) * magnitude;
  return { max: step * steps, ticks: Array.from({ length: steps + 1 }, (_, i) => step * i) };
}
