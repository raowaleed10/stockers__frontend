import type { PublicWorker } from '@stockers/shared';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/lib/use-format';
import { cx } from '@/ui/cx';
import { focusRing } from '@/ui/theme';
import { WorkerAvatar } from './WorkerAvatar';

/** "Who is working?": one card for each worker, with his sign-in time and whether it is his time now. */
export function WorkerCards({
  workers,
  selectedId,
  onSelect,
}: {
  workers: PublicWorker[];
  selectedId: string | null;
  onSelect: (workerId: string) => void;
}) {
  const { t } = useTranslation('signin');
  const { slot } = useFormat();
  return (
    <div className="flex flex-wrap gap-3">
      {workers.map((worker) => {
        const selected = worker.id === selectedId;
        return (
          <button
            key={worker.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(worker.id)}
            className={cx(
              'flex min-h-[112px] min-w-0 flex-[1_1_200px] items-center gap-3.5 rounded-[16px] px-[18px] text-start text-c-text transition-colors duration-150 active:bg-c-raised-2',
              selected ? 'border-2 border-c-brass bg-c-raised' : 'border border-c-line bg-c-panel',
              focusRing.counter,
            )}
          >
            <WorkerAvatar
              workerId={worker.id}
              name={worker.name}
              className="h-[52px] w-[52px] text-[22px]"
            />
            <span className="flex min-w-0 flex-col gap-[3px]">
              <span className="text-[22px] font-bold">{worker.name}</span>
              <span className="text-[15px] text-c-text-2">
                <bdi>{slot(worker.slot)}</bdi>
              </span>
              <span
                className={cx(
                  'inline-flex items-center gap-1.5 text-[14px] font-semibold',
                  worker.canSignInNow ? 'text-c-ok-ink' : 'text-c-text-2',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'h-[9px] w-[9px] rounded-full',
                    worker.canSignInNow ? 'bg-s-free' : 'bg-c-line-3',
                  )}
                />
                {worker.canSignInNow ? t('yourTimeNow') : t('notNow')}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
