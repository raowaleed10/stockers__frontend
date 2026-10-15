import { cx } from '@/ui/cx';

// Two colours as drawn: Zain's green and Shabir's brown. A worker keeps his colour because it comes from his id.
const TONES = ['bg-c-ok-line', 'bg-c-line-2'] as const;

function toneOf(workerId: string): string {
  let hash = 0;
  for (const char of workerId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/** The round letter of a worker: "Z" for Zain. Decoration only; the name is always written next to it. */
export function WorkerAvatar({
  workerId,
  name,
  className,
}: {
  workerId: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        toneOf(workerId),
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
