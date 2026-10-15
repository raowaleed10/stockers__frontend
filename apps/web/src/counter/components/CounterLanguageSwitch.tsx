import { useLanguageStore } from '@/lib/language';
import { LanguageSwitch } from '@/ui/LanguageSwitch';

/** English or اردو, wired to the language store. On screens 1 to 6. */
export function CounterLanguageSwitch({ className }: { className?: string }) {
  const lang = useLanguageStore((state) => state.lang);
  const setLang = useLanguageStore((state) => state.setLang);
  return <LanguageSwitch theme="counter" value={lang} onChange={setLang} className={className} />;
}
