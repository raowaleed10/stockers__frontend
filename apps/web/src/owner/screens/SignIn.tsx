import type { PublicOwner } from '@stockers/shared';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { isTooManyTries } from '@/lib/api-client';
import { clock, useNow } from '@/lib/clock';
import { Button } from '@/ui/Button';
import { cx } from '@/ui/cx';
import { focusRing, focusWithinRing } from '@/ui/theme';
import { PHONE_QUERY, useMediaQuery } from '@/ui/use-media';
import { usePublicOwners, useSignIn } from '../api';
import { readAppBase } from '../app-base';
import { OwnerBrand } from '../components/OwnerBrand';
import { OwnerLanguage } from '../components/OwnerLanguage';

// `<addr>` keeps the address left to right inside Urdu text.
const COMPONENTS = { b: <b className="text-c-text" />, addr: <bdi dir="ltr" /> };

/** The page the guard sent him from, if it is a plain path of this app (no outside text goes into `navigate`). */
function pathAfterSignIn(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === 'string' && /^\/[a-z0-9/-]*$/i.test(from) && !from.startsWith('//')
    ? from
    : '/';
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Screens 35 and 52, `/sign-in`: Aqil or Adil, the password, and "Keep me signed in". On a wide screen it is the walnut
 * brand panel with the private-address note beside a white card (35); under 768 px it is one column with the language
 * pills at the bottom (52). Only the server knows if the password is right; after 5 wrong tries it waits 15 minutes
 * (docs/08 §2). The names come from `GET /auth/owners`, so no name is written in the code.
 */
export function SignIn() {
  const { t } = useTranslation('login');
  const { t: tc } = useTranslation();
  const phone = useMediaQuery(PHONE_QUERY);
  const navigate = useNavigate();
  const location = useLocation();
  const owners = usePublicOwners();
  const signIn = useSignIn();
  const now = useNow(1000);

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [keep, setKeep] = useState(true);
  const [shown, setShown] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);

  const list = owners.data ?? [];
  const chosen = ownerId ?? list[0]?.id ?? null;
  const locked = lockedUntil > now;
  const minutes = Math.max(1, Math.ceil((lockedUntil - now) / 60_000));
  const error = signIn.error;
  const message = locked
    ? t('wait', { minutes })
    : error
      ? isTooManyTries(error)
        ? t('wait', { minutes: Math.max(1, Math.ceil(error.details.retryAfterSec / 60)) })
        : error.code === 'WRONG_PASSWORD'
          ? t('wrong')
          : error.message
      : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!chosen || locked) return;
    signIn.mutate(
      { ownerId: chosen as PublicOwner['id'], password, keepSignedIn: keep },
      {
        onSuccess: () => navigate(pathAfterSignIn(location.state), { replace: true }),
        onError: (failure) => {
          if (isTooManyTries(failure)) {
            setLockedUntil(clock.now() + failure.details.retryAfterSec * 1000);
          }
        },
      },
    );
  };

  const form = (
    <form
      onSubmit={submit}
      className={cx('flex flex-col', phone ? 'gap-3.5' : 'gap-[18px]')}
      noValidate
    >
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="p-0 pb-2 text-[16px] font-semibold">{t('who')}</legend>
        {owners.isError ? (
          <div role="alert" className="flex flex-col items-start gap-2 text-[16px] text-o-red">
            {t('loadFailed')}
            <Button theme="owner" onClick={() => void owners.refetch()}>
              {tc('retry')}
            </Button>
          </div>
        ) : (
          list.map((owner, index) => (
            <OwnerChoice
              key={owner.id}
              owner={owner}
              role={t('role')}
              selected={chosen === owner.id}
              tone={index === 0 ? 'green' : 'blue'}
              compact={phone}
              onPick={() => setOwnerId(owner.id)}
            />
          ))
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="owner-password" className="text-[16px] font-semibold">
          {t('password')}
        </label>
        <div
          className={cx(
            'flex min-h-[56px] items-center rounded-[12px] border-2 bg-o-card',
            // The phone's field is 56 px inside its border and the computer's 56 outside (screen 52 does not size by border-box).
            phone ? 'box-content' : 'box-border w-full',
            error && !locked ? 'border-o-red' : 'border-o-line-2 focus-within:border-o-blue',
            phone ? 'pe-1.5 ps-3.5' : 'px-3.5',
          )}
        >
          <input
            id="owner-password"
            type={shown ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            aria-invalid={error && !locked ? true : undefined}
            aria-describedby={message ? 'owner-password-message' : undefined}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 self-stretch border-0 bg-transparent text-[20px] text-o-ink outline-none"
          />
          {phone ? (
            <button
              type="button"
              aria-label={shown ? t('hide') : t('show')}
              aria-pressed={shown}
              onClick={() => setShown((value) => !value)}
              className={cx(
                'flex h-touch-owner w-touch-owner shrink-0 items-center justify-center rounded-[10px] text-o-ink-2',
                focusRing.owner,
              )}
            >
              {shown ? (
                <EyeOff aria-hidden="true" size={22} strokeWidth={2} />
              ) : (
                <Eye aria-hidden="true" size={22} strokeWidth={2} />
              )}
            </button>
          ) : null}
        </div>
        {message ? (
          <span
            id="owner-password-message"
            role="alert"
            className="text-[14px] font-semibold text-o-red"
          >
            {message}
          </span>
        ) : null}
      </div>

      <label
        className={cx(
          'flex items-center gap-3 text-[16px]',
          phone ? 'min-h-[48px]' : 'min-h-[44px]',
        )}
      >
        <input
          type="checkbox"
          checked={keep}
          onChange={(event) => setKeep(event.target.checked)}
          className={cx('m-[3px_3px_3px_4px] h-[22px] w-[22px] accent-o-green', focusRing.owner)}
        />
        {phone ? t('keepPhone') : t('keepComputer')}
      </label>

      <button
        type="submit"
        disabled={!chosen || locked || signIn.isPending}
        className={cx(
          'flex min-h-[56px] w-full items-center justify-center bg-o-green text-[18px] font-bold text-white transition-colors duration-150 hover:bg-o-green-hover disabled:cursor-not-allowed disabled:opacity-40',
          phone ? 'rounded-btn' : 'rounded-btn-sm',
          focusRing.owner,
        )}
      >
        {t('submit')}
      </button>
      <span className={cx('text-[15px] text-o-ink-2', phone ? 'leading-[1.4]' : 'leading-[1.45]')}>
        {phone ? t('forgotPhone') : t('forgot')}
      </span>
    </form>
  );

  if (phone) {
    return (
      <div
        data-app="owner"
        className="screen-text flex min-h-screen flex-col bg-o-page font-body text-o-ink"
      >
        <header className="flex flex-col items-start gap-1.5 px-5 pb-2.5 pt-10">
          <OwnerBrand look="phoneSignIn" />
          <span className="text-[17px] text-o-ink-2">{tc('place')}</span>
        </header>
        <main className="flex flex-1 flex-col gap-3.5 px-4 pb-[22px] pt-1.5">
          <h1 className="m-0 mt-3 text-[26px] font-bold">{t('title')}</h1>
          {form}
          <OwnerLanguage look="pills" className="mt-1" />
        </main>
      </div>
    );
  }

  const address = `${window.location.host}${readAppBase()?.replace(/^\/$/, '') ?? ''}`;
  return (
    <div
      data-app="owner"
      className="screen-text flex min-h-screen flex-wrap bg-o-sidebar font-body text-o-ink"
    >
      <section className="box-border flex min-w-0 flex-[1_1_480px] flex-col justify-between gap-10 px-[60px] py-14 text-c-text">
        <OwnerBrand look="panel" />
        <div className="flex max-w-[520px] flex-col gap-3.5">
          <span className="font-num text-[64px] font-bold leading-[0.95]">{t('panelTitle')}</span>
          <span className="text-[19px] leading-[1.5] text-c-text-3">{t('panelText')}</span>
        </div>
        <div className="box-border flex max-w-[520px] items-start gap-3 rounded-[14px] border border-c-line-2 bg-c-raised px-[18px] py-4">
          <Lock
            aria-hidden="true"
            size={22}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-c-brass"
          />
          <span className="text-[16px] leading-[1.45] text-c-text-3">
            <Trans ns="login" i18nKey="private" values={{ address }} components={COMPONENTS} />
          </span>
        </div>
      </section>
      <section className="box-border flex min-w-0 flex-[1_1_520px] items-center justify-center bg-o-page px-8 py-10">
        <div className="box-border flex w-full max-w-[480px] flex-col gap-[18px] rounded-[22px] border border-o-line bg-o-card px-8 py-[34px] shadow-login-card">
          <h1 className="m-0 text-[30px] font-bold">{t('title')}</h1>
          {form}
        </div>
      </section>
    </div>
  );
}

function OwnerChoice({
  owner,
  role,
  selected,
  tone,
  compact,
  onPick,
}: {
  owner: PublicOwner;
  role: string;
  selected: boolean;
  tone: 'green' | 'blue';
  compact: boolean;
  onPick: () => void;
}) {
  return (
    <label
      className={cx(
        'flex items-center gap-3 rounded-[14px]',
        // The phone's cards are 64 px inside their border (screen 52 does not size by border-box); the computer's are 72 outside.
        compact ? 'box-content min-h-[64px] px-3.5' : 'box-border min-h-[72px] px-4',
        selected ? 'border-2 border-o-green bg-o-green-tint' : 'border border-o-line bg-o-card',
        focusWithinRing.owner,
      )}
    >
      <input
        type="radio"
        name="owner"
        value={owner.id}
        checked={selected}
        onChange={onPick}
        className="m-[3px_3px_3px_4px] h-[22px] w-[22px] accent-o-green"
      />
      <span
        aria-hidden="true"
        className={cx(
          'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
          compact ? 'h-10 w-10 text-[15px]' : 'h-[42px] w-[42px]',
          tone === 'green' ? 'bg-o-green' : 'bg-o-blue',
        )}
      >
        {initials(owner.name)}
      </span>
      <span className="flex flex-col">
        <span className="text-[18px] font-bold">{owner.name}</span>
        <span className="text-[14px] text-o-ink-2">{role}</span>
      </span>
    </label>
  );
}
