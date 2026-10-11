import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CounterDialog } from './CounterDialog';
import { OwnerAside } from './OwnerAside';
import { SidePanel } from './SidePanel';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open ? (
        <CounterDialog
          title="Table 2 is free"
          onClose={() => setOpen(false)}
          actions={
            <>
              <button>Cancel</button>
              <button>Next</button>
            </>
          }
        >
          <p>What are they playing?</p>
        </CounterDialog>
      ) : null}
    </>
  );
}

describe('CounterDialog', () => {
  it('is a modal dialog named by its title', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Table 2 is free' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus inside when it opens', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const close = screen.getByRole('button', { name: 'Close' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const next = screen.getByRole('button', { name: 'Next' });

    await userEvent.tab();
    expect(cancel).toHaveFocus();
    await userEvent.tab();
    expect(next).toHaveFocus();
    await userEvent.tab(); // past the last control: back to the first
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true }); // before the first: to the last
    expect(next).toHaveFocus();
  });

  it('closes on Escape and gives focus back to what opened it', async () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes with the × button', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no × when the actions already hold Back or Cancel', () => {
    render(<CounterDialog title="Charge double?" showClose={false} onClose={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('has a red border and ball in the warning tone, and a plain border otherwise', () => {
    const { rerender } = render(
      <CounterDialog title="A" tone="warning" icon={<svg />} onClose={() => undefined} />,
    );
    expect(screen.getByRole('dialog').className).toContain('border-c-danger-line');
    rerender(<CounterDialog title="A" onClose={() => undefined} />);
    expect(screen.getByRole('dialog').className).toContain('border-c-line-2');
  });

  it('is drawn in place, with no focus trap, when static', async () => {
    const onClose = vi.fn();
    render(
      <>
        <button>Before</button>
        <CounterDialog static title="Shown in the kit" onClose={onClose} />
      </>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
  });
});

describe('SidePanel', () => {
  it('is a dialog named by its title that closes on Escape and with its button', async () => {
    const onClose = vi.fn();
    render(<SidePanel title="Table 1, single frame" onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Table 1, single frame' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('OwnerAside', () => {
  it('is a dialog named by its title, with its actions', () => {
    render(
      <OwnerAside title="Add an expense" onClose={() => undefined} actions={<button>Save</button>}>
        <p>Fields</p>
      </OwnerAside>,
    );
    expect(screen.getByRole('dialog', { name: 'Add an expense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    function Page() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Add expense</button>
          {open ? <OwnerAside title="Add an expense" onClose={() => setOpen(false)} /> : null}
        </>
      );
    }
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Add expense' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
