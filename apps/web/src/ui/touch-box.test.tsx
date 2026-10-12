import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Chip } from './Chip';
import { IconButton } from './IconButton';
import { LanguageSwitch, type SwitchLang } from './LanguageSwitch';
import { Segmented } from './Segmented';
import {
  DRAWN_HEIGHT,
  DRAWN_MARGIN,
  DRAWN_MARGIN_Y,
  DRAWN_WIDTH,
  type DrawnSize,
} from './touch-box';

const SIZES: DrawnSize[] = [44, 48, 50, 52, 54];

describe('touch box classes', () => {
  it.each(SIZES)('%s px: the negative margin is exactly (56 - drawn) / 2', (drawn) => {
    const gap = (56 - drawn) / 2;
    expect(DRAWN_MARGIN_Y[drawn]).toBe(`-my-[${gap}px]`);
    expect(DRAWN_MARGIN[drawn]).toBe(`-m-[${gap}px]`);
    expect(DRAWN_HEIGHT[drawn]).toBe(`h-[${drawn}px]`);
    expect(DRAWN_WIDTH[drawn]).toBe(`w-[${drawn}px]`);
  });
});

/** The button is the 56 px box with no look of its own; the shape inside carries the look and the ring. */
function expectBoxAndShape(
  button: HTMLElement,
  drawn: DrawnSize,
  margin: string = DRAWN_MARGIN_Y[drawn],
) {
  expect(button).toHaveAttribute('data-drawn', String(drawn));
  expect(button.className).toContain('min-h-touch');
  expect(button.className).toContain(margin);
  expect(button.className).toContain('bg-transparent');
  expect(button.className).not.toMatch(/(^|\s)border/);
  const shape = button.querySelector('[data-visible]');
  expect(shape).not.toBeNull();
  expect(shape?.className).toContain(DRAWN_HEIGHT[drawn]);
  expect(shape?.className).toContain('group-focus-visible:outline');
  return shape as HTMLElement;
}

describe('Button drawn', () => {
  it('keeps a 56 px box and draws the shape at the PNG height', () => {
    render(
      <Button theme="counter" drawn={52}>
        Lock
      </Button>,
    );
    const shape = expectBoxAndShape(screen.getByRole('button', { name: 'Lock' }), 52);
    expect(shape.className).toContain('border');
  });

  it('uses the pressed colour of its variant on the shape', () => {
    render(
      <Button theme="counter" variant="primary" drawn={48}>
        Pay
      </Button>,
    );
    const shape = screen.getByRole('button', { name: 'Pay' }).querySelector('[data-visible]');
    expect(shape?.className).toContain('group-active:bg-c-brass-press');
    expect(shape?.className).not.toContain(' active:');
  });

  it('is unchanged without `drawn`, and `drawn` does nothing in the owner look', () => {
    render(
      <>
        <Button theme="counter">Plain</Button>
        <Button theme="owner" drawn={52}>
          Owner
        </Button>
      </>,
    );
    for (const name of ['Plain', 'Owner']) {
      const button = screen.getByRole('button', { name });
      expect(button).not.toHaveAttribute('data-drawn');
      expect(button.querySelector('[data-visible]')).toBeNull();
    }
    expect(screen.getByRole('button', { name: 'Plain' }).className).toContain('min-h-touch ');
  });

  it('passes a press on the shape up to onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button theme="counter" drawn={50} onClick={onClick}>
        Resume
      </Button>,
    );
    await userEvent.click(screen.getByText('Resume'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('IconButton drawn', () => {
  it('is a 56 px square box around a drawn square, with the badge on the shape', () => {
    render(
      <IconButton theme="counter" label="Notifications" icon={<Bell />} badge={3} drawn={52} />,
    );
    const button = screen.getByRole('button', { name: 'Notifications, 3' });
    const shape = expectBoxAndShape(button, 52, DRAWN_MARGIN[52]);
    expect(button.className).toContain('h-touch');
    expect(button.className).toContain('w-touch');
    expect(shape.className).toContain(DRAWN_WIDTH[52]);
    expect(shape.className).toContain('relative'); // the badge is placed against the drawn shape
    expect(shape).toHaveTextContent('3');
  });
});

describe('Chip drawn', () => {
  it('shows the selected border on the shape and still announces the state', () => {
    const { rerender } = render(
      <Chip theme="counter" drawn={48}>
        Owe money
      </Chip>,
    );
    let button = screen.getByRole('button', { name: 'Owe money' });
    let shape = expectBoxAndShape(button, 48);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(shape.className).not.toContain('border-c-brass');
    rerender(
      <Chip theme="counter" drawn={48} selected>
        Owe money
      </Chip>,
    );
    button = screen.getByRole('button', { name: 'Owe money' });
    shape = button.querySelector('[data-visible]') as HTMLElement;
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(shape.className).toContain('border-c-brass');
  });
});

describe('Segmented and LanguageSwitch drawn', () => {
  function Switch({ theme }: { theme: 'counter' | 'owner' }) {
    const [lang, setLang] = useState<SwitchLang>('en');
    return <LanguageSwitch theme={theme} value={lang} onChange={setLang} />;
  }

  it('draws the counter language switch at 44 px inside 56 px boxes', () => {
    render(<Switch theme="counter" />);
    for (const radio of screen.getAllByRole('radio')) expectBoxAndShape(radio, 44);
  });

  it('keeps the owner language switch as it was', () => {
    render(<Switch theme="owner" />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toHaveAttribute('data-drawn');
    }
  });

  it('still moves with the arrow keys', async () => {
    render(<Switch theme="counter" />);
    screen.getByRole('radio', { name: 'English' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'اردو' })).toHaveAttribute('aria-checked', 'true');
  });

  it('takes 52 and 54 for the tabs of screens 20, 24 and 30', () => {
    render(
      <Segmented
        theme="counter"
        label="Split"
        size="lg"
        drawn={54}
        value="a"
        onChange={() => undefined}
        options={[
          { value: 'a', label: 'Half each' },
          { value: 'b', label: 'One pays all' },
        ]}
      />,
    );
    for (const radio of screen.getAllByRole('radio')) expectBoxAndShape(radio, 54);
  });
});
