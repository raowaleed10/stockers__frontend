import type { TableStatus } from '@stockers/shared';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { StatusPill } from './StatusPill';

// The light pill (screen 54) is the status words on a tinted fill. Axe reports under 4.5:1 as a serious issue,
// so this test reads the real tokens and checks every pair, and cannot drift from the screen.

// Read from disk: Vitest runs with `css: false`, which turns a `?raw` import of a .css file into an empty string.
const tokens = readFileSync(resolve(__dirname, '../styles/tokens.css'), 'utf8');

function token(name: string): string {
  const match = new RegExp(String.raw`--${name}:\s*(#[0-9A-Fa-f]{6})\b`).exec(tokens);
  if (!match) throw new Error(`token --${name} is not a plain #RRGGBB colour in tokens.css`);
  return match[1].toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio of two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const STATUSES: TableStatus[] = ['free', 'playing', 'overLimit', 'paused', 'outOfOrder', 'noPrice'];
const WORDS: Record<TableStatus, string> = {
  free: 'Free',
  playing: 'Playing',
  overLimit: 'Over the limit',
  paused: 'Paused',
  outOfOrder: 'Out of order',
  noPrice: 'Price not set',
};

/** `bg-o-red-tint` -> `--o-red-tint`: the preset maps each colour class to the token of the same name. */
function tokenOf(className: string, prefix: 'bg-' | 'text-'): string {
  // `text-[13px]` is the font size, not a colour
  const found = className
    .split(/\s+/)
    .find((name) => name.startsWith(prefix) && !name.includes('['));
  if (!found) throw new Error(`no ${prefix} class in "${className}"`);
  return found.slice(prefix.length);
}

describe('light StatusPill colours', () => {
  it.each(STATUSES)('%s: its text is at least 4.5:1 on its own fill', (status) => {
    render(<StatusPill status={status} tone="light" />);
    const { className } = screen.getByText(WORDS[status]);
    const fill = token(tokenOf(className, 'bg-'));
    const text = token(tokenOf(className, 'text-'));
    expect(contrast(text, fill), `${text} on ${fill}`).toBeGreaterThanOrEqual(4.5);
  });

  it('follows screen 54: red text on its tint, and the tints from the screen', () => {
    expect(token('sl-play')).toBe('#B42318'); // Playing
    expect(token('o-red-tint')).toBe('#FBE7E5');
    expect(token('o-green-tint')).toBe('#E3F0E8'); // Free
    expect(token('o-amber-tint')).toBe('#FBF1DC'); // Paused
    expect(token('o-grey-tint')).toBe('#EEF0F2'); // Out of order
  });

  it('darkens only green, yellow and grey, and keeps red as drawn', () => {
    render(
      <>
        <StatusPill status="free" tone="light" />
        <StatusPill status="playing" tone="light" />
        <StatusPill status="paused" tone="light" />
        <StatusPill status="outOfOrder" tone="light" />
      </>,
    );
    expect(screen.getByText('Playing').className).toContain('text-sl-play');
    for (const [words, plain, ink] of [
      ['Free', 'sl-free', 'sl-free-ink'],
      ['Paused', 'sl-pause', 'sl-pause-ink'],
      ['Out of order', 'sl-ooo', 'sl-ooo-ink'],
    ]) {
      expect(screen.getByText(words).className).toContain(`text-${ink}`);
      // the plain colour really was too light on this tint (that is why the ink exists)
      const fill = token(tokenOf(screen.getByText(words).className, 'bg-'));
      expect(contrast(token(plain), fill), plain).toBeLessThan(4.5);
    }
  });
});
