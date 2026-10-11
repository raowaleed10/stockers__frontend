import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';
import { Field } from './Field';
import { LanguageSwitch, type SwitchLang } from './LanguageSwitch';
import { Segmented } from './Segmented';
import { MoneyInput, Select, TextArea, TextInput } from './inputs';

describe('Chip', () => {
  it('says whether it is selected, and reports presses', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Chip theme="owner" onClick={onClick}>
        Owe money
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'Owe money' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Chip theme="owner" selected>
        Owe money
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Owe money' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Owe money' }).className).toContain('border-o-green');
  });

  it('is at least 56 px on the counter and 44 px in the owner portal', () => {
    render(
      <>
        <Chip theme="counter">C</Chip>
        <Chip theme="owner">O</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'C' }).className).toContain('min-h-touch ');
    expect(screen.getByRole('button', { name: 'O' }).className).toContain('min-h-touch-owner');
  });
});

describe('Segmented', () => {
  function Half() {
    const [value, setValue] = useState<'am' | 'pm'>('am');
    return (
      <Segmented
        theme="owner"
        label="From AM or PM"
        value={value}
        onChange={setValue}
        options={[
          { value: 'am', label: 'AM' },
          { value: 'pm', label: 'PM' },
        ]}
      />
    );
  }

  it('is a radio group where one choice is checked', () => {
    render(<Half />);
    expect(screen.getByRole('radiogroup', { name: 'From AM or PM' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'AM' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveAttribute('aria-checked', 'false');
  });

  it('changes on a press', async () => {
    render(<Half />);
    await userEvent.click(screen.getByRole('radio', { name: 'PM' }));
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveAttribute('aria-checked', 'true');
  });

  it('moves with the arrow keys, and only the checked choice is in the Tab order', async () => {
    render(<Half />);
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveAttribute('tabindex', '-1');
    screen.getByRole('radio', { name: 'AM' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'PM' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'AM' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('LanguageSwitch', () => {
  it('offers English and اردو, each in its own language', () => {
    render(<LanguageSwitch theme="counter" value="en" onChange={() => undefined} />);
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    const urdu = screen.getByRole('radio', { name: 'اردو' });
    expect(urdu).toHaveAttribute('lang', 'ur');
  });

  it('reports the language that was picked', async () => {
    const picked: SwitchLang[] = [];
    render(<LanguageSwitch theme="owner" value="en" onChange={(lang) => picked.push(lang)} />);
    await userEvent.click(screen.getByRole('radio', { name: 'اردو' }));
    expect(picked).toEqual(['ur']);
  });
});

describe('Field and inputs', () => {
  it('ties the label, hint and error to the control', () => {
    render(
      <Field theme="owner" label="Amount, Rs" hint="Whole rupees" error="Enter an amount">
        {(control) => <TextInput theme="owner" {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Amount, Rs');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const described = input.getAttribute('aria-describedby') ?? '';
    expect(described.split(' ')).toHaveLength(2);
    expect(document.getElementById(described.split(' ')[0])).toHaveTextContent('Whole rupees');
    expect(document.getElementById(described.split(' ')[1])).toHaveTextContent('Enter an amount');
  });

  it('is not invalid without an error', () => {
    render(
      <Field theme="owner" label="Reason">
        {(control) => <TextInput theme="owner" {...control} />}
      </Field>,
    );
    expect(screen.getByLabelText('Reason')).not.toHaveAttribute('aria-invalid');
  });

  it('MoneyInput keeps whole rupees only and shows thousands commas', async () => {
    function Amount() {
      const [value, setValue] = useState<number | null>(null);
      return (
        <Field theme="owner" label="Amount">
          {(control) => <MoneyInput theme="owner" {...control} value={value} onChange={setValue} />}
        </Field>
      );
    }
    render(<Amount />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await userEvent.type(input, '2a0.5,00');
    expect(input).toHaveValue('20,500');
    await userEvent.clear(input);
    expect(input).toHaveValue('');
  });

  it('TextArea and Select work inside a Field', () => {
    render(
      <>
        <Field theme="counter" label="Note">
          {(control) => <TextArea theme="counter" {...control} />}
        </Field>
        <Field theme="counter" label="Paid from">
          {(control) => (
            <Select theme="counter" {...control}>
              <option>Cash</option>
              <option>Bank</option>
            </Select>
          )}
        </Field>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Note' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Paid from' })).toBeInTheDocument();
  });
});
