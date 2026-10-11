import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Keypad } from './Keypad';
import { PinDots } from './PinDots';

describe('Keypad (PIN)', () => {
  function setup() {
    const onDigit = vi.fn();
    const onClear = vi.fn();
    const onDelete = vi.fn();
    render(<Keypad onDigit={onDigit} onClear={onClear} onDelete={onDelete} />);
    return { onDigit, onClear, onDelete };
  }

  it('has the digits 0 to 9, Clear and Delete, and no "00"', () => {
    setup();
    for (const digit of '0123456789') {
      expect(screen.getByRole('button', { name: digit })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete last digit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '00' })).not.toBeInTheDocument();
  });

  it('sends each digit that is pressed', async () => {
    const { onDigit } = setup();
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: '0' }));
    expect(onDigit.mock.calls).toEqual([['4'], ['0']]);
  });

  it('clears and deletes', async () => {
    const { onClear, onDelete } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('works from the keyboard', async () => {
    const { onDigit } = setup();
    screen.getByRole('button', { name: '7' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onDigit).toHaveBeenCalledWith('7');
  });

  it('keys are 76 px tall, and the pad keeps its order in right-to-left pages', () => {
    const { container } = render(
      <Keypad onDigit={() => undefined} onClear={() => undefined} onDelete={() => undefined} />,
    );
    expect(screen.getAllByRole('button', { name: '1' })[0].className).toContain('min-h-key');
    expect(container.firstElementChild).toHaveAttribute('dir', 'ltr');
  });
});

describe('Keypad (amount)', () => {
  it('adds a "00" key and has no Clear', async () => {
    const onDigit = vi.fn();
    render(<Keypad keys="amount" onDigit={onDigit} onDelete={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '00' }));
    expect(onDigit).toHaveBeenCalledWith('00');
  });
});

describe('PinDots', () => {
  it.each([0, 1, 2, 4])('says how many digits are typed: %i of 4', (filled) => {
    render(<PinDots filled={filled} />);
    expect(screen.getByRole('img', { name: `${filled} of 4 digits entered` })).toBeInTheDocument();
  });

  it('fills that many dots and keeps four in all', () => {
    render(<PinDots filled={2} />);
    const dots = screen.getByRole('img').children;
    expect(dots).toHaveLength(4);
    expect([...dots].filter((dot) => dot.className.includes('bg-c-brass'))).toHaveLength(2);
  });

  it('never shows more than four or fewer than none', () => {
    const { rerender } = render(<PinDots filled={9} />);
    expect(screen.getByRole('img', { name: '4 of 4 digits entered' })).toBeInTheDocument();
    rerender(<PinDots filled={-3} />);
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
  });
});
