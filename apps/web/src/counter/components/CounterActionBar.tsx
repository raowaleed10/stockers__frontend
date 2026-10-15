import {
  Banknote,
  ChartColumn,
  Coffee,
  FileCheck,
  Pause,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { RichText } from './RichText';

// The bar's buttons are 64 px (docs/04 §4: footer actions). Checkout is the brass one; Close sheet is outlined.
const BASE =
  'flex min-h-touch-main items-center rounded-btn transition-colors duration-150 ' +
  focusRing.counter;
const LOOK = {
  // Urdu is a size smaller (screen 6: 19 and 17 px).
  main: `${BASE} gap-3 border-0 bg-c-brass px-7 text-[20px] font-bold text-c-brass-ink active:bg-c-brass-press rtl:text-[19px]`,
  plain: `${BASE} gap-2.5 border border-c-line bg-c-panel px-[22px] text-[18px] font-semibold text-c-text active:bg-c-raised-2 rtl:text-[17px]`,
  outline: `${BASE} gap-2.5 border border-c-line-3 bg-transparent px-[22px] text-[18px] font-semibold text-c-text active:bg-c-raised rtl:text-[17px]`,
} as const;

function Action({
  look,
  icon: Icon,
  iconSize = 22,
  strokeWidth = 2,
  onClick,
  children,
}: {
  look: keyof typeof LOOK;
  icon: LucideIcon;
  iconSize?: number;
  strokeWidth?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={cx(LOOK[look])} onClick={onClick}>
      <Icon aria-hidden="true" size={iconSize} strokeWidth={strokeWidth} />
      {children}
    </button>
  );
}

export interface CounterActionBarProps {
  onCheckout: () => void;
  onCanteen: () => void;
  onPlayers: () => void;
  onToday: () => void;
  onExpense: () => void;
  onPauseAll: () => void;
  onCloseSheet: () => void;
  /** The last backup. Not known yet while the board loads. */
  backedUpAt?: string;
}

/** The bottom bar of the signed-in counter screens (screens 3 to 6, 16). */
export function CounterActionBar({
  onCheckout,
  onCanteen,
  onPlayers,
  onToday,
  onExpense,
  onPauseAll,
  onCloseSheet,
  backedUpAt,
}: CounterActionBarProps) {
  const { t } = useTranslation('frame');
  const { clock } = useFormat();
  return (
    <footer className="flex flex-wrap items-center gap-3 border-t border-c-line bg-c-header px-6 pb-[18px] pt-3.5 rtl:pb-4 rtl:pt-3">
      <Action look="main" icon={Wallet} iconSize={24} strokeWidth={2.2} onClick={onCheckout}>
        {t('actions.checkout')}
      </Action>
      <Action look="plain" icon={Coffee} onClick={onCanteen}>
        {t('actions.canteen')}
      </Action>
      <Action look="plain" icon={Users} onClick={onPlayers}>
        {t('actions.players')}
      </Action>
      <Action look="plain" icon={ChartColumn} onClick={onToday}>
        {t('actions.today')}
      </Action>
      <Action look="plain" icon={Banknote} onClick={onExpense}>
        {t('actions.expense')}
      </Action>
      <Action look="plain" icon={Pause} onClick={onPauseAll}>
        {t('actions.pauseAll')}
      </Action>
      <div className="flex-1" />
      {backedUpAt ? (
        <span className="text-[14px] text-c-text-2">
          <RichText ns="frame" i18nKey="backedUp" values={{ time: clock(backedUpAt) }} />
        </span>
      ) : null}
      <Action look="outline" icon={FileCheck} onClick={onCloseSheet}>
        {t('actions.closeSheet')}
      </Action>
    </footer>
  );
}
