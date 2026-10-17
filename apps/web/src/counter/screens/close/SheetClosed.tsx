import { formatRs, type CloseSheetResult } from '@stockers/shared';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useBoard, useLastClose, usePlayers } from '../../api';
import { RichText } from '../../components/RichText';

/** One of the three cards under the title: a small label, a bold line, a plain line. */
function Card({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[18px] border border-c-line bg-c-panel px-5 py-[18px] text-start">
      <span className="text-[16px] text-c-text-2">{label}</span>
      <span className="text-[20px] font-bold">{title}</span>
      <span className="text-[16px] text-c-text-3">{text}</span>
    </div>
  );
}

/**
 * Screen 33, `/sheet-closed`: "Sheet 48 is closed". What the close did, from `GET /sheets/last-close` so a reload shows it
 * again: the games that moved to the new sheet, the players moved to credit as "left without checkout", and the cash check
 * with the note that was saved for the owners; then "Back to tables". Nothing has been closed yet goes back to the board.
 */
export function SheetClosed() {
  const last = useLastClose();
  if (last.isError) return <Navigate to="/" replace />;
  if (!last.data) return <div className="flex-1" />;
  return <Closed result={last.data} />;
}

function Closed({ result }: { result: CloseSheetResult }) {
  const { t } = useTranslation('closed');
  const { t: tBoard } = useTranslation('board');
  const { lang, clock, day } = useFormat();
  const navigate = useNavigate();
  const everyone = usePlayers();
  const board = useBoard('all');
  const money = (value: number) => formatRs(value, lang);

  const nameOf = (id: string | undefined) =>
    everyone.data?.find((player) => player.id === id)?.name ?? '';
  const tableName = (moved: CloseSheetResult['moved'][number]) => {
    const table = board.data?.tables.find((candidate) => candidate.id === moved.tableId);
    return table
      ? tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') })
      : moved.tableName;
  };

  const { moved, leftWithoutCheckout: left, cash } = result;
  const creditTotal = left.reduce((sum, bill) => sum + bill.amount, 0);
  const next = result.newSheet.number;

  const movedCard = (() => {
    if (moved.length === 0) {
      return { title: t('movedNoneTitle'), text: t('movedNoneText') };
    }
    if (moved.length > 1)
      return { title: t('movedMany', { count: moved.length }), text: t('movedRunning') };
    const only = moved[0];
    const table = tableName(only);
    const title =
      only.type === 'century'
        ? t('movedCentury', { table })
        : only.type === 'room'
          ? t('movedRoom', { table })
          : t(
              `movedType.${only.type === 'double' ? 'double' : only.type === 'single' ? 'single' : 'game'}`,
              { table },
            );
    const who = nameOf(only.underPlayerId);
    return { title, text: who ? t('movedUnder', { who }) : t('movedRunning') };
  })();

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
      <section
        aria-labelledby="sheet-closed-title"
        className="flex w-full max-w-[920px] flex-col items-center gap-[26px] text-center"
      >
        <span
          aria-hidden="true"
          className="flex h-[112px] w-[112px] items-center justify-center rounded-full bg-c-felt shadow-[inset_-14px_-14px_0_rgba(0,0,0,0.25)]"
        >
          <Check size={58} strokeWidth={2.6} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 id="sheet-closed-title" className="m-0 text-[44px] font-bold leading-tight">
            {t('title', { number: result.closed.number })}
          </h1>
          <span className="text-[21px] text-c-text-3">
            <RichText
              ns="closed"
              i18nKey="sub"
              values={{
                time: t('at', {
                  time: clock(result.closed.closedAt),
                  day: day(result.closed.closedAt),
                }),
                next,
              }}
            />
          </span>
        </div>

        <div className="grid w-full grid-cols-3 gap-3">
          <Card
            label={t('moved', { number: next })}
            title={movedCard.title}
            text={movedCard.text}
          />
          <Card
            label={t('credit')}
            title={
              left.length > 0
                ? t('creditPlayers', { count: left.length, amount: money(creditTotal) })
                : t('creditNoneTitle')
            }
            text={left.length > 0 ? t('creditText') : t('creditNoneText')}
          />
          <Card
            label={t('cash')}
            title={
              cash.difference < 0
                ? t('cashShort', { amount: money(-cash.difference) })
                : cash.difference > 0
                  ? t('cashExtra', { amount: money(cash.difference) })
                  : t('cashMatches')
            }
            text={cash.difference !== 0 ? t('cashNote') : t('cashOk')}
          />
        </div>

        <span className="text-[17px] text-c-text-2">
          <RichText ns="closed" i18nKey="emailed" values={{ time: clock(result.backedUpAt) }} />
        </span>
        <button
          type="button"
          onClick={() => navigate('/')}
          className={cx(
            'inline-flex min-h-[76px] items-center rounded-[18px] bg-c-brass px-12 text-[22px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press',
            focusRing.counter,
          )}
        >
          {t('back')}
        </button>
      </section>
    </main>
  );
}
