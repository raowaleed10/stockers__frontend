import { toClubIso, type PublicWorker, type Slot } from '@stockers/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isNotYourTime, isTooManyTries } from '@/lib/api-client';
import { clock } from '@/lib/clock';
import { Keypad } from '@/ui/Keypad';
import { PinDots } from '@/ui/PinDots';
import { cx } from '@/ui/cx';
import { counterKeys, usePublicWorkers, useSignIn } from '../api';
import { ClockPanel } from '../components/ClockPanel';
import { CounterLanguageSwitch } from '../components/CounterLanguageSwitch';
import { NotYourTimeAlert } from '../components/NotYourTimeAlert';
import { RichText } from '../components/RichText';
import { WorkerCards } from '../components/WorkerCards';
import { useLockStore } from '../session/lock-store';

const PIN_LENGTH = 4;

type Problem =
  | { kind: 'notYourTime'; slot: Slot; now: string; fromServer: boolean }
  | { kind: 'wrongPin' }
  | { kind: 'tooMany'; waitMs: number }
  | { kind: 'other'; message: string };

/**
 * Screens 1 and 2: who is working, then his 4-digit PIN. The server decides if it is his time and if the PIN
 * is right (docs/08 §3). There is no owner option here, on purpose.
 */
export function SignIn() {
  const { t } = useTranslation('signin');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unlock = useLockStore((state) => state.unlock);
  const [params, setParams] = useSearchParams();
  const workers = usePublicWorkers();
  const signIn = useSignIn();

  // `chosen` is null until he touches the cards. Until then a deep link (below) may have picked for him.
  const [chosen, setChosen] = useState<{ id: string | null } | null>(null);
  const [pin, setPin] = useState('');
  const [attempt, setAttempt] = useState<Problem | null>(null);
  const [shakes, setShakes] = useState(0);

  // `/sign-in?worker=shabir` is a deep link: it picks that worker. If it is not his time it shows screen 2
  // from the public slot and the clock, without a sign-in call (so nothing is written down as an attempt).
  const linkedId = params.get('worker');
  const linkedWorker = chosen === null ? workers.data?.find((w) => w.id === linkedId) : undefined;
  const linkedProblem: Problem | null =
    linkedWorker && !linkedWorker.canSignInNow
      ? {
          kind: 'notYourTime',
          slot: linkedWorker.slot,
          now: toClubIso(clock.now()),
          fromServer: false,
        }
      : null;

  const selectedId = chosen ? chosen.id : (linkedWorker?.id ?? null);
  const selected: PublicWorker | undefined = workers.data?.find((w) => w.id === selectedId);
  const problem = attempt ?? linkedProblem;

  // "Wait 5 minutes" clears itself when the wait is over.
  const waitMs = attempt?.kind === 'tooMany' ? attempt.waitMs : null;
  useEffect(() => {
    if (waitMs === null) return;
    const id = setTimeout(() => setAttempt(null), waitMs);
    return () => clearTimeout(id);
  }, [waitMs]);

  function select(workerId: string) {
    setChosen({ id: workerId });
    setPin('');
    setAttempt(null);
  }

  function clearSelection() {
    setChosen({ id: null });
    setPin('');
    setAttempt(null);
    if (params.has('worker')) setParams({}, { replace: true });
  }

  function submit(worker: PublicWorker, digits: string) {
    signIn.mutate(
      { workerId: worker.id, pin: digits },
      {
        onSuccess: (session) => {
          // The guard reads this; without it a 401 from before the sign-in would send us straight back.
          queryClient.setQueryData(counterKeys.me, session);
          unlock();
          navigate('/', { replace: true });
        },
        onError: (error) => {
          setPin('');
          if (isNotYourTime(error)) {
            setAttempt({
              kind: 'notYourTime',
              slot: error.details.slot,
              now: error.details.now,
              fromServer: true,
            });
          } else if (error.code === 'WRONG_PIN') {
            setAttempt({ kind: 'wrongPin' });
            setShakes((count) => count + 1);
          } else if (isTooManyTries(error)) {
            setAttempt({ kind: 'tooMany', waitMs: error.details.retryAfterSec * 1000 });
          } else {
            setAttempt({ kind: 'other', message: error.message });
          }
        },
      },
    );
  }

  const blocked = signIn.isPending || problem?.kind === 'tooMany';

  function onDigit(digit: string) {
    if (!selected || blocked || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setAttempt(null);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(selected, next);
  }

  const message =
    problem?.kind === 'wrongPin'
      ? tc('pin.wrong')
      : problem?.kind === 'tooMany'
        ? tc('pin.tooMany')
        : problem?.kind === 'other'
          ? problem.message
          : null;

  return (
    <div
      data-app="counter"
      className="screen-text flex min-h-screen flex-wrap bg-c-page font-body text-c-text"
    >
      <ClockPanel />

      <section className="flex min-w-0 flex-[1_1_560px] flex-col items-center justify-center gap-7 px-8 py-10">
        <div className="flex w-full max-w-[540px] justify-end">
          <CounterLanguageSwitch />
        </div>

        <main className="flex w-full max-w-[540px] flex-col gap-[22px]">
          <h1 className="m-0 text-[34px] font-bold">{t('title')}</h1>

          {workers.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="m-0 text-[18px] text-c-danger-ink">{t('loadFailed')}</p>
              <button
                type="button"
                onClick={() => void workers.refetch()}
                className="min-h-touch rounded-btn border border-c-line-3 px-5 text-[18px] font-semibold text-c-text focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text"
              >
                {t('retry')}
              </button>
            </div>
          ) : (
            <WorkerCards workers={workers.data ?? []} selectedId={selectedId} onSelect={select} />
          )}

          {selected && problem?.kind === 'notYourTime' ? (
            <NotYourTimeAlert
              name={selected.name}
              slot={problem.slot}
              now={problem.now}
              focusOk={problem.fromServer}
              onOk={clearSelection}
            />
          ) : selected ? (
            <div className="flex flex-col items-center gap-[18px] rounded-[20px] border border-c-line bg-c-panel p-6">
              <p
                aria-live="polite"
                className={cx('m-0 text-[18px]', message ? 'text-c-danger-ink' : 'text-c-text-2')}
              >
                {message ?? (
                  <RichText ns="signin" i18nKey="enterPin" values={{ name: selected.name }} />
                )}
              </p>
              <PinDots key={shakes} filled={pin.length} shake={shakes > 0} />
              <Keypad
                onDigit={onDigit}
                onClear={() => !blocked && setPin('')}
                onDelete={() => !blocked && setPin((digits) => digits.slice(0, -1))}
                className="w-full max-w-[380px]"
              />
            </div>
          ) : null}

          <p className="m-0 text-center text-[15px] text-c-text-2">{t('footer')}</p>
        </main>
      </section>
    </div>
  );
}
