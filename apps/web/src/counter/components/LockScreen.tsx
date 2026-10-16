import { summarizeTables, type WorkerSession } from '@stockers/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isTooManyTries } from '@/lib/api-client';
import { clock } from '@/lib/clock';
import { Keypad } from '@/ui/Keypad';
import { PinDots } from '@/ui/PinDots';
import { cx } from '@/ui/cx';
import { useDialog } from '@/ui/use-dialog';
import { counterKeys, useBoard, useUnlock } from '../api';
import { useLockStore } from '../session/lock-store';
import { useSwitchWorker } from '../session/use-leave-session';
import { BigClock } from './BigClock';
import { Brand } from './Brand';
import { RichText } from './RichText';

const PIN_LENGTH = 4;

/** One pill of "Tables right now". The marker is a dot, or a small red card for tables past 30 minutes. */
function Pill({
  tone,
  card = false,
  children,
}: {
  tone: 'play' | 'free' | 'ooo';
  card?: boolean;
  children: string;
}) {
  return (
    <span
      className={cx(
        'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[18px]',
        tone === 'play' && 'bg-c-danger-bg',
        tone === 'free' && 'bg-c-pill-free-bg',
        tone === 'ooo' && 'bg-c-pill-ooo-bg',
      )}
    >
      {card ? (
        <span aria-hidden="true" className="h-3.5 w-2.5 -rotate-12 rounded-[2px] bg-s-play" />
      ) : (
        <span
          aria-hidden="true"
          className={cx(
            'h-3 w-3 rounded-full',
            tone === 'play' && 'bg-s-play',
            tone === 'free' && 'bg-s-free',
            tone === 'ooo' && 'bg-s-ooo',
          )}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Screen 34. After 5 minutes without a touch, or when the worker taps Lock, this covers the whole screen.
 * Games keep running underneath. The signed-in worker enters his PIN again; "Switch worker" lets the other
 * worker sign in. Escape does nothing here: a lock that Escape could close would be no lock.
 */
export function LockScreen({ session }: { session: WorkerSession }) {
  const { t } = useTranslation('lock');
  const { t: tc } = useTranslation();
  const queryClient = useQueryClient();
  const unlock = useLockStore((state) => state.unlock);
  const unlockCall = useUnlock();
  const switchWorker = useSwitchWorker();
  const board = useBoard('all');
  const titleId = useId();
  const dialog = useDialog<HTMLDivElement>(undefined);

  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [shakes, setShakes] = useState(0);
  const [waiting, setWaiting] = useState(false);

  const summary = board.data ? summarizeTables(board.data.tables, clock.now()) : null;
  const blocked = unlockCall.isPending || waiting;

  function onDigit(digit: string) {
    if (blocked || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setMessage(null);
    setPin(next);
    if (next.length < PIN_LENGTH) return;
    unlockCall.mutate(
      { pin: next },
      {
        onSuccess: (fresh) => {
          queryClient.setQueryData(counterKeys.me, fresh);
          unlock();
        },
        onError: (error) => {
          setPin('');
          if (error.code === 'WRONG_PIN') {
            setMessage(tc('pin.wrong'));
            setShakes((count) => count + 1);
          } else if (isTooManyTries(error)) {
            setMessage(tc('pin.tooMany'));
            setWaiting(true);
            setTimeout(() => {
              setWaiting(false);
              setMessage(null);
            }, error.details.retryAfterSec * 1000);
          } else if (error.status === 401) {
            // His time is over (or he was signed out): the guard sends him to the sign-in page.
            void queryClient.invalidateQueries({ queryKey: counterKeys.me });
          } else {
            setMessage(error.message);
          }
        },
      },
    );
  }

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-app="counter"
      className="screen-text fixed inset-0 z-50 flex flex-wrap overflow-auto bg-c-header font-body text-c-text outline-none"
    >
      <section className="flex min-w-0 flex-[1_1_560px] flex-col justify-center gap-7 px-14 py-12">
        <Brand look="lock" />
        <BigClock look="lock" />
        {summary ? (
          <div className="flex flex-col gap-2.5">
            <span className="text-[18px] text-c-text-2">{t('tablesNow')}</span>
            <div className="flex flex-wrap gap-2.5">
              {summary.playing > 0 ? (
                <Pill tone="play">{t('playing', { n: summary.playing })}</Pill>
              ) : null}
              {summary.overLimit > 0 ? (
                <Pill tone="play" card>
                  {/* Games have their own limits: one limit is named, several are "over the limit". */}
                  {summary.overLimitMinutes.length === 1
                    ? t('overLimit', { n: summary.overLimit, limit: summary.overLimitMinutes[0] })
                    : t('overMixed', { n: summary.overLimit })}
                </Pill>
              ) : null}
              {summary.free > 0 ? <Pill tone="free">{t('free', { n: summary.free })}</Pill> : null}
              {summary.outOfOrder > 0 ? (
                <Pill tone="ooo">{t('outOfOrder', { n: summary.outOfOrder })}</Pill>
              ) : null}
            </div>
          </div>
        ) : null}
        <span className="text-[17px] text-c-text-2">{t('note')}</span>
      </section>

      <section className="flex min-w-0 flex-[1_1_480px] flex-col items-center justify-center gap-[22px] bg-c-page px-8 py-10">
        <div className="flex items-center gap-3">
          <Lock aria-hidden="true" size={28} strokeWidth={2} className="text-c-brass" />
          <h1
            id={titleId}
            tabIndex={-1}
            data-autofocus
            className="m-0 text-[30px] font-bold outline-none"
          >
            <RichText ns="lock" i18nKey="title" values={{ name: session.worker.name }} />
          </h1>
        </div>
        <PinDots key={shakes} filled={pin.length} shake={shakes > 0} />
        <div className="relative w-full max-w-[380px]">
          <Keypad
            keys="lock"
            onDigit={onDigit}
            onDelete={() => !blocked && setPin((digits) => digits.slice(0, -1))}
            onSwitch={() => void switchWorker()}
          />
          {/* Under the keypad and out of the layout, so a message never moves the keys. */}
          <p
            aria-live="polite"
            className="absolute inset-x-0 top-full m-0 mt-4 text-center text-[18px] text-c-danger-ink"
          >
            {message}
          </p>
        </div>
      </section>
    </div>
  );
}
