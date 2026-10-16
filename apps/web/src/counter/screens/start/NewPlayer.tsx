import { similarPlayers } from '@stockers/shared';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/ui/Button';
import { CounterDialog } from '@/ui/CounterDialog';
import { Keypad } from '@/ui/Keypad';
import { useCreatePlayer, usePlayers } from '../../api';
import { boardOfTableScreen, tablePath } from '../../components/table-paths';
import { useStartDraft } from '../../start/draft';
import { showPhone, toPicked } from '../../start/player-parts';

/** A pakistani mobile number has 11 digits (0300 1234567); the mock accepts 10 or more. */
const PHONE_DIGITS = 11;
const MIN_PHONE_DIGITS = 10;

const titleCase = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .replace(
      /(^|\s)(\p{L})/gu,
      (_all, space: string, letter: string) => space + letter.toUpperCase(),
    );

const FIELD =
  'min-h-[64px] w-full rounded-[14px] border-2 bg-c-page px-[18px] text-c-text outline-none placeholder:text-c-text-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text';

/**
 * Screen 10, `/players/new?for=t2`: "Add a new player". Full name, a phone number typed on the on-screen keypad (or
 * "Skip phone for now", Q18), and a list of saved names that look like it, so nobody gets a second account. The
 * account is made at once (D20) and the flow it came from gets the player back, already picked.
 */
export function NewPlayer() {
  const { t } = useTranslation('start');
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [params] = useSearchParams();
  const forTable = params.get('for');
  const draft = useStartDraft();
  const create = useCreatePlayer();
  const everyone = usePlayers();
  const nameId = useId();
  const phoneId = useId();

  const typedName =
    typeof state === 'object' && state !== null && 'name' in state && typeof state.name === 'string'
      ? state.name
      : '';
  const [name, setName] = useState(() => titleCase(typedName));
  const [digits, setDigits] = useState('');
  // Shown after "Add player" is tapped with a number that is not whole yet (screen 10 draws the button ready).
  const [tried, setTried] = useState(false);

  useEffect(() => {
    // Opened by its address after a reload: the draft is empty, so start one for this table.
    if (forTable) draft.begin(forTable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forTable]);

  const returnTo =
    draft.returnTo ??
    (forTable ? tablePath(pathname, forTable, '/start/players') : boardOfTableScreen(pathname));

  const similar = useMemo(() => similarPlayers(everyone.data ?? [], name), [everyone.data, name]);

  const finish = (player: Parameters<typeof toPicked>[0]) => {
    draft.pick(toPicked(player));
    draft.setReturnTo(null);
    navigate(returnTo, { replace: true });
  };

  const trimmed = name.trim();
  const save = (phone: string | undefined) =>
    create.mutate({ name: trimmed, ...(phone ? { phone } : {}) }, { onSuccess: finish });
  const partial = digits.length > 0 && digits.length < MIN_PHONE_DIGITS;
  const showHint = tried && partial;
  const add = () => {
    if (partial) setTried(true);
    else save(showPhone(digits));
  };
  const cancel = () => {
    draft.setReturnTo(null);
    navigate(returnTo, { replace: true });
  };

  return (
    <CounterDialog
      size="form"
      title={t('newPlayer.title')}
      subtitle={t('newPlayer.text')}
      showClose={false}
      onClose={cancel}
      actions={
        <>
          <Button theme="counter" size="counter-main" className="px-6" onClick={cancel}>
            {t('cancel')}
          </Button>
          <div className="flex-1" />
          <Button
            theme="counter"
            variant="outline"
            size="counter-main"
            className="px-6"
            disabled={trimmed === '' || create.isPending}
            onClick={() => save(undefined)}
          >
            {t('newPlayer.skip')}
          </Button>
          <Button
            theme="counter"
            variant="primary"
            size="counter-main"
            disabled={trimmed === '' || digits === '' || create.isPending}
            onClick={add}
          >
            {t('newPlayer.add')}
          </Button>
        </>
      }
      side={
        <div className="flex flex-1 flex-col gap-3 rounded-[20px] border border-c-line bg-c-raised p-[18px]">
          <span className="text-[16px] text-c-text-2">{t('newPlayer.keypad')}</span>
          <Keypad
            keys="phone"
            onDigit={(digit) => setDigits((current) => (current + digit).slice(0, PHONE_DIGITS))}
            onDelete={() => setDigits((current) => current.slice(0, -1))}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className="text-[18px] font-semibold">
          {t('newPlayer.name')}
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          className={`${FIELD} border-c-line-2 text-[22px]`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={phoneId} className="text-[18px] font-semibold">
          {t('newPlayer.phone')}{' '}
          <span className="font-normal text-c-text-2">{t('newPlayer.later')}</span>
        </label>
        <input
          id={phoneId}
          value={showPhone(digits)}
          onChange={(event) =>
            setDigits(event.target.value.replace(/\D/g, '').slice(0, PHONE_DIGITS))
          }
          // The keypad beside it is the way to type; the device keyboard stays away.
          inputMode="none"
          autoComplete="off"
          dir="ltr"
          aria-describedby={showHint ? `${phoneId}-hint` : undefined}
          className={`${FIELD} border-c-brass text-start font-num text-[30px] tracking-[1px]`}
        />
        {showHint ? (
          <p id={`${phoneId}-hint`} role="alert" className="m-0 text-[16px] text-c-danger-ink">
            {t('newPlayer.partial')}
          </p>
        ) : null}
      </div>

      {similar.length > 0 ? (
        <section
          aria-label={t('newPlayer.similar')}
          className="flex flex-col gap-2 rounded-[16px] border border-c-warn-line bg-c-warn-bg px-[18px] py-4"
        >
          <span className="text-[17px] font-bold text-c-warn-ink">{t('newPlayer.similar')}</span>
          <span className="text-[16px] text-c-text-3">{t('newPlayer.similarText')}</span>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {similar.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => finish(player)}
                className="min-h-[56px] rounded-[12px] border border-c-warn-line bg-c-panel px-4 text-[17px] text-c-text transition-colors duration-150 active:bg-c-raised focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-c-text"
              >
                <b>{player.name}</b> <span className="text-c-text-2">{player.phoneTail}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {create.error ? (
        <p role="alert" className="m-0 text-[17px] text-c-danger-ink">
          {create.error.message}
        </p>
      ) : null}
    </CounterDialog>
  );
}
