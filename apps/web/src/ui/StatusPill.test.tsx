import type { TableStatus } from '@stockers/shared';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/lib/i18n';
import { StatusPill } from './StatusPill';

const WORDS: Record<TableStatus, string> = {
  free: 'Free',
  playing: 'Playing',
  overLimit: 'Over the limit',
  paused: 'Paused',
  outOfOrder: 'Out of order',
  noPrice: 'Price not set',
};

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('StatusPill', () => {
  it.each(Object.entries(WORDS))('shows words for %s, never colour alone', (status, words) => {
    render(<StatusPill status={status as TableStatus} />);
    expect(screen.getByText(words)).toBeInTheDocument();
  });

  it('uses the words in Urdu from the approved word list', async () => {
    await i18n.changeLanguage('ur');
    render(
      <>
        <StatusPill status="free" />
        <StatusPill status="playing" />
        <StatusPill status="overLimit" limit={30} />
        <StatusPill status="paused" />
        <StatusPill status="outOfOrder" />
      </>,
    );
    for (const words of ['خالی', 'کھیل جاری', '30 منٹ سے زیادہ', 'رکا ہوا', 'خراب']) {
      expect(screen.getByText(words)).toBeInTheDocument();
    }
  });

  it('says the limit of the game it is for: "Over 20 min", in Urdu "20 منٹ سے زیادہ" (D56)', async () => {
    const { rerender } = render(<StatusPill status="overLimit" limit={20} />);
    expect(screen.getByText('Over 20 min')).toBeInTheDocument();
    rerender(<StatusPill status="overLimit" limit={45} />);
    expect(screen.getByText('Over 45 min')).toBeInTheDocument();
    await i18n.changeLanguage('ur');
    rerender(<StatusPill status="overLimit" limit={20} />);
    expect(screen.getByText('20 منٹ سے زیادہ')).toBeInTheDocument();
  });

  it('says "Over the limit" when it is not told the limit', () => {
    render(<StatusPill status="overLimit" />);
    expect(screen.getByText('Over the limit')).toBeInTheDocument();
  });

  it('can be given its own words', () => {
    render(<StatusPill status="paused" label="Power cut" />);
    expect(screen.getByText('Power cut')).toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('marks over the limit with a red card and the other states with a round dot', () => {
    const { container, rerender } = render(<StatusPill status="overLimit" />);
    expect(container.querySelector('.-rotate-12')).toBeInTheDocument();
    rerender(<StatusPill status="playing" />);
    expect(container.querySelector('.-rotate-12')).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full.bg-s-play')).toBeInTheDocument();
  });

  it('has a dark pill with a marker on the counter and a tinted pill with no border on a light page', () => {
    const { container, rerender } = render(<StatusPill status="free" />);
    expect(screen.getByText('Free').className).toContain('bg-s-pill-bg');
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    rerender(<StatusPill status="free" tone="light" />);
    const light = screen.getByText('Free');
    expect(light.className).toContain('bg-o-green-tint');
    expect(light.className).toContain('text-sl-free-ink'); // darker than --sl-free: contrast on its own tint
    expect(light.className).not.toContain('border');
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument(); // screen 54 has no dot
  });

  it('hides the marker from screen readers', () => {
    const { container } = render(<StatusPill status="outOfOrder" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
