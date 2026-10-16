import { Play, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useResumeAll } from '../api';
import { RichText } from './RichText';

/**
 * "All games are paused" (screen 16): the yellow strip under the top bar after Pause all, with "Resume all games".
 * Timers are stopped, so the time of a power cut is not charged (D14). It is an alert: a screen reader says it when it
 * appears.
 */
export function PausedBanner({ pausedAt }: { pausedAt?: string }) {
  const { t } = useTranslation('table');
  const { clock } = useFormat();
  const resume = useResumeAll();
  return (
    <div
      role="alert"
      className="mx-6 mb-1 mt-[18px] flex flex-wrap items-center gap-[18px] rounded-[18px] bg-s-pause px-[22px] py-[18px] text-c-brass-ink"
    >
      <Zap aria-hidden="true" size={34} strokeWidth={2.2} className="shrink-0" />
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-0.5">
        <span className="text-[24px] font-bold">{t('pause.title')}</span>
        <span className="text-[17px]">
          {pausedAt ? (
            <RichText ns="table" i18nKey="pause.text" values={{ time: clock(pausedAt) }} />
          ) : null}
        </span>
      </div>
      <button
        type="button"
        disabled={resume.isPending}
        onClick={() => resume.mutate()}
        className={cx(
          'flex min-h-[68px] items-center gap-3 rounded-[16px] bg-c-brass-ink px-[34px] text-[21px] font-bold text-c-text transition-colors duration-150 active:bg-c-raised disabled:opacity-40',
          focusRing.counter,
        )}
      >
        <Play aria-hidden="true" size={22} fill="currentColor" strokeWidth={0} />
        {t('pause.resume')}
      </button>
      {resume.error ? (
        <p role="alert" className="m-0 basis-full text-[17px]">
          {resume.error.message}
        </p>
      ) : null}
    </div>
  );
}
