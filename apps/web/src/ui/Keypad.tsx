import { Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cx } from './cx';
import { focusRing } from './theme';

interface KeypadBase {
  /** Called with "0" to "9", or "00" on the amount keypad. */
  onDigit: (digit: string) => void;
  onDelete: () => void;
  className?: string;
}

export type KeypadProps = KeypadBase &
  (
    | {
        /** The PIN pad (screens 1, 34): 76 px keys and a Clear key. */
        keys?: 'pin';
        onClear: () => void;
      }
    | {
        /** The amount pad (screens 10, 26, 29): adds a "00" key, 72 px keys, no Clear. */
        keys: 'amount';
        onClear?: undefined;
      }
    | {
        /** The phone pad of "Add a new player" (screen 10): 72 px keys, an empty corner where Clear would be. */
        keys: 'phone';
        onClear?: undefined;
      }
    | {
        /**
         * The lock screen (34): 80 px keys on the panel colour, and "Switch worker" where Clear is.
         * Screen 34 draws 80 px, not the 76 of screen 1 (docs/04 §7).
         */
        keys: 'lock';
        onSwitch: () => void;
        onClear?: undefined;
      }
  );

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const KEY =
  'flex items-center justify-center border font-num font-semibold text-c-text transition-colors duration-150 active:bg-c-raised-2 ' +
  focusRing.counter;
const SIDE_KEY =
  'flex items-center justify-center text-c-text-2 active:bg-c-raised ' + focusRing.counter;

/** A 3-by-4 number pad. Digits are Western and never change with the language. */
export function Keypad(props: KeypadProps) {
  const { onDigit, onDelete, keys = 'pin', className } = props;
  const { t } = useTranslation();
  const amount = keys === 'amount' || keys === 'phone';
  const lock = keys === 'lock';
  const keyLook = amount
    ? 'min-h-[72px] rounded-[14px] border-c-line-2 bg-c-raised text-[34px]'
    : lock
      ? 'min-h-key-lock rounded-[16px] border-c-line bg-c-panel text-[38px]'
      : 'min-h-key rounded-[16px] border-c-line bg-c-raised text-[36px]';
  const sideLook = amount
    ? 'min-h-[72px] rounded-[14px]'
    : lock
      ? 'min-h-key-lock rounded-[16px]'
      : 'min-h-key rounded-[16px]';

  return (
    // dir="ltr": like a phone, the pad keeps 1-2-3 from the left in Urdu too, so a worker's hand does not relearn it.
    <div dir="ltr" className={cx('grid grid-cols-3', amount ? 'gap-2.5' : 'gap-3', className)}>
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className={cx(KEY, keyLook)}
          onClick={() => onDigit(digit)}
        >
          {digit}
        </button>
      ))}
      {props.keys === 'phone' ? (
        <div aria-hidden="true" />
      ) : amount ? (
        <button
          type="button"
          className={cx(KEY, keyLook, 'text-[30px]')}
          onClick={() => onDigit('00')}
        >
          00
        </button>
      ) : props.keys === 'lock' ? (
        <button
          type="button"
          className={cx(SIDE_KEY, sideLook, 'px-1 text-center text-[16px] font-semibold')}
          onClick={props.onSwitch}
        >
          {t('keypad.switchWorker')}
        </button>
      ) : (
        <button
          type="button"
          className={cx(SIDE_KEY, sideLook, 'text-[17px] font-semibold')}
          onClick={props.onClear}
        >
          {t('keypad.clear')}
        </button>
      )}
      <button type="button" className={cx(KEY, keyLook)} onClick={() => onDigit('0')}>
        0
      </button>
      <button
        type="button"
        aria-label={t('keypad.delete')}
        className={cx(SIDE_KEY, sideLook)}
        onClick={onDelete}
      >
        <Delete aria-hidden="true" size={30} strokeWidth={2} />
      </button>
    </div>
  );
}
