import { useId, useMemo, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { cx } from '@/ui/cx';
import type { Theme } from '@/ui/theme';
import { i18n } from './kit-i18n';

type Lang = 'en' | 'ur';

const SURFACE: Record<Theme, string> = {
  counter: 'border-c-line-2 bg-c-page text-c-text',
  owner: 'border-o-line bg-o-page text-o-ink',
};

/**
 * One language of the kit: its own i18n instance, so English and Urdu can sit side by side on one
 * page. Text direction and the Urdu font are set here, not on the whole page.
 */
function LangColumn({ lang, theme, children }: { lang: Lang; theme: Theme; children: ReactNode }) {
  const instance = useMemo(() => i18n.cloneInstance({ lng: lang }), [lang]);
  const { t } = useTranslation();
  return (
    <I18nextProvider i18n={instance}>
      <div
        lang={lang}
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
        data-kit-theme={theme}
        data-kit-lang={lang}
        className={cx(
          'flex min-w-0 flex-col gap-4 rounded-card border p-5',
          SURFACE[theme],
          lang === 'ur' ? 'font-urdu leading-[1.8]' : 'font-body leading-normal',
        )}
      >
        <span
          className={cx(
            'text-[13px] font-semibold uppercase tracking-wide',
            theme === 'counter' ? 'text-c-text-2' : 'text-o-ink-2',
          )}
          lang={lang}
        >
          {t(lang === 'en' ? 'language.en' : 'language.ur')}
        </span>
        {children}
      </div>
    </I18nextProvider>
  );
}

function ThemeRow({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <LangColumn lang="en" theme={theme}>
        {children}
      </LangColumn>
      <LangColumn lang="ur" theme={theme}>
        {children}
      </LangColumn>
    </div>
  );
}

export interface ShowcaseProps {
  title: string;
  /** Shown in the dark counter look, in English and Urdu. Leave out when the component has no counter look. */
  counter?: ReactNode;
  /** Shown in the light owner look, in English and Urdu. */
  owner?: ReactNode;
  counterLabel: string;
  ownerLabel: string;
}

/** One component: its heading, then a counter row and an owner row, each in English and Urdu. */
export function Showcase({ title, counter, owner, counterLabel, ownerLabel }: ShowcaseProps) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-[24px] font-bold">
        {title}
      </h2>
      {counter ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold opacity-70">{counterLabel}</h3>
          <ThemeRow theme="counter">{counter}</ThemeRow>
        </div>
      ) : null}
      {owner ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold opacity-70">{ownerLabel}</h3>
          <ThemeRow theme="owner">{owner}</ThemeRow>
        </div>
      ) : null}
    </section>
  );
}
