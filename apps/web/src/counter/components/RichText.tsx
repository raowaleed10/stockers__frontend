import type { ParseKeys } from 'i18next';
import { Trans } from 'react-i18next';

// `<when>` keeps a time or a date together inside Urdu text (it is invisible in English); `<name>` does the same
// for a worker's name, whatever script it is in; `<b>` is bold. Both are `<bdi>`: the direction follows the first
// letter, so `رات 9:42` runs right to left and `9:42 PM` left to right.
const COMPONENTS = { when: <bdi />, name: <bdi />, b: <b /> };

type Namespace = 'signin' | 'frame' | 'lock' | 'start' | 'table' | 'end';

/** A counter word that has a time or bold part inside it. Plain words use `t()`. */
export function RichText<N extends Namespace>({
  ns,
  i18nKey,
  values,
}: {
  ns: N;
  i18nKey: ParseKeys<N>;
  values?: Record<string, string | number>;
}) {
  // i18next's own types for Trans are stricter than the keys and values we check above, so they are cast here.
  return (
    <Trans ns={ns} i18nKey={i18nKey as never} values={values as never} components={COMPONENTS} />
  );
}
