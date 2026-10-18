import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { PHONE_QUERY, useMediaQuery } from '@/ui/use-media';
import { useActivity, usePublicOwners, useWorkers } from '../../api';
import { QueryPage } from '../../components/QueryPage';
import { useOwnerFormat } from '../../use-owner-format';
import {
  amountView,
  inKind,
  KINDS,
  kindCount,
  type AmountTone,
  type KindId,
} from './activity-kinds';
import { DisputeBanner } from './DisputeBanner';

const TONE: Record<AmountTone, string> = {
  red: 'text-o-red',
  green: 'text-o-green',
  amber: 'text-o-amber-ink',
  plain: '',
  muted: 'text-o-ink-2',
};

const GRID = 'grid grid-cols-[110px_130px_1fr_110px] gap-3.5 px-5';
/** On a phone a row is two lines: when and who, then what happened with its amount at the end. */
const GRID_PHONE = 'grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4';

/** A filter pill of screen 38: 44 px tall, selected with a 2 px green border and a green tint. */
function Pill({
  selected,
  size,
  onClick,
  children,
}: {
  selected: boolean;
  size: 'type' | 'person';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'min-h-touch-owner whitespace-nowrap rounded-full text-o-ink transition-colors duration-150',
        size === 'type' ? 'px-4 text-[16px]' : 'px-3.5 text-[15px]',
        selected
          ? 'border-2 border-o-green bg-o-green-tint font-bold'
          : 'border border-o-line bg-o-card hover:bg-o-soft',
        focusRing.owner,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Screen 38, `/activity`: everything that changed money outside a normal game, newest first, with who did it (D52). A dispute
 * waits in the amber banner for an owner to decide it. The chips choose a kind of event (the counts come from the server) and
 * who did it; the list is the events of that kind. Names, titles and notes show as they were saved.
 */
export function Activity() {
  const { t } = useTranslation('activity');
  const [kind, setKind] = useState<KindId>('all');
  const [by, setBy] = useState<string | undefined>();
  const activity = useActivity(by ? { by } : {});
  const owners = usePublicOwners();
  const workers = useWorkers();
  const fmt = useOwnerFormat();
  const phone = useMediaQuery(PHONE_QUERY);
  const grid = phone ? GRID_PHONE : GRID;

  // Who can be picked: the workers, then the owners, by first name (screen 38: Shabir, Zain, Aqil, Adil).
  const people = [
    ...(workers.data ?? []).map((worker) => ({ id: worker.id, name: worker.name })),
    ...(owners.data ?? []).map((owner) => ({
      id: owner.id,
      name: owner.name.split(' ')[0] ?? owner.name,
    })),
  ];

  return (
    // This page is drawn with 18 px between its parts (the other owner pages 20), so it keeps its own column.
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-o-h1 font-bold">{t('title')}</h1>
        <span className="text-[17px] text-o-ink-2">{t('sub')}</span>
      </div>

      <QueryPage query={activity}>
        {(data) => {
          const shown = data.events.filter((event) => inKind(event, kind));
          return (
            <>
              <DisputeBanner disputes={data.disputes} />

              <div role="group" aria-label={t('filter')} className="flex flex-wrap gap-2">
                {KINDS.map((item) => (
                  <Pill
                    key={item.id}
                    size="type"
                    selected={kind === item.id}
                    onClick={() => setKind(item.id)}
                  >
                    {t(`chips.${item.id}`, { count: kindCount(data.counts, item.id) })}
                  </Pill>
                ))}
              </div>

              <div
                role="group"
                aria-label={t('doneBy')}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-[15px] font-semibold text-o-ink-2">{t('doneBy')}</span>
                <Pill size="person" selected={by === undefined} onClick={() => setBy(undefined)}>
                  {t('everyone')}
                </Pill>
                {people.map((person) => (
                  <Pill
                    key={person.id}
                    size="person"
                    selected={by === person.id}
                    onClick={() => setBy(person.id)}
                  >
                    {person.name}
                  </Pill>
                ))}
              </div>

              <section
                aria-label={t('list')}
                role="table"
                className="overflow-hidden rounded-[18px] border border-o-line bg-o-card"
              >
                <div
                  role="row"
                  className={cx(
                    grid,
                    'border-b border-o-line bg-o-soft py-3 text-[14px] font-semibold text-o-ink-2',
                    phone && 'sr-only',
                  )}
                >
                  <span role="columnheader">{t('time')}</span>
                  <span role="columnheader">{t('by')}</span>
                  <span role="columnheader">{t('what')}</span>
                  <span role="columnheader" className="text-end">
                    {t('amount')}
                  </span>
                </div>
                {shown.length === 0 ? (
                  <p className="m-0 px-5 py-6 text-[16px] text-o-ink-2">{t('none')}</p>
                ) : (
                  shown.map((event) => {
                    const amount = amountView(event);
                    return (
                      <div
                        key={event.id}
                        role="row"
                        className={cx(
                          grid,
                          'items-start border-b border-o-divider py-3.5 text-[16px] last:border-b-0',
                        )}
                      >
                        <span role="cell" className="text-o-ink-2">
                          {fmt.clock(event.at)}
                        </span>
                        <span role="cell" className={cx(phone && 'text-end text-o-ink-2')}>
                          {event.by.name}
                        </span>
                        <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                          <b>{event.title}</b>
                          {event.detail ? (
                            <span className="text-o-ink-2">{event.detail}</span>
                          ) : null}
                        </span>
                        <span
                          role="cell"
                          className={cx(
                            'text-end',
                            phone && 'max-w-[120px]',
                            amount.bold && 'font-bold',
                            TONE[amount.tone],
                          )}
                        >
                          {amount.note
                            ? t(amount.note === 'waiting' ? 'waitingAmount' : 'notCharged', {
                                amount: amount.text,
                              })
                            : amount.text}
                        </span>
                      </div>
                    );
                  })
                )}
              </section>

              <section
                aria-label={t('alertsLabel')}
                className="flex flex-wrap items-center gap-4 rounded-[18px] border border-o-line bg-o-card px-[22px] py-[18px]"
              >
                <span className="min-w-0 flex-[1_1_360px] text-[16px] text-o-ink-2">
                  {t('alerts')}
                </span>
                <Link
                  to="/settings"
                  className="-my-3 flex min-h-touch-owner items-center text-[16px] font-semibold text-o-green underline"
                >
                  {t('changeAlerts')}
                </Link>
              </section>
            </>
          );
        }}
      </QueryPage>
    </div>
  );
}
