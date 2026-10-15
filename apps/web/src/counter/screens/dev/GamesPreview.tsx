import { boardTabs, SNOOKER_TAB } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sample } from '@/dev/tiles/Sample';
import { SCREEN_5 } from '@/dev/tiles/samples-screens';
import '@/dev/tiles/tiles-i18n';
import { useBoard } from '../../api';
import { CategoryTabs } from '../../components/CategoryTabs';
import { LookBanner } from '../../components/InfoBanner';
import { TileGrid, type GridKind } from '../../components/TileGrid';

const SECTIONS: readonly GridKind[] = ['pool', 'carrom', 'foosball', 'ludo', 'playstation'];

/**
 * Screen 5, `/dev/games-preview` (development only): how pool, carrom, foosball, ludo and PlayStation will look once
 * an owner sets prices. The prices and names are the examples on the screen; the tiles are the real ones, with frozen
 * timers, so the page can be compared with the PNG. The real boards are `/board/pool`, `/board/carrom` and so on.
 */
export default function GamesPreview() {
  const { t } = useTranslation('board');
  const { t: tp } = useTranslation('preview');
  const navigate = useNavigate();
  const board = useBoard();

  return (
    <>
      <CategoryTabs
        tabs={boardTabs(board.data?.categories ?? [])}
        selectedId={null}
        onSelect={(id) => navigate(id === SNOOKER_TAB ? '/' : `/board/${id}`)}
      />
      <main className="flex flex-1 flex-col gap-[26px] px-6 pb-[26px] pt-3.5">
        <LookBanner lead={tp('lead')}>{tp('text')}</LookBanner>
        {SECTIONS.map((kind) => {
          const samples = SCREEN_5.filter((sample) => sample.kind === kind);
          return (
            <div key={kind} className="flex flex-col gap-3.5">
              <div className="flex items-baseline gap-3.5">
                <h2 className="m-0 text-[22px] font-bold">{t(`tabs.${kind}`)}</h2>
                <span className="text-[15px] text-c-text-2">
                  {tp(`count.${kind}`, { n: samples.length })}
                </span>
              </div>
              <TileGrid kind={kind} label={t(`tabs.${kind}`)}>
                {samples.map((sample) => (
                  <Sample key={sample.id} sample={sample} />
                ))}
              </TileGrid>
            </div>
          );
        })}
      </main>
    </>
  );
}
