import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';

function Controlled({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Toggle checked={on} onChange={setOn} label="Easypaisa" />;
}

describe('Toggle', () => {
  it('is a switch named by its label', () => {
    render(<Toggle checked={false} onChange={() => undefined} label="Bank transfer" />);
    expect(screen.getByRole('switch', { name: 'Bank transfer' })).toBeInTheDocument();
  });

  it('says whether it is on or off', () => {
    const { rerender } = render(<Toggle checked={false} onChange={() => undefined} label="A" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<Toggle checked onChange={() => undefined} label="A" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('asks for the opposite value when pressed', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle checked={false} onChange={onChange} label="A" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(<Toggle checked onChange={onChange} label="A" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('turns on and off from the keyboard with Space and Enter', async () => {
    render(<Controlled />);
    const toggle = screen.getByRole('switch', { name: 'Easypaisa' });
    await userEvent.tab();
    expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('does nothing when disabled', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="A" disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('can be named with ariaLabel when there is no visible label', () => {
    render(<Toggle checked={false} onChange={() => undefined} ariaLabel="Alerts" />);
    expect(screen.getByRole('switch', { name: 'Alerts' })).toBeInTheDocument();
  });

  it('is a green 54 by 32 switch in a row at least 56 px tall, and moves the thumb with the language direction', () => {
    render(<Toggle checked onChange={() => undefined} label="A" />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('min-h-[56px]');
    const track = toggle.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(track.className).toContain('bg-o-green');
    expect(track.className).toContain('h-8');
    expect(track.className).toContain('w-[54px]');
    const thumb = track.firstElementChild as HTMLElement;
    expect(thumb.className).toContain('translate-x-[22px]');
    expect(thumb.className).toContain('rtl:-translate-x-[22px]');
    expect(thumb.className).toContain('start-[3px]');
  });

  it('is brass on the counter', () => {
    render(<Toggle theme="counter" checked onChange={() => undefined} label="A" />);
    const track = screen.getByRole('switch').querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(track.className).toContain('bg-c-brass');
  });
});
