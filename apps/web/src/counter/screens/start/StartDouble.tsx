import { doublePrice, formatRs, type ChangeTypeRequest } from '@stockers/shared';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { useChangeGameType, useStartGame } from '../../api';
import { boardOfTableScreen, newPlayerPath, tablePath } from '../../components/table-paths';
import { pickedIds, useStartDraft, type SideIndex } from '../../start/draft';
import { PlayerSearch } from '../../start/PlayerSearch';
import { PlayerSlot } from '../../start/PlayerSlot';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from './TableGate';

const LETTERS = ['A', 'B'] as const;
const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

/**
 * Screen 9, `/table/:id/start/double`: a double frame, side A against side B with one or two players each. The side
 * with the brass border gets the next player; a full side hands over to the other. A double needs three or four
 * players (D9: two against two, or one against two). In `change` mode it is the same screen for a running game that
 * changes type in its first 5 minutes.
 */
export function StartDouble({ mode = 'start' }: { mode?: 'start' | 'change' }) {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <DoubleStep mode={mode} {...context} />}</TableGate>;
}

function DoubleStep({ table, mode }: TableContext & { mode: 'start' | 'change' }) {
  const { t } = useTranslation('start');
  const { t: tBoard } = useTranslation('board');
  const { lang } = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const draft = useStartDraft();
  const start = useStartGame();
  const change = useChangeGameType();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (mode === 'start') draft.begin(table.id);
    // Opened by its address with another type picked: this screen is a double.
    draft.setKind('double');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, mode]);

  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const back = mode === 'change' ? '/change-type' : '/start';

  if (table.kind !== 'snooker') return <Navigate to={tablePath(pathname, table.id)} replace />;
  const finished = start.isSuccess || change.isSuccess;
  if (!finished && mode === 'start' && table.game) {
    return <Navigate to={tablePath(pathname, table.id)} replace />;
  }
  if (!finished && mode === 'change' && !table.game) {
    return <Navigate to={boardOfTableScreen(pathname)} replace />;
  }
  if (!finished && mode === 'start' && (table.outOfOrder || table.price === null)) {
    return <Navigate to={tablePath(pathname, table.id, '/start')} replace />;
  }
  const price = doublePrice(table.price ?? 0);
  const [sideA, sideB] = draft.sides;
  const total = sideA.length + sideB.length;
  // Three or four players, at least one on each side.
  const ready = sideA.length >= 1 && sideB.length >= 1 && total >= 3;
  const alone = total === 3 ? (sideA.length === 1 ? sideA[0] : sideB[0]) : undefined;
  const picked = pickedIds(draft);
  const activeLetter = LETTERS[draft.side];
  const pending = start.isPending || change.isPending;
  const error = start.error ?? change.error;

  const submit = () => {
    if (!ready) return;
    const request: ChangeTypeRequest = {
      type: 'double',
      sides: [sideA.map((p) => p.id), sideB.map((p) => p.id)],
    };
    const done = () => {
      draft.reset();
      navigate(boardOfTableScreen(pathname));
    };
    if (mode === 'change' && table.game) {
      change.mutate({ id: table.game.id, request }, { onSuccess: done });
    } else {
      start.mutate({ tableId: table.id, ...request }, { onSuccess: done });
    }
  };

  const side = (index: SideIndex) => {
    const players = draft.sides[index];
    const active = draft.side === index;
    return (
      <section
        aria-labelledby={`side-${index}`}
        className={cx(
          'flex min-w-0 flex-[1_1_380px] flex-col gap-2.5 rounded-[20px] bg-c-raised p-[18px]',
          active ? 'border-2 border-c-brass' : 'border border-c-line',
        )}
      >
        <h3 id={`side-${index}`} className="m-0 text-[20px] font-bold">
          <button
            type="button"
            aria-pressed={active}
            onClick={() => draft.setSide(index)}
            className={cx(
              '-my-4 flex min-h-touch items-center rounded-md bg-transparent p-0 text-start text-[20px] font-bold text-c-text',
              focusRing.counter,
            )}
          >
            {t('double.side', { letter: LETTERS[index] })}
          </button>
        </h3>
        {[0, 1].map((slot) => {
          const player = players[slot];
          return (
            <PlayerSlot
              key={slot}
              compact
              player={player}
              empty={slot === 0 ? t('double.addPlayer') : t('double.addSecond')}
              onRemove={player ? () => draft.remove(player.id) : undefined}
            />
          );
        })}
      </section>
    );
  };

  return (
    <CounterDialog
      size="lg"
      title={t('double.title', { name })}
      subtitle={t('double.text', { price: formatRs(price, lang) })}
      onClose={close}
      back={{
        label: t('backToType'),
        onBack: () => navigate(tablePath(pathname, table.id, back)),
      }}
      actions={
        <>
          <div className="flex-1" />
          <Button theme="counter" size="counter-main" onClick={close}>
            {t('cancel')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            className="px-10"
            disabled={!ready || pending}
            onClick={submit}
          >
            {mode === 'change'
              ? t('change.to', { type: t('types.double.title') })
              : t('double.start')}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-stretch gap-4">
        {side(0)}
        <div className="flex items-center justify-center px-1">
          <span className="font-num text-[34px] font-bold text-c-text-2">{t('double.vs')}</span>
        </div>
        {side(1)}
      </div>

      <PlayerSearch
        variant="compact"
        rows={2}
        label={t('double.search', { letter: activeLetter })}
        placeholder={t('double.search', { letter: activeLetter })}
        query={query}
        onQuery={setQuery}
        exclude={picked}
        onPick={(player) => {
          draft.pick(player);
          setQuery('');
        }}
        onAddNew={(typed) => {
          draft.setReturnTo(pathname);
          navigate(newPlayerPath(pathname, table.id), { state: { name: typed } });
        }}
      />

      <div className="flex items-center gap-3.5 rounded-[16px] border border-c-info-line bg-c-info-bg px-[18px] py-3.5">
        <Info aria-hidden="true" size={24} strokeWidth={2} className="shrink-0 text-c-info-ink" />
        <p className="m-0 text-[17px] text-c-info-text">
          {alone
            ? t('double.noteAlone', { name: firstName(alone.name), price: formatRs(price, lang) })
            : t('double.note', { price: formatRs(price, lang) })}
        </p>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
