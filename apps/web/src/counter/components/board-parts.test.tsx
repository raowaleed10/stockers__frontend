import type { BoardTab, WaitingBill } from '@stockers/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLanguage } from '../test/harness';
import { canteenWords } from './bill-words';
import { CategoryTabs } from './CategoryTabs';
import { WaitingPanel } from './WaitingPanel';

afterEach(() => setLanguage('en'));

const bill = (extra: Partial<WaitingBill> = {}): WaitingBill => ({
  playerId: 'bilal',
  name: 'Bilal Ahmed',
  phoneTail: '•••• 4512',
  parts: [{ kind: 'frame', count: 2 }],
  tonight: 600,
  oldCredit: 0,
  advance: 0,
  total: 600,
  ...extra,
});

describe('canteenWords', () => {
  it('writes an item in lower case with an s for more than one: 2 teas', () => {
    expect(canteenWords('Tea', 2, 'en')).toBe('2 teas');
    expect(canteenWords('Tea', 1, 'en')).toBe('1 tea');
    expect(canteenWords('Cold drink', 3, 'en')).toBe('3 cold drinks');
  });

  it('adds nothing to a name that already ends in s, or that has a comma', () => {
    expect(canteenWords('Chips', 3, 'en')).toBe('3 chips');
    expect(canteenWords('Water, small', 2, 'en')).toBe('2 water, small');
  });

  it('keeps the stored name in Urdu, exactly as it was typed', () => {
    expect(canteenWords('Tea', 2, 'ur')).toBe('2 Tea');
    expect(canteenWords('چائے', 2, 'ur')).toBe('2 چائے');
  });
});

describe('WaitingPanel', () => {
  it('says nobody is waiting, with no total, when the list is empty', () => {
    render(<WaitingPanel bills={[]} onOpen={() => {}} />);
    const panel = screen.getByRole('complementary', { name: 'Waiting to pay' });
    expect(panel).toHaveTextContent('0 players');
    expect(panel).toHaveTextContent('Nobody is waiting to pay');
    expect(panel).not.toHaveTextContent('Not paid yet today');
    expect(within(panel).queryByRole('button')).toBeNull();
  });

  it('says "1 player" for one, and starts a line with a capital when there is no phone number', () => {
    render(
      <WaitingPanel
        bills={[
          bill({
            phoneTail: undefined,
            parts: [{ kind: 'double', count: 1 }],
            tonight: 250,
          }),
        ]}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('1 player')).toBeInTheDocument();
    expect(screen.getByText('Half of a double')).toBeInTheDocument();
    // The row and the total both say Rs 250 when one player is waiting.
    expect(screen.getAllByText('Rs 250')).toHaveLength(2);
  });

  it('adds the total of tonight’s bills, not the old credit', () => {
    render(
      <WaitingPanel
        bills={[
          bill({ tonight: 600, oldCredit: 500, total: 1100 }),
          bill({ playerId: 'zubair', name: 'Zubair Khan', tonight: 200, total: 200 }),
        ]}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('Rs 800')).toBeInTheDocument();
  });

  it('gives the player’s id to onOpen when a row is pressed', async () => {
    const onOpen = vi.fn();
    render(<WaitingPanel bills={[bill()]} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /Bilal Ahmed/ }));
    expect(onOpen).toHaveBeenCalledWith('bilal');
  });

  it('makes each row at least 64 px tall', () => {
    render(<WaitingPanel bills={[bill()]} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /Bilal Ahmed/ }).className).toContain('min-h-[64px]');
  });

  it('writes a canteen item with its stored name, in a piece of its own', () => {
    render(
      <WaitingPanel
        bills={[
          bill({
            parts: [
              { kind: 'frame', count: 2 },
              { kind: 'canteen', count: 2, item: 'Tea' },
              { kind: 'canteen', count: 1 },
            ],
          }),
        ]}
        onOpen={() => {}}
      />,
    );
    const row = screen.getByRole('button', { name: /Bilal Ahmed/ });
    expect(row).toHaveTextContent('•••• 4512, 2 frames lost, 2 teas, 1 canteen item');
    expect(within(row).getByText('2 teas').tagName).toBe('BDI');
  });
});

describe('CategoryTabs', () => {
  const tabs: BoardTab[] = [
    { id: 'snooker', name: 'Snooker and rooms', inUse: 6, total: 9 },
    { id: 'pool', name: 'Pool', inUse: 0, total: 4 },
    { id: 'tennis', name: 'Table tennis', inUse: 1, total: 2 },
  ];

  it('marks the selected tab and gives its id to onSelect when another is pressed', async () => {
    const onSelect = vi.fn();
    render(<CategoryTabs tabs={tabs} selectedId="pool" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Pool0 of 4' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /Snooker and rooms/ }));
    expect(onSelect).toHaveBeenCalledWith('snooker');
  });

  it('selects none on the games preview', () => {
    render(<CategoryTabs tabs={tabs} selectedId={null} onSelect={() => {}} />);
    for (const tab of screen.getAllByRole('button')) {
      expect(tab).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('shows the name of a game type it has no words for, with its count', () => {
    render(<CategoryTabs tabs={tabs} selectedId="snooker" onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Table tennis1 of 2' })).toBeInTheDocument();
  });

  it('makes every tab at least 56 px tall', () => {
    render(<CategoryTabs tabs={tabs} selectedId="snooker" onSelect={() => {}} />);
    for (const tab of screen.getAllByRole('button')) expect(tab.className).toContain('min-h-touch');
  });

  it('shows a count on the selected tab only in Urdu', () => {
    setLanguage('ur');
    render(<CategoryTabs tabs={tabs} selectedId="snooker" onSelect={() => {}} />);
    const names = screen.getAllByRole('button').map((tab) => tab.textContent);
    expect(names).toEqual(['اسنوکر اور رومز9 میں سے 6 مصروف', 'پول', 'Table tennis']);
  });
});
