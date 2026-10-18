import type { ParseKeys } from 'i18next';
import { Trans } from 'react-i18next';

// `<when>` keeps a time or a date together inside Urdu text (it is invisible in English); `<name>` does the same for a name,
// whatever script it is in; `<b>` is bold. Both are `<bdi>`: the direction follows the first letter, so `رات 10:30` runs right
// to left and `10:30 PM` left to right.
const COMPONENTS = { when: <bdi />, name: <bdi />, b: <b /> };

type Namespace = 'dashboard' | 'reports' | 'activity' | 'login' | 'shell';

/** An owner word that has a time, a name or a bold part inside it. Plain words use `t()`. */
export function RichText<N extends Namespace>({
  ns,
  i18nKey,
  values,
}: {
  ns: N;
  i18nKey: ParseKeys<N>;
  values?: Record<string, string | number>;
}) {
  // i18next's own types for Trans are stricter than the keys and values checked above, so they are cast here.
  return (
    <Trans ns={ns} i18nKey={i18nKey as never} values={values as never} components={COMPONENTS} />
  );
}
