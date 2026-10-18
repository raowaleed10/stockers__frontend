import type { DisputeBrief } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useDecideDispute } from '../../api';
import { useOwnerFormat } from '../../use-owner-format';

const firstName = (name: string) => name.split(' ')[0] ?? name;

const BUTTON = cx(
  'min-h-[48px] rounded-[12px] border border-o-amber-line bg-o-card px-4 text-[16px] font-semibold text-o-ink transition-colors duration-150 hover:bg-o-soft disabled:opacity-40',
  focusRing.owner,
);

/**
 * The amber banner of screen 38: a dispute is waiting for an owner (D15). It says which table, when, who and what was said,
 * and has one button for each answer: the first player pays, the second pays, half each, or nobody pays. Deciding writes a
 * new line in Activity with the owner's name and takes the banner away (the next dispute, if there is one, comes up).
 */
export function DisputeBanner({ disputes }: { disputes: DisputeBrief[] }) {
  const { t } = useTranslation('activity');
  const fmt = useOwnerFormat();
  const decide = useDecideDispute();
  const first = disputes[0];
  if (!first) return null;

  const [a, b] = first.players;
  const send = (payer: 'first' | 'second' | 'half' | 'nobody') =>
    decide.mutate({ id: first.eventId, request: { payer } });

  return (
    <section
      aria-label={t('waiting')}
      className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-[18px] border border-o-amber-line bg-o-amber-tint px-5 py-4"
    >
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[3px]">
        <span className="text-[18px] font-bold">
          {t('dispute.title', { count: disputes.length })}
        </span>
        <span className="text-[16px] text-o-amber-ink-2">
          {t('dispute.who', {
            table: fmt.table(first.table),
            time: fmt.clock(first.at),
            a: a.name,
            b: b.name,
          })}
          {first.frameNo !== undefined ? t('dispute.frame', { n: first.frameNo }) : ''}
          {t('dispute.amount', { amount: fmt.money(first.amount) })}
          {first.note ? t('dispute.note', { note: first.note }) : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={decide.isPending}
          className={BUTTON}
          onClick={() => send('first')}
        >
          {t('dispute.pays', { name: firstName(a.name) })}
        </button>
        <button
          type="button"
          disabled={decide.isPending}
          className={BUTTON}
          onClick={() => send('second')}
        >
          {t('dispute.pays', { name: firstName(b.name) })}
        </button>
        <button
          type="button"
          disabled={decide.isPending}
          className={BUTTON}
          onClick={() => send('half')}
        >
          {t('dispute.half')}
        </button>
        <button
          type="button"
          disabled={decide.isPending}
          className={BUTTON}
          onClick={() => send('nobody')}
        >
          {t('dispute.nobody')}
        </button>
      </div>
      {decide.error ? (
        <p role="alert" className="m-0 w-full text-[15px] font-semibold text-o-red">
          {decide.error.message}
        </p>
      ) : null}
    </section>
  );
}
