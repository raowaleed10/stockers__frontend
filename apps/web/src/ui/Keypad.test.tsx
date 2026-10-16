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

describe('Keypad (phone, screen 10)', () => {
  it('has the digits 0 to 9 and Delete, an empty corner, and no "00" and no Clear', async () => {
    const onDigit = vi.fn();
    const onDelete = vi.fn();
    render(<Keypad keys="phone" onDigit={onDigit} onDelete={onDelete} />);
    for (const digit of '0123456789') {
      expect(screen.getByRole('button', { name: digit })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(11);
    expect(screen.queryByRole('button', { name: '00' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '7' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(onDigit.mock.calls).toEqual([['7']]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('draws 72 px keys like the amount pad, 1-2-3 from the left', () => {
    render(<Keypad keys="phone" onDigit={() => {}} onDelete={() => {}} />);
    const one = screen.getByRole('button', { name: '1' });
    expect(one.className).toContain('min-h-[72px]');
    expect(one.parentElement).toHaveAttribute('dir', 'ltr');
  });
});

describe('Keypad (lock screen)', () => {
  it('has Switch worker where Clear is, and no Clear or "00"', async () => {
    const onSwitch = vi.fn();
    render(
      <Keypad
        keys="lock"
        onDigit={() => undefined}
        onDelete={() => undefined}
        onSwitch={onSwitch}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '00' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Switch worker' }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('sends digits, deletes, and has 80 px keys on the panel colour (screen 34, not the 76 of screen 1)', async () => {
    const onDigit = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <Keypad keys="lock" onDigit={onDigit} onDelete={onDelete} onSwitch={() => undefined} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete last digit' }));
    expect(onDigit).toHaveBeenCalledWith('5');
    expect(onDelete).toHaveBeenCalledTimes(1);
    const key = screen.getByRole('button', { name: '1' });
    expect(key.className).toContain('min-h-key-lock');
    expect(key.className).toContain('bg-c-panel');
    expect(container.firstElementChild).toHaveAttribute('dir', 'ltr');
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

  it('shakes only when asked to', () => {
    const { rerender } = render(<PinDots filled={0} />);
    expect(screen.getByRole('img').className).not.toContain('pin-shake');
    rerender(<PinDots filled={0} shake />);
    expect(screen.getByRole('img').className).toContain('pin-shake');
  });

  it('never shows more than four or fewer than none', () => {
    const { rerender } = render(<PinDots filled={9} />);
    expect(screen.getByRole('img', { name: '4 of 4 digits entered' })).toBeInTheDocument();
    rerender(<PinDots filled={-3} />);
    expect(screen.getByRole('img', { name: '0 of 4 digits entered' })).toBeInTheDocument();
  });
});
