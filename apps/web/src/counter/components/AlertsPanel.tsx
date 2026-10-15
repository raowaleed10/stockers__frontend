import { clubDayNumber, type CounterAlert } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { clock } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { EmptyState } from '@/ui/EmptyState';
import { MoneyText } from '@/ui/MoneyText';
import { SidePanel } from '@/ui/SidePanel';
import { useAlerts, useReadAllAlerts } from '../api';

// The bar at the start of a row says what kind of alert it is, as the bars of screen 58 do.
const BAR: Record<CounterAlert['kind'], string> = {
  'low-stock': 'bg-c-brass',
  'out-of-order': 'bg-s-ooo',
  'game-cancelled': 'bg-c-line-3',
};

/**
 * One alert: the title and one line of text at the start, the amount (if there is one) and the time at the end,
 * laid out like the rows of screen 58 (docs/NO_DESIGN.md). Unread ones have a dot and a hidden "Unread".
 */
function AlertRow({ alert }: { alert: CounterAlert }) {
  const { t } = useTranslation('alerts');
  const format = useFormat();
  // Today only the time; an older alert says its day too.
  const today = clubDayNumber(clock.now());
  const time =
    clubDayNumber(alert.at) === today
      ? format.clock(alert.at)
      : `${format.day(alert.at)}${format.lang === 'ur' ? '،' : ','} ${format.clock(alert.at)}`;

  return (
    <li className="flex items-stretch gap-3 rounded-[14px] border border-c-line bg-c-raised p-4">
      <span aria-hidden="true" className={cx('w-1 shrink-0 rounded-full', BAR[alert.kind])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-[18px] font-bold leading-tight">
          {alert.read ? null : (
            <>
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-c-brass" />
              <span className="sr-only">{t('unread')}</span>
            </>
          )}
          <bdi>{alert.title}</bdi>
        </span>
        <span dir="auto" className="text-[15px] text-c-text-2">
          {alert.text}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-end">
        {alert.amount === undefined ? null : (
          <MoneyText value={alert.amount} className="text-[18px] font-bold" />
        )}
        <span className="text-[14px] text-c-text-2">
          <bdi>{time}</bdi>
        </span>
      </div>
    </li>
  );
}

/**
 * The bell's panel (no approved screen; docs/NO_DESIGN.md): the counter's own alerts in the counter side panel
 * of screen 11, with "Mark all read" in the header. Closing it goes back to the board. These are the counter's
 * alerts only (`GET /alerts`), never the owners' notifications.
 */
export function AlertsPanel() {
  const { t } = useTranslation('alerts');
  const navigate = useNavigate();
  const alerts = useAlerts();
  const readAll = useReadAllAlerts();
  const unread = alerts.data?.unread ?? 0;

  return (
    <>
      {/* The board stays behind, dimmed, as it does behind the panel of screen 11. */}
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-[var(--ov-k50)]" />
      <div className="absolute inset-y-0 end-0 z-20 flex w-[560px] max-w-full" data-testid="alerts">
        <SidePanel
          title={t('title')}
          onClose={() => navigate('/')}
          className="h-full overflow-y-auto"
          actions={
            <Button
              theme="counter"
              variant="secondary"
              disabled={unread === 0 || readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              {t('markAllRead')}
            </Button>
          }
        >
          {alerts.isPending ? (
            <p className="m-0 text-[18px] text-c-text-2">{t('loading')}</p>
          ) : alerts.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="m-0 text-[18px] text-c-danger-ink">{t('loadFailed')}</p>
              <Button theme="counter" variant="outline" onClick={() => void alerts.refetch()}>
                {t('retry')}
              </Button>
            </div>
          ) : alerts.data.alerts.length === 0 ? (
            <EmptyState theme="counter" title={t('empty')} />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {alerts.data.alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
        </SidePanel>
      </div>
    </>
  );
}
