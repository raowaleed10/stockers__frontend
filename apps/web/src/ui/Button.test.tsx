import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { IconButton } from './IconButton';

describe('Button', () => {
  it('is a real button that does not submit a form by default', () => {
    render(<Button theme="counter">Cancel</Button>);
    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button theme="owner" onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled, and says so', async () => {
    const onClick = vi.fn();
    render(
      <Button theme="counter" variant="primary" disabled onClick={onClick}>
        Start game
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Start game' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.className).toContain('disabled:opacity-40');
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });

  it('has the brass look on the counter and the green look in the owner portal', () => {
    render(
      <>
        <Button theme="counter" variant="primary">
          Counter main
        </Button>
        <Button theme="owner" variant="primary">
          Owner main
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Counter main' }).className).toContain('bg-c-brass');
    expect(screen.getByRole('button', { name: 'Owner main' }).className).toContain('bg-o-green');
  });

  it('is at least 56 px on the counter and 44 px in the owner portal, by size', () => {
    render(
      <>
        <Button theme="counter">A</Button>
        <Button theme="counter" size="counter-main">
          B
        </Button>
        <Button theme="owner">C</Button>
        <Button theme="owner" size="ownerSm">
          D
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'A' }).className).toContain('min-h-touch ');
    expect(screen.getByRole('button', { name: 'B' }).className).toContain('min-h-touch-main');
    expect(screen.getByRole('button', { name: 'C' }).className).toContain('min-h-[48px]');
    expect(screen.getByRole('button', { name: 'D' }).className).toContain('min-h-touch-owner');
  });

  it('defaults the size from the theme', () => {
    render(
      <>
        <Button theme="counter">Default counter</Button>
        <Button theme="owner">Default owner</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Default counter' }).className).toContain(
      'min-h-touch',
    );
    expect(screen.getByRole('button', { name: 'Default owner' }).className).toContain(
      'min-h-[48px]',
    );
  });

  it('hides an icon from screen readers so the text names the button', () => {
    render(
      <Button theme="counter" icon={<svg data-testid="icon" />}>
        Checkout
      </Button>,
    );
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('has a visible focus ring in each theme', () => {
    render(
      <>
        <Button theme="counter">Ring counter</Button>
        <Button theme="owner">Ring owner</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Ring counter' }).className).toContain(
      'focus-visible:outline-c-text',
    );
    expect(screen.getByRole('button', { name: 'Ring owner' }).className).toContain(
      'focus-visible:outline-o-blue',
    );
  });
});

describe('IconButton', () => {
  it('uses the label as its accessible name', () => {
    render(<IconButton theme="counter" label="Close" icon={<svg />} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('adds the count to the name when there is a badge, and shows it', () => {
    render(<IconButton theme="counter" label="Notifications" icon={<svg />} badge={3} />);
    const button = screen.getByRole('button', { name: 'Notifications, 3' });
    expect(button).toHaveTextContent('3');
  });

  it('shows no badge for zero', () => {
    render(<IconButton theme="owner" label="Notifications" icon={<svg />} badge={0} />);
    expect(screen.getByRole('button', { name: 'Notifications' })).not.toHaveTextContent('0');
  });
});
