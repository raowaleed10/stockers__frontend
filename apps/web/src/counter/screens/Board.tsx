import {
  boardTabs,
  SNOOKER_TAB,
  type BoardResponse,
  type BoardTable,
  type TableKind,
} from '@stockers/shared';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useOutlet, useParams } from 'react-router-dom';
import { isApiError } from '@/lib/api-client';
import { Button } from '@/ui/Button';
import { NotFound } from '@/ui/NotFound';
import { useBoard } from '../api';
import { BoardTile } from '../components/BoardTile';
import { CategoryTabs } from '../components/CategoryTabs';
import { InfoCard, PriceBanner } from '../components/InfoBanner';
import { TILE_FLEX, TileGrid, TileRow } from '../components/TileGrid';
import { WaitingPanel } from '../components/WaitingPanel';

type PerGameKind = Exclude<TableKind, 'snooker' | 'room'>;
const isPerGame = (kind: TableKind): kind is PerGameKind => kind !== 'snooker' && kind !== 'room';

/** Snooker tables and rooms with the players still to pay on the end side (screens 3 and 6). */
function SnookerBoard({ data }: { data: BoardResponse }) {
  const { t } = useTranslation('board');
  const navigate = useNavigate();
  return (
    <main className="flex flex-1 flex-wrap items-start gap-5 px-6 pb-5 pt-3.5 rtl:pb-[18px] rtl:pt-3">
      {/* `box-content`: the design's 640 px basis is the width inside the 6 px padding, as its HTML has no reset. */}
      <TileRow label={t('tables')} className="box-content flex-[999_1_640px]">
        {data.tables.map((table) => (
          <BoardTile
            key={table.id}
            table={table}
            category={data.categories.find((c) => c.id === table.categoryId)}
            players={data.players}
            className={TILE_FLEX}
          />
        ))}
      </TileRow>
      <WaitingPanel bills={data.waiting} onOpen={(id) => navigate(`/checkout/${id}`)} />
    </main>
  );
}

/**
 * Pool, foosball, carrom, ludo or PlayStation. With no price on any table (D13) it is screen 4: the banner, the locked
 * tiles and the two cards. Once an owner has set prices it is the grid of screen 5 for that game.
 */
function GameBoard({ data, categoryId }: { data: BoardResponse; categoryId: string }) {
  const { t } = useTranslation('board');
  const category = data.categories.find((c) => c.id === categoryId);
  const tables: BoardTable[] = data.tables;
  const kind = category?.kind ?? tables[0]?.kind;
  const unpriced = tables.length > 0 && tables.every((table) => table.price === null);
  const snookerTables = data.categories.find((c) => c.kind === 'snooker')?.total;

  const tiles = tables.map((table) => (
    <BoardTile
      key={table.id}
      table={table}
      category={category}
      players={data.players}
      className={unpriced ? TILE_FLEX : undefined}
    />
  ));
  const label = kind && isPerGame(kind) ? t(`noPrice.games.${kind}`) : (category?.name ?? '');

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 pb-5 pt-3.5">
      {unpriced && kind && isPerGame(kind) ? (
        <>
          <PriceBanner title={t('noPrice.title', { games: t(`noPrice.games.${kind}`) })}>
            {t('noPrice.text', { things: t(`noPrice.things.${kind}`) })}
          </PriceBanner>
          <TileRow label={label}>{tiles}</TileRow>
          <section aria-label={t('cards.label')} className="mt-1.5 flex flex-wrap gap-3.5">
            <InfoCard title={t('cards.priceTitle')}>{t('cards.priceText')}</InfoCard>
            {snookerTables === undefined ? null : (
              <InfoCard title={t('cards.centuryTitle')}>
                {t('cards.centuryText', { last: snookerTables })}
              </InfoCard>
            )}
          </section>
        </>
      ) : kind && isPerGame(kind) ? (
        <TileGrid kind={kind} label={label}>
          {tiles}
        </TileGrid>
      ) : (
        <TileRow label={label}>{tiles}</TileRow>
      )}
    </main>
  );
}

/**
 * The live board (screens 3 to 6) at `/` and `/board/:category`. It is the layout route of everything that opens
 * over it: its `<Outlet/>` sits last inside a `relative` box that fills the area between the top bar and the action
 * bar, so the bell's panel at `/alerts` (and later the table panels) is drawn over the finished board. While a panel
 * is open the board behind it is `inert`, so touch, keyboard and screen readers stay on the panel.
 */
export function Board() {
  const { t } = useTranslation('board');
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const selected = category ?? SNOOKER_TAB;
  // `/` is the snooker tab; it shares its query with the frame, so the board is asked for once.
  const board = useBoard(category);
  const panel = useOutlet();
  const behind = useRef<HTMLDivElement>(null);

  useEffect(() => {
    behind.current?.toggleAttribute('inert', panel !== null);
  }, [panel]);

  if (board.isError && isApiError(board.error) && board.error.code === 'NOT_FOUND') {
    return <NotFound />;
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div
        ref={behind}
        aria-hidden={panel !== null ? true : undefined}
        className="flex min-w-0 flex-1 flex-col"
      >
        {board.isPending ? (
          <p role="status" className="m-0 p-6 text-[18px] text-c-text-2">
            {t('loading')}
          </p>
        ) : board.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 p-6">
            <p className="m-0 text-[18px] text-c-danger-ink">{t('loadFailed')}</p>
            <Button theme="counter" variant="outline" onClick={() => void board.refetch()}>
              {t('retry')}
            </Button>
          </div>
        ) : (
          <>
            <CategoryTabs
              tabs={boardTabs(board.data.categories)}
              selectedId={selected}
              onSelect={(id) => navigate(id === SNOOKER_TAB ? '/' : `/board/${id}`)}
            />
            {selected === SNOOKER_TAB ? (
              <SnookerBoard data={board.data} />
            ) : (
              <GameBoard data={board.data} categoryId={selected} />
            )}
          </>
        )}
      </div>
      <Outlet />
    </div>
  );
}
