import { toClubIso, type SheetSummary } from '@stockers/shared';
import { Bell, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Brand } from './Brand';
import { CounterLanguageSwitch } from './CounterLanguageSwitch';
import { RichText } from './RichText';
import { TopBarButton } from './TopBarButton';
import { WorkerChip } from './WorkerChip';

/** The clock of the top bar. It has its own `useNow`, so only these two words redraw each second. */
function TopBarClock() {
  const now = useNow();
  const { lang, clock, day, parts } = useFormat();
  const iso = toClubIso(now);
  // English: "9:42 PM" and "Sat 3 Oct". Urdu (screen 6): "9:42" and "رات، ہفتہ 3 اکتوبر".
  const big = lang === 'ur' ? parts(iso).time : clock(iso);
  const small = lang === 'ur' ? `${parts(iso).period}، ${day(iso)}` : day(iso);
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-num text-clock font-semibold tabular-nums">
        <bdi dir="ltr">{big}</bdi>
      </span>
      <span className="text-[15px] text-c-text-2">
        <bdi>{small}</bdi>
      </span>
    </div>
  );
}

export interface CounterTopBarProps {
  /** Not known yet while the board loads: the sheet block is left out until it is. */
  sheet?: SheetSummary;
  /** Unread counter alerts (the badge on the bell). */
  notifications: number;
  worker: { id: string; name: string };
  /** The moment the worker's sign-in time ends. */
  until: string;
  onLock: () => void;
  onSwitchWorker: () => void;
  onNotifications?: () => void;
}

/** The top bar of every signed-in counter screen (screens 3 to 6, 16). */
export function CounterTopBar({
  sheet,
  notifications,
  worker,
  until,
  onLock,
  onSwitchWorker,
  onNotifications,
}: CounterTopBarProps) {
  const { t } = useTranslation('frame');
  const { clock, day } = useFormat();
  return (
    <header className="relative z-10 flex flex-wrap items-center gap-5 border-b border-c-line bg-c-header px-6 py-3.5">
      <Brand look="top" />
      {sheet ? (
        <div className="flex flex-col border-s border-c-line ps-4 leading-[1.15]">
          <span className="text-[17px] font-semibold">{t('sheet', { number: sheet.number })}</span>
          <span className="text-[15px] text-c-text-2">
            <RichText
              ns="frame"
              i18nKey="openSince"
              values={{
                time: clock(sheet.openedAt),
                day: day(sheet.openedAt),
              }}
            />
          </span>
        </div>
      ) : null}
      <div className="flex-1" />
      <TopBarClock />
      <CounterLanguageSwitch />
      <TopBarButton
        square
        aria-label={
          notifications > 0 ? t('notificationsNew', { n: notifications }) : t('notifications')
        }
        onClick={onNotifications}
      >
        <Bell aria-hidden="true" size={24} strokeWidth={2} />
        {notifications > 0 ? (
          <span
            aria-hidden="true"
            className="absolute end-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-[10px] bg-c-brass px-1 text-[13px] font-bold text-c-brass-ink"
          >
            {notifications}
          </span>
        ) : null}
      </TopBarButton>
      <WorkerChip worker={worker} until={until} onSwitch={onSwitchWorker} />
      <TopBarButton onClick={onLock} shapeClassName="gap-2.5 px-[18px] font-semibold">
        <Lock aria-hidden="true" size={22} strokeWidth={2} />
        {t('lock')}
      </TopBarButton>
    </header>
  );
}
