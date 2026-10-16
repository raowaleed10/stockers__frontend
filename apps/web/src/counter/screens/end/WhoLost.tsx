import { elapsed, isGameOverLimit, MINUTE_MS, toClubIso } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { CounterDialog } from '@/ui/CounterDialog';
import { MoneyText } from '@/ui/MoneyText';
import { PersonCard } from '@/ui/PersonCard';
import { useEndGame, useGame, usePlayers } from '../../api';
import { RichText } from '../../components/RichText';
import { tablePath } from '../../components/table-paths';
import { KeepButton, NobodyPaysButton } from '../../end/buttons';
import { useEndDraft } from '../../end/draft';
import { useNightCard } from '../../end/night';
import { useCloseTable } from '../../start/use-close';
import type { EndScreenProps } from './EndGame';

/** The masked number the counter has (`0300 •••• 1964`), or its last digits if that is all there is. */
const showPhoneOf = (player: { phone?: string; phoneTail?: string } | undefined) =>
  player?.phone ?? player?.phoneTail ?? '';

/**
 * Screen 17, `/table/:id/end`: "Who lost this frame?". Two big cards with what each player did tonight and what he
 * owes; tapping the loser charges the frame (the table price goes on his bill and the winner is recorded). Past the
 * game's own time limit the tap goes on to "Charge double?" (19) first. "Nobody pays" is the Discard of the stop screen,
 * which asks for a reason. A pool or other per-game table asks the same with "game" in the words.
 */
export function WhoLost({ table, board, game }: EndScreenProps) {
  const { t } = useTranslation('end');
  const { t: tBoard } = useTranslation('board');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const format = useFormat();
  const close = useCloseTable();
  const now = useNow(1000);
  const end = useEndGame();
  const draft = useEndDraft();
  const view = useGame(game.id);
  const everyone = usePlayers();
  const night = useNightCard(board, view.data?.tonight, everyone.data);

  const isGame = game.type === 'game';
  const name = tBoard(`nameOf.${table.kind}`, { number: table.number.replace(/^R/i, '') });
  const elapsedMs = elapsed(game.startedAt, now, game.pausedMs, game.pausedAt);
  const minutes = Math.round(elapsedMs / MINUTE_MS);
  const players = game.playerIds ?? [];
  const nameOf = (id: string) => board.players[id]?.name ?? id;

  // Wait for the numbers on the cards, so "No frames yet tonight" never shows for a moment before the real words.
  if (view.isPending || everyone.isPending) return null;

  const choose = (loserId: string) => {
    if (isGameOverLimit(game, elapsedMs)) {
      draft.set({ gameId: game.id, loserIds: [loserId] });
      navigate(tablePath(pathname, table.id, '/end/overtime'));
      return;
    }
    end.mutate(
      { id: game.id, request: { loserIds: [loserId] } },
      {
        onSuccess: () => {
          if (isGame) close();
          else navigate(tablePath(pathname, table.id, '/next'), { state: { gameId: game.id } });
        },
      },
    );
  };

  const kickerKey = isGame ? 'who.kickerGame' : game.frameNo ? 'who.kicker' : 'who.kickerPlain';

  return (
    <CounterDialog
      width={1106}
      titleSize={36}
      headerAlign="end"
      kickerPlain
      showClose={false}
      kicker={
        <RichText
          ns="end"
          i18nKey={kickerKey}
          values={{
            name,
            n: game.frameNo ?? 1,
            time: format.clock(toClubIso(now)),
            minutes,
          }}
        />
      }
      title={isGame ? t('who.titleGame') : t('who.title')}
      aside={<MoneyText value={game.price} size="big" className="text-c-text" />}
      onClose={close}
      actions={
        <>
          <KeepButton icon onClick={close}>
            {t('keep')}
          </KeepButton>
          <div className="flex-1" />
          <NobodyPaysButton onClick={() => navigate(tablePath(pathname, table.id, '/stop'))}>
            {t('who.nobody')}
          </NobodyPaysButton>
        </>
      }
    >
      <div className="flex flex-wrap gap-[18px]">
        {players.map((id) => {
          const card = night(id);
          return (
            <PersonCard
              key={id}
              variant="large"
              className="flex-[1_1_360px]"
              name={nameOf(id)}
              phoneTail={showPhoneOf(everyone.data?.find((player) => player.id === id))}
              note={card.note}
              status={card.status}
              disabled={end.isPending}
              onClick={() => choose(id)}
            />
          );
        })}
      </div>
      <p className="m-0 text-center text-[17px] text-c-text-2">
        {isGame ? t('who.hintGame') : t('who.hint')}
      </p>
      {end.error ? (
        <p role="alert" className="m-0 text-center text-[17px] text-c-danger-ink">
          {end.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
