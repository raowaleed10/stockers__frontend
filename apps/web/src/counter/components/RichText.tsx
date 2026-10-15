import type { ParseKeys } from 'i18next';
import { Trans } from 'react-i18next';

// `<ltr>` keeps a time or a date in its own order inside Urdu text (it is invisible in English); `<name>` does
// the same for a worker's name, whatever script it is in; `<b>` is bold.
const COMPONENTS = { ltr: <bdi dir="ltr" />, name: <bdi />, b: <b /> };

type Namespace = 'signin' | 'frame' | 'lock';

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
