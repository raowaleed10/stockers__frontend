import type { ReactNode } from 'react';
import { Card, type CardTone } from './Card';
import { cx } from './cx';
import type { Theme } from './theme';

export type StatSize = 'sm' | 'md' | 'lg' | 'xl';
export type StatLabelTone = 'default' | 'amber' | 'green';

// sm is the phone card (screen 53); md and lg are the desktop cards (43, 36); xl is the phone hero number.
const SIZE: Record<StatSize, { box: string; label: string; value: string; note: string }> = {
  sm: {
    box: 'gap-0.5',
    label: 'text-[14px]',
    value: 'text-[28px] leading-[1.1]',
    note: 'text-[13px]',
  },
  md: { box: 'gap-1', label: 'text-[16px]', value: 'text-o-stat', note: 'text-[15px]' },
  lg: {
    box: 'gap-1',
    label: 'text-[16px]',
    value: 'text-[46px] leading-[1.05]',
    note: 'text-[15px]',
  },
  xl: {
    box: 'gap-1',
    label: 'text-[15px]',
    value: 'text-[56px] leading-none',
    note: 'text-[15px]',
  },
};

const LABEL: Record<Theme, Record<StatLabelTone, string>> = {
  owner: { default: 'text-o-ink-2', amber: 'text-o-amber-ink', green: 'text-o-green' },
  counter: { default: 'text-c-text-2', amber: 'text-c-warn-ink', green: 'text-c-ok-ink' },
};

export interface StatCardProps {
  theme: Theme;
  label: ReactNode;
  /** Usually a `<MoneyText />` or a count. */
  value: ReactNode;
  note?: ReactNode;
  tone?: CardTone;
  /** The colour of the label. It can differ from the card, as on screen 43. */
  labelTone?: StatLabelTone;
  size?: StatSize;
  /** Digits of the same width (the default, so a column lines up). The owner dashboards are drawn with proportional digits. */
  tabular?: boolean;
  className?: string;
}

/** A label, one big number and a short note. */
export function StatCard({
  theme,
  label,
  value,
  note,
  tone = 'plain',
  labelTone = 'default',
  size = 'md',
  tabular = true,
  className,
}: StatCardProps) {
  const look = SIZE[size];
  const onColour = tone === 'solid' || tone === 'dark';
  const labelColour = onColour
    ? tone === 'solid'
      ? 'text-c-text'
      : 'text-c-text-3'
    : LABEL[theme][labelTone];
  const noteColour = onColour
    ? tone === 'solid'
      ? 'text-o-on-green'
      : 'text-c-text-3'
    : tone === 'amber' && theme === 'owner'
      ? 'text-o-amber-ink-2'
      : theme === 'owner'
        ? 'text-o-ink-2'
        : 'text-c-text-2';
  return (
    <Card
      theme={theme}
      tone={tone}
      padding={size === 'sm' ? 'sm' : 'md'}
      radius={size === 'sm' ? 'md' : 'card'}
      className={cx('flex flex-col', look.box, className)}
    >
      <span className={cx('font-semibold', look.label, labelColour)}>{label}</span>
      <span className={cx('font-num font-bold', tabular && 'tabular-nums', look.value)}>
        {value}
      </span>
      {note ? <span className={cx(look.note, noteColour)}>{note}</span> : null}
    </Card>
  );
}
