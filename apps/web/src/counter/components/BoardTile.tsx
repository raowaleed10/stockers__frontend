import {
  chargeForGame,
  doublePrice,
  formatRs,
  sessionStanding,
  tableStatus,
  type BoardCategory,
  type BoardTable,
  type FormatLang,
  type PlayerName,
  type TableKind,
} from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNow } from '@/lib/clock';
import { useFormat } from '@/lib/use-format';
import { GameTile, type TileProps } from '@/tiles';
import { TimerText } from '@/ui/TimerText';

const MINUTE = 60_000;

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export interface BoardTileProps {
  table: BoardTable;
  /** Its category: the Century rate and the room minimum for the hint on a free table. */
  category?: BoardCategory;
  /** Names of everyone on a table (`BoardResponse.players`). */
  players: Record<string, PlayerName>;
  /** The size the page gives this tile, for example `flex-[1_1_300px] min-w-0`. */
  className?: string;
}

/**
 * One table of the live board (screens 3 to 6): a `BoardTable` turned into the words and numbers of a tile. It reads
 * the clock itself, so only this tile re-renders each second: the timer ticks, the amount of a Century or a room
 * grows, and a frame turns into the red card at 30:00 without a reload. Pressing it goes to the screen for what
 * can be done now; a table that is out of order or has no price does nothing, and says why on the tile.
 */
export function BoardTile({ table, category, players, className }: BoardTileProps) {
  const { t, i18n } = useTranslation('board');
  const lang: FormatLang = i18n.language === 'ur' ? 'ur' : 'en';
  const format = useFormat();
  const navigate = useNavigate();
  const now = useNow(1000);

  const status = tableStatus(table, now);
  const { game } = table;
  const name = (id: string | undefined) => (id ? (players[id]?.name ?? '') : '');
  const money = (value: number) => formatRs(value, lang);

  const kind: TableKind = table.kind;
  const priceLabel =
    table.price === null
      ? t('price.none')
      : kind === 'snooker'
        ? t('price.frame', { price: money(table.price) })
        : kind === 'room'
          ? t('price.hour', { price: money(table.price) })
          : t('price.game', { price: money(table.price) });

  const props: TileProps = {
    status,
    number: table.number,
    label: [t(`kind.${kind}`), priceLabel],
    ariaLabel: t('named', {
      name: t(`nameOf.${kind}`, { number: table.number.replace(/^R/i, '') }),
      state: t(`state.${status}`),
    }),
    className,
  };

  if (status === 'noPrice') {
    props.lockReason = t('locked');
  } else if (status === 'outOfOrder' && table.outOfOrder) {
    props.note = {
      title: table.outOfOrder.note,
      detail: t('outOfOrder.marked', {
        name: firstName(table.outOfOrder.by.name),
        time: format.clock(table.outOfOrder.at),
      }),
    };
  } else if (game) {
    const paused = game.pausedAt !== undefined;
    const pausedMinutes = paused ? Math.floor((now - Date.parse(game.pausedAt ?? '')) / MINUTE) : 0;
    const pausedWords =
      pausedMinutes >= 1 ? t('detail.pausedAgo', { n: pausedMinutes }) : t('detail.paused');

    // The two sides of a double are written with first names, as screen 3 does ("Kamran, Faisal vs Imran, Naveed").
    const side = (ids: string[]) => ids.map((id) => firstName(name(id))).join(', ');
    const pair = (): TileProps['players'] =>
      game.sides
        ? { a: side(game.sides[0]), b: side(game.sides[1]) }
        : { a: name(game.playerIds?.[0]), b: name(game.playerIds?.[1]) };

    switch (game.type) {
      case 'single': {
        const standing = sessionStanding(game, table.session, now);
        const frameWords = standing
          ? standing.leader
            ? t('detail.leads', {
                n: standing.frameNo,
                name: firstName(name(standing.leader.playerId)),
                a: standing.leader.wins,
                b: standing.leader.otherWins,
              })
            : t('detail.frame', { n: standing.frameNo })
          : undefined;
        props.gameLine = { main: t('game.single'), detail: paused ? pausedWords : frameWords };
        props.players = pair();
        break;
      }
      case 'double':
        props.gameLine = { main: t('game.double'), detail: paused ? pausedWords : undefined };
        props.players = pair();
        break;
      case 'game':
        props.gameLine = {
          main: game.sides ? t('game.gameDoubles') : t('game.gameSingle'),
          detail: paused ? pausedWords : undefined,
        };
        props.players = pair();
        break;
      case 'century':
        props.gameLine = {
          main: t('game.century'),
          detail: t('detail.centuryRate', { price: money(game.price) }),
        };
        props.players = { a: name(game.underPlayerId), under: true };
        break;
      case 'room':
        props.gameLine = { main: t('game.room') };
        props.players = { a: name(game.underPlayerId), under: true };
        break;
    }
    // The red card is for a frame past 30 minutes: the status says so, and the timer follows it.
    props.timer = (
      <TimerText
        startedAt={game.startedAt}
        pausedMs={game.pausedMs}
        pausedAt={game.pausedAt}
        variant={status === 'over30' ? 'redCard' : 'plain'}
      />
    );
    props.amount = chargeForGame(game, now);
  } else if (status === 'free') {
    if (kind === 'snooker') {
      props.cta = {
        title: t('cta.startGame'),
        hint:
          category?.centuryRate !== undefined && table.price !== null
            ? t('cta.snookerHint', {
                double: money(doublePrice(table.price)),
                rate: money(category.centuryRate),
              })
            : undefined,
      };
    } else if (kind === 'room') {
      props.cta = {
        title: t('cta.startRoom'),
        hint:
          category?.minMinutes !== undefined
            ? t('cta.roomHint', { n: category.minMinutes / 60 })
            : undefined,
      };
    } else if (kind === 'pool') {
      props.cta = { title: t('cta.startGame'), hint: t('cta.poolHint') };
    } else {
      props.cta = { title: t('cta.start'), hint: t('cta.gameHint') };
    }
  }

  // What a tap does: start on a free table, open what is running. The tile itself ignores a tap when it is out of order.
  if (status === 'free') {
    props.onPress = () =>
      navigate(kind === 'room' ? `/room/${table.id}/start` : `/table/${table.id}/start`);
  } else if (status === 'playing' || status === 'over30' || status === 'paused') {
    props.onPress = () => navigate(`/table/${table.id}`);
  }

  return <GameTile kind={kind} {...props} />;
}
