import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import type { Theme } from './theme';

/** `solid` is a full green card and `dark` a walnut card (the "Earned today" cards on screens 36 and 53). */
export type CardTone = 'plain' | 'amber' | 'blue' | 'green' | 'soft' | 'solid' | 'dark';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

// Counter: the same tones on the dark panel (the "Old credit" box and the "Paid now" box).
const TONE: Record<Theme, Record<CardTone, string>> = {
  owner: {
    plain: 'border-o-line bg-o-card',
    amber: 'border-o-amber-line bg-o-amber-tint',
    blue: 'border-o-blue-line bg-o-blue-tint',
    green: 'border-transparent bg-o-green-tint',
    soft: 'border-transparent bg-o-soft',
    solid: 'border-transparent bg-o-green text-c-text',
    dark: 'border-transparent bg-c-panel text-c-text',
  },
  counter: {
    plain: 'border-c-line bg-c-panel',
    amber: 'border-c-warn-line bg-c-warn-bg',
    blue: 'border-c-info-line bg-c-info-bg',
    green: 'border-c-ok-line bg-c-ok-bg',
    soft: 'border-c-line bg-c-raised',
    solid: 'border-transparent bg-c-felt text-c-text',
    dark: 'border-c-line bg-c-header text-c-text',
  },
};

const RADIUS = { card: 'rounded-card', md: 'rounded-[14px]', sm: 'rounded-[12px]' } as const;

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'px-3.5 py-3',
  md: 'px-5 py-[18px]',
  lg: 'px-[22px] py-5',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  theme: Theme;
  tone?: CardTone;
  padding?: CardPadding;
  /** `card` 18 px, `md` 14 px (phone cards), `sm` 12 px. The default is `card`, or `sm` for a `soft` box. */
  radius?: 'card' | 'md' | 'sm';
}

/** A bordered box. `soft` is the small grey or tinted information box inside a card or a side panel. */
export function Card({
  theme,
  tone = 'plain',
  padding = 'md',
  radius,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        'min-w-0 border',
        RADIUS[radius ?? (tone === 'soft' ? 'sm' : 'card')],
        TONE[theme][tone],
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
