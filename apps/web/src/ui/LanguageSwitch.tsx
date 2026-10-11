import { useTranslation } from 'react-i18next';
import { Segmented } from './Segmented';
import type { Theme } from './theme';

export type SwitchLang = 'en' | 'ur';

export interface LanguageSwitchProps {
  value: SwitchLang;
  onChange: (lang: SwitchLang) => void;
  theme: Theme;
  className?: string;
}

/** English or اردو. Each name is written in its own language, so a worker can always find theirs. */
export function LanguageSwitch({ value, onChange, theme, className }: LanguageSwitchProps) {
  const { t } = useTranslation();
  return (
    <Segmented<SwitchLang>
      theme={theme}
      label={t('language.label')}
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: 'en', label: t('language.en'), lang: 'en' },
        { value: 'ur', label: t('language.ur'), lang: 'ur' },
      ]}
    />
  );
}
