import {
  closeNoteRequired,
  drawerDifference,
  formatRs,
  type ClosePreview,
  type PaymentMethod,
} from '@stockers/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useBoard, useClosePreview, useCloseSheet, usePlayers } from '../../api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { RichText } from '../../components/RichText';
import { durationWords } from '../../end/duration';

const MAX_DIGITS = 7;

/** The online methods to list: the ones that are on, then any other that took money on this sheet. */
function onlineIds(methods: PaymentMethod[], online: Record<string, number>): string[] {
  const ids = methods.filter((method) => method.id !== 'cash').map((method) => method.id);
  return [...ids, ...Object.keys(online).filter((id) => id !== 'cash' && !ids.includes(id))];
}

/**
 * Screen 32, `/close-sheet`: "Close sheet 48", in three steps and a summary. (1) Count the cash drawer: the cash expected
 * after the drawer expenses, the cash counted, and how much it is short or extra, with a required note when it is not
 * nothing (D33, D53). (2) The online money by method. (3) What happens at the close: the players left without checkout move
 * to credit (D27), the games still running move to the next sheet (Q5), and the day summary is emailed. "Close sheet 48" asks
 * once before it closes (D63) and opens sheet 49 straight away (D32).
 */
export function CloseSheet() {
  const { t } = useTranslation('close');
  const { t: tEnd } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const { t: tCheckout } = useTranslation('checkout');
  const { lang, clock, day } = useFormat();
  const navigate = useNavigate();
  const preview = useClosePreview();
  const everyone = usePlayers();
  const board = useBoard('all');
  const close = useCloseSheet();
  const countedId = useId();
  const noteId = useId();
  const [counted, setCounted] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);

  const data = preview.data;
  const money = (value: number) => formatRs(value, lang);
  const methodName = (id: string) =>
    tCheckout(`methods.${id}` as never, {
      defaultValue: data?.methods.find((method) => method.id === id)?.name ?? id,
    });
  const nameOf = (id: string | undefined) =>
    everyone.data?.find((player) => player.id === id)?.name ?? '';

  if (preview.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader back={t('back')} onBack={() => navigate('/')} title={t('loadFailed')} />
      </div>
    );
  }
  if (!data) return <div className="flex-1" />;

  const number = data.sheet.number;
  const difference = counted === null ? null : drawerDifference(counted, data.cash.expected);
  const needsNote = difference !== null && closeNoteRequired(difference);
  const ready = counted !== null && (!needsNote || note.trim() !== '');
  const leftTotal = data.leftWithoutCheckout.reduce((sum, bill) => sum + bill.amount, 0);
  const dayTime = (iso: string) => t('dayTime', { day: day(iso), time: clock(iso) });
  const length = durationWords(Date.parse(data.closingAt) - Date.parse(data.sheet.openedAt), tEnd);

  // The words of the board ("Table 2", "Room 1", in Urdu too); the stored name is the fallback.
  const tableName = (running: ClosePreview['running'][number]) => {
    const table = board.data?.tables.find((candidate) => candidate.id === running.tableId);
    return table
      ? tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') })
      : running.tableName;
  };
  const runningLine = (running: ClosePreview['running'][number]) => {
    const who = nameOf(running.underPlayerId);
    const key =
      running.type === 'century'
        ? who
          ? 'what.century'
          : 'what.centuryPlain'
        : running.type === 'room'
          ? who
            ? 'what.room'
            : 'what.roomPlain'
          : (`what.${running.type}` as 'what.single' | 'what.double' | 'what.game');
    return t(key, { table: tableName(running), who, minutes: running.minutes });
  };

  const submit = () => {
    if (counted === null) return;
    close.mutate(
      { counted, ...(note.trim() ? { note: note.trim() } : {}) },
      { onSuccess: () => navigate('/sheet-closed', { replace: true }) },
    );
  };

  const box = 'flex flex-col rounded-[22px] border border-c-line bg-c-panel px-[22px] py-5';
  const heading = 'm-0 text-[21px] font-bold';
  const differenceTone =
    difference === null
      ? 'border border-c-line bg-c-raised'
      : difference < 0
        ? 'border border-c-danger-line bg-c-danger-bg'
        : difference > 0
          ? 'border border-c-ok-line bg-c-ok-bg'
          : 'border border-c-line bg-c-raised';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        back={t('back')}
        onBack={() => navigate('/')}
        title={t('title', { number })}
        subtitle={
          <RichText
            ns="close"
            i18nKey="sub"
            values={{
              opened: dayTime(data.sheet.openedAt),
              closing: dayTime(data.closingAt),
              who: data.closingBy.name,
              length,
            }}
          />
        }
      />
      <main className="flex flex-1 flex-wrap items-start gap-5 px-6 pb-6 pt-5">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <section aria-label={t('cashLabel')} className={cx(box, 'gap-3.5')}>
            <h2 className={heading}>{t('count')}</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 rounded-[16px] bg-c-raised px-[18px] py-4">
                <span className="max-w-[15.5em] text-[16px] leading-[22px] text-c-text-2">
                  {data.cash.drawerExpenses > 0
                    ? t('expected', { expenses: money(data.cash.drawerExpenses) })
                    : t('expectedPlain')}
                </span>
                <span className="font-num text-[40px] font-bold leading-[1.15]">
                  {money(data.cash.expected)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-[16px] border-2 border-c-brass bg-c-page px-[18px] py-4 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-c-text">
                <label htmlFor={countedId} className="text-[16px] font-semibold text-c-brass">
                  {t('counted')}
                </label>
                <input
                  id={countedId}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={t('placeholder')}
                  value={counted === null ? '' : money(counted)}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
                    setCounted(digits === '' ? null : Number(digits));
                  }}
                  className="w-full min-w-0 bg-transparent p-0 font-num text-[40px] font-bold leading-[1.15] text-c-text outline-none placeholder:text-[22px] placeholder:font-semibold placeholder:text-c-text-2"
                />
              </div>
              <div
                aria-live="polite"
                className={cx('flex flex-col gap-1 rounded-[16px] px-[18px] py-4', differenceTone)}
              >
                <span
                  className={cx(
                    'text-[16px] font-semibold',
                    difference !== null && difference < 0
                      ? 'text-c-danger-ink'
                      : difference !== null && difference > 0
                        ? 'text-c-ok-ink'
                        : 'text-c-text-2',
                  )}
                >
                  {difference === null
                    ? t('difference')
                    : difference < 0
                      ? t('short')
                      : difference > 0
                        ? t('extra')
                        : t('matches')}
                </span>
                <span className="font-num text-[40px] font-bold leading-[1.15]">
                  {difference === null ? '–' : money(Math.abs(difference))}
                </span>
              </div>
            </div>
            <label htmlFor={noteId} className="text-[16px] text-c-text-2">
              {t('note')}
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              autoComplete="off"
              aria-required={needsNote || undefined}
              className="min-h-[58px] w-full rounded-[14px] border-2 border-c-line-2 bg-c-page px-4 text-[18px] text-c-text outline-none focus-visible:border-c-brass focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text"
            />
          </section>

          <section aria-label={t('onlineLabel')} className={cx(box, 'gap-3')}>
            <h2 className={heading}>{t('online')}</h2>
            <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0">
              {onlineIds(data.methods, data.online).map((id) => (
                <li
                  key={id}
                  className="flex items-baseline justify-between rounded-[14px] bg-c-raised px-[18px] py-3.5"
                >
                  <span className="text-[17px]">{methodName(id)}</span>
                  <span className="font-num text-[30px] font-semibold">
                    {money(data.online[id] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label={t('happensLabel')} className={cx(box, 'gap-3')}>
            <h2 className={heading}>{t('happens')}</h2>
            {data.leftWithoutCheckout.length > 0 ? (
              <div className="flex items-center justify-between gap-3 rounded-[14px] border border-c-warn-line bg-c-warn-bg px-4 py-3.5">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[18px] font-bold">
                    {t('left', { count: data.leftWithoutCheckout.length })}
                  </span>
                  <span className="text-[16px] text-c-text-3">
                    {t('leftText', {
                      names: data.leftWithoutCheckout
                        .map((bill) => `${bill.name} ${money(bill.amount)}`)
                        .join(lang === 'ur' ? ' اور ' : ' and '),
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className={cx(
                    '-my-0.5 inline-flex min-h-[56px] shrink-0 items-center whitespace-nowrap rounded-[12px] border border-c-warn-line bg-transparent px-4 text-[16px] font-semibold text-c-text transition-colors duration-150 active:bg-c-raised',
                    focusRing.counter,
                  )}
                >
                  {t('checkFirst')}
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-c-info-line bg-c-info-bg px-4 py-3.5">
              <span className="flex min-w-0 flex-col">
                <span className="text-[18px] font-bold">
                  {data.running.length > 0
                    ? t('running', { count: data.running.length, number: number + 1 })
                    : t('runningNone', { number: number + 1 })}
                </span>
                {data.running.map((game) => (
                  <span key={game.gameId} className="text-[16px] text-c-info-text">
                    {runningLine(game)}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-[14px] bg-c-raised px-4 py-3.5">
              <span className="text-[17px] text-c-text-3">{t('summary')}</span>
            </div>
          </section>
        </div>

        <aside
          aria-label={t('inShortLabel')}
          className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5"
        >
          <div className="flex flex-col gap-1 rounded-[22px] border border-c-line bg-c-panel px-[22px] py-5">
            <h2 className="m-0 mb-2 text-[20px] font-bold">{t('inShort', { number })}</h2>
            <dl className="m-0 flex flex-col gap-1">
              {[
                [t('frames'), String(data.summary.frames), false],
                [t('century'), String(data.summary.centuryMinutes), false],
                [t('rooms'), durationWords(data.summary.roomMinutes * 60_000, tEnd), false],
                [t('received'), money(data.summary.received), false],
                [t('credit'), money(data.summary.newCredit), true],
                [
                  t('discounts'),
                  t('discountsValue', {
                    amount: money(data.summary.discounts.total),
                    count: data.summary.discounts.count,
                  }),
                  false,
                ],
              ].map(([label, value, amber], index, rows) => (
                <div
                  key={String(label)}
                  className={cx(
                    'flex justify-between gap-3 py-2.5 text-[18px]',
                    index < rows.length - 1 && 'border-b border-c-line',
                    amber && 'text-c-warn-ink',
                  )}
                >
                  <dt>{label}</dt>
                  <dd className="m-0 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <button
            type="button"
            disabled={!ready || close.isPending}
            onClick={() => setAsking(true)}
            className={cx(
              'flex min-h-[92px] flex-col items-center justify-center gap-0.5 rounded-[18px] bg-c-brass text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press disabled:opacity-40',
              focusRing.counter,
            )}
          >
            <span className="text-[22px] font-bold">{t('button', { number })}</span>
            <span className="text-[16px] font-medium">{t('buttonSub', { next: number + 1 })}</span>
          </button>
          {counted !== null && needsNote && note.trim() === '' ? (
            <p role="status" className="m-0 text-center text-[15px] text-c-warn-ink">
              {t('noteNeeded')}
            </p>
          ) : null}
          <span className="text-center text-[15px] text-c-text-2">{t('fine')}</span>
        </aside>
      </main>

      {asking && counted !== null && difference !== null ? (
        <ConfirmDialog
          title={t('confirm.titleCounted', { number, counted: money(counted) })}
          subtitle={
            difference < 0
              ? t('confirm.short', { amount: money(-difference) })
              : difference > 0
                ? t('confirm.extra', { amount: money(difference) })
                : t('confirm.matches')
          }
          yes={t('confirm.yes')}
          no={t('confirm.no')}
          onYes={submit}
          onNo={() => setAsking(false)}
          pending={close.isPending}
          error={close.error?.message}
        >
          {data.leftWithoutCheckout.length > 0 ? (
            <p className="m-0 text-[17px] text-c-text-3">
              {t('confirm.left', {
                count: data.leftWithoutCheckout.length,
                amount: money(leftTotal),
              })}
            </p>
          ) : null}
          {data.running.length > 0 ? (
            <p className="m-0 text-[17px] text-c-text-3">
              {t('confirm.running', { count: data.running.length, number: number + 1 })}
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
