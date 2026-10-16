import {
  changeTypeMinutesLeft,
  chargeForGame,
  formatRs,
  gameLimit,
  toClubIso,
  type Game,
} from '@stockers/shared';
import {
  ArrowRightLeft,
  Coffee,
  Flag,
  Move,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { MoneyText } from '@/ui/MoneyText';
import { SidePanel } from '@/ui/SidePanel';
import { focusRing } from '@/ui/theme';
import { TimerText } from '@/ui/TimerText';
import { usePauseGame, useResumeGame } from '../../api';
import { RichText } from '../../components/RichText';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useCloseTable } from '../../start/use-close';
import { TableGate, type TableContext } from '../start/TableGate';
import { firstName, whoIsPlaying } from './game-info';

const MINUTE = 60_000;

function PanelButton({
  icon: Icon,
  danger = false,
  disabled,
  onClick,
  children,
}: {
  icon: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-[14px] border bg-c-raised px-2 text-center text-[16px] font-semibold transition-colors duration-150 active:bg-c-raised-2 disabled:cursor-not-allowed disabled:opacity-40',
        danger ? 'border-c-discard-line text-c-danger-ink' : 'border-c-line-2 text-c-text',
        focusRing.counter,
      )}
    >
      <Icon aria-hidden="true" size={24} strokeWidth={2} />
      {children}
    </button>
  );
}

/**
 * Screen 11, `/table/:id`: a table that has a game, in the counter's side panel over the faded board. What the game
 * is, who is playing, the timer and the amount so far, the score of the session, "End frame", and Pause, Move table,
 * Replace player, Canteen item, Damage charge and Discard frame. In the first 5 minutes a "Change game type" button
 * is added (no PNG draws it); after that the dashed note says it was open until a time.
 */
export function TablePanel() {
  const { id } = useParams<{ id: string }>();
  return <TableGate tableId={id}>{(context) => <PanelStep {...context} />}</TableGate>;
}

function PanelStep({ table, board }: TableContext) {
  const { t } = useTranslation('table');
  const { t: tBoard } = useTranslation('board');
  const format = useFormat();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = useCloseTable();
  const now = useNow(1000);
  const pause = usePauseGame();
  const resume = useResumeGame();
  const game: Game | undefined = table.game;

  // A table with no game (it was just ended, or never started) has no panel: back to the board it opened over.
  if (!game) return <Navigate to={boardOfTableScreen(pathname)} replace />;

  const nameOf = (playerId: string) => board.players[playerId]?.name ?? playerId;
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const type = game.type;
  const paused = game.status === 'paused';
  const limit = gameLimit(game);
  const money = (value: number) => formatRs(value, format.lang);
  const go = (rest: string) => () => navigate(tablePath(pathname, table.id, rest));
  const error = pause.error ?? resume.error;

  // The session score: only frames that have ended count, and the one ahead is named first ("Ali 2 – 0 Bilal").
  const session = table.session;
  const frames = (session?.frames ?? []).filter((frame) => Date.parse(frame.endedAt) <= now);
  const standing = (() => {
    const [one, two] = session?.playerIds ?? [];
    if (!one || !two || frames.length === 0) return undefined;
    const wins = (playerId: string) => frames.filter((f) => !f.loserIds.includes(playerId)).length;
    const [ahead, behind] = wins(one) >= wins(two) ? [one, two] : [two, one];
    return `${firstName(nameOf(ahead))} ${wins(ahead)} – ${wins(behind)} ${firstName(nameOf(behind))}`;
  })();

  const withinChange = table.kind === 'snooker' && changeTypeMinutesLeft(game.startedAt, now) > 0;
  const changeClosed = table.kind === 'snooker' && !withinChange;
  const changeUntil = format.clock(toClubIso(Date.parse(game.startedAt) + 5 * MINUTE));

  const who = whoIsPlaying(game, nameOf, t('panel.vs'));
  const discardWord = type === 'single' || type === 'double' ? 'frame' : 'game';

  return (
    <>
      {/* The board stays behind, dimmed, as it does behind the bell's panel and in screen 11. */}
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-[var(--ov-k50)]" />
      <div
        className="absolute inset-y-0 end-0 z-20 flex w-[560px] max-w-full"
        data-testid="table-panel"
        data-side-panel=""
      >
        <SidePanel
          lead={table.number}
          title={t(`panel.title.${type}`, { name })}
          subtitle={
            <span
              className={cx(
                'inline-flex items-center gap-2',
                paused ? 'text-s-pause' : 'text-c-danger-ink',
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'h-3.5 w-3.5 rounded-full shadow-dot',
                  paused ? 'bg-s-pause' : 'bg-s-play',
                )}
              />
              <RichText
                ns="table"
                i18nKey={paused ? 'panel.pausedSince' : 'panel.playingSince'}
                values={{
                  time: format.clock(paused && game.pausedAt ? game.pausedAt : game.startedAt),
                }}
              />
            </span>
          }
          onClose={close}
          className="h-full overflow-y-auto"
        >
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-c-info-line bg-c-info-bg px-5 py-[18px]">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[16px] text-c-info-ink">
                {type === 'single'
                  ? t('panel.frameOf', { n: game.frameNo ?? 1 })
                  : t(`panel.kind.${type}`, { price: money(game.price) })}
              </span>
              <span className="text-[21px] font-bold">
                {type === 'century' || type === 'room' ? (
                  <RichText ns="table" i18nKey="panel.under" values={{ name: who }} />
                ) : (
                  <bdi>{who}</bdi>
                )}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <TimerText
                startedAt={game.startedAt}
                pausedMs={game.pausedMs}
                pausedAt={game.pausedAt}
                variant={limit === undefined ? 'plain' : 'auto'}
                limitMinutes={limit}
                size="inherit"
                className="text-[54px] leading-none"
              />
              <MoneyText value={chargeForGame(game, now)} className="text-[17px] font-bold" />
            </div>
          </div>

          {standing ? (
            <section aria-label={t('panel.score')} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-0 text-[18px] font-bold">{t('panel.score')}</h3>
                <span className="font-num text-[28px] font-bold">
                  <bdi>{standing}</bdi>
                </span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {frames.map((frame) => (
                  <li
                    key={frame.no}
                    className="flex justify-between gap-3 rounded-[12px] bg-c-raised px-3.5 py-2.5 text-[16px] text-c-text-3"
                  >
                    <span>
                      <RichText
                        ns="table"
                        i18nKey="panel.frameRow"
                        values={{
                          n: frame.no,
                          time: format.clock(frame.startedAt),
                          min: Math.round(
                            (Date.parse(frame.endedAt) - Date.parse(frame.startedAt)) / MINUTE,
                          ),
                        }}
                      />
                    </span>
                    <span>
                      <RichText
                        ns="table"
                        i18nKey="panel.lost"
                        values={{
                          name: firstName(nameOf(frame.loserIds[0] ?? '')),
                          amount: money(frame.amount),
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <button
            type="button"
            onClick={go('/end')}
            className={cx(
              'flex min-h-[76px] items-center justify-center gap-3 rounded-[16px] bg-c-brass text-[22px] font-bold text-c-brass-ink transition-colors duration-150 active:bg-c-brass-press',
              focusRing.counter,
            )}
          >
            <Flag aria-hidden="true" size={26} strokeWidth={2.2} />
            {t(`panel.end.${type}`)}
          </button>

          <div className="grid grid-cols-3 gap-2.5">
            {paused ? (
              <PanelButton
                icon={Play}
                disabled={resume.isPending}
                onClick={() => resume.mutate(game.id)}
              >
                {t('panel.resume')}
              </PanelButton>
            ) : (
              <PanelButton
                icon={Pause}
                disabled={pause.isPending}
                onClick={() => pause.mutate(game.id)}
              >
                {t('panel.pause')}
              </PanelButton>
            )}
            <PanelButton icon={Move} onClick={go('/move')}>
              {t('panel.move')}
            </PanelButton>
            <PanelButton icon={ArrowRightLeft} onClick={go('/move')}>
              {t('panel.replace')}
            </PanelButton>
            <PanelButton icon={Coffee} onClick={() => navigate('/canteen')}>
              {t('panel.canteen')}
            </PanelButton>
            <PanelButton icon={Wrench} onClick={go('/damage')}>
              {t('panel.damage')}
            </PanelButton>
            <PanelButton icon={Trash2} danger onClick={go('/stop')}>
              {t(`panel.discard.${discardWord}`)}
            </PanelButton>
          </div>

          {error ? (
            <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
              {error.message}
            </p>
          ) : null}

          {withinChange ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[16px] text-c-brass">
                {t('panel.changeLeft', { count: changeTypeMinutesLeft(game.startedAt, now) })}
              </span>
              <Button theme="counter" variant="outline" onClick={go('/change-type')}>
                {t('panel.changeType')}
              </Button>
            </div>
          ) : null}
          {changeClosed ? (
            <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-c-line-2 bg-c-note-bg px-4 py-3.5">
              <RefreshCw
                aria-hidden="true"
                size={22}
                strokeWidth={2}
                className="shrink-0 text-c-note-icon"
              />
              <span className="text-[16px] text-c-note-text">
                <RichText ns="table" i18nKey="panel.changeClosed" values={{ time: changeUntil }} />
              </span>
            </div>
          ) : null}
        </SidePanel>
      </div>
    </>
  );
}
