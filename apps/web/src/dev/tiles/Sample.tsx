import { useTranslation } from 'react-i18next';
import { GameTile, TileActionButton } from '@/tiles';
import { TimerText } from '@/ui/TimerText';
import type { TileSample } from './sample-types';

const BASE_START = Date.UTC(2026, 9, 3, 15, 0, 0);

/** "18:42" or "1:12:05" as a timer that does not tick, so the page and its screenshots do not change. */
function FrozenTimer({
  text,
  yellow,
  redCard,
}: {
  text: string;
  yellow?: boolean;
  redCard: boolean;
}) {
  const parts = text.split(':').map(Number);
  const seconds =
    parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  return (
    <TimerText
      startedAt={new Date(BASE_START).toISOString()}
      pausedAt={new Date(BASE_START + seconds * 1000).toISOString()}
      // The red card is for a frame past 30 minutes. A Century or a room runs longer and stays plain (screen 3).
      variant={redCard ? 'redCard' : 'plain'}
      className={yellow ? 'text-tile-frozen' : undefined}
    />
  );
}

/** One sample tile of the gallery or the games preview: the approved words, with a frozen timer. */
export function Sample({ sample, className }: { sample: TileSample; className?: string }) {
  const { t } = useTranslation('tiles');
  const { timer, frozenTimer, resume, id: _id, ...rest } = sample;
  void _id;
  return (
    <GameTile
      {...rest}
      className={className}
      as={resume ? 'div' : 'button'}
      timer={
        timer ? (
          <FrozenTimer text={timer} yellow={frozenTimer} redCard={sample.status === 'over30'} />
        ) : undefined
      }
      trailing={
        resume ? (
          <TileActionButton>{resume === 'Resume' ? t('chrome.resume') : resume}</TileActionButton>
        ) : undefined
      }
    />
  );
}
