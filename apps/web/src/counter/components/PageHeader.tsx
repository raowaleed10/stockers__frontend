import { toClubIso } from '@stockers/shared';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { focusRing } from '@/ui/theme';
import { cx } from '@/ui/cx';

/**
 * The header of a counter page that has its own back button instead of the top bar and the action bar (the checkout
 * screens 24 to 26, and the pages of the later steps): a 56 px "‹ Checkout" button, the title with an optional second
 * line, and the clock at the end (Barlow Condensed, 34 px). It sits in a `<header>` the width of the page.
 */
export function PageHeader({
  back,
  onBack,
  title,
  subtitle,
  className,
}: {
  /** The words of the back button: where it goes ("Tables", "Checkout", "Bill"). */
  back: string;
  onBack: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  const now = useNow(1000);
  const format = useFormat();
  return (
    <header
      className={cx(
        'flex flex-wrap items-center gap-[18px] border-b border-c-line bg-c-header px-6 py-3.5',
        className,
      )}
    >
      <button
        type="button"
        onClick={onBack}
        className={cx(
          'inline-flex min-h-[58px] items-center gap-2.5 rounded-[14px] border border-c-line bg-c-panel px-[18px] text-[18px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised',
          focusRing.counter,
        )}
      >
        <ChevronLeft aria-hidden="true" size={22} strokeWidth={2.2} className="rtl:rotate-180" />
        {back}
      </button>
      <div className="flex min-w-0 flex-col">
        <h1 className="m-0 text-[28px] font-bold leading-tight">{title}</h1>
        {subtitle ? <span className="text-[16px] text-c-text-2">{subtitle}</span> : null}
      </div>
      <div className="flex-1" />
      <span className="font-num text-[34px] font-semibold leading-none">
        <bdi>{format.clock(toClubIso(now))}</bdi>
      </span>
    </header>
  );
}
