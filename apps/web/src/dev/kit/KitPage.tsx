import { useTranslation } from 'react-i18next';
import type { AppId } from '@/lib/app-id';
import type kit from '../locales/en/kit.json';
import { Showcase } from './Showcase';
import {
  ButtonDemo,
  CardDemo,
  ChipDemo,
  IconButtonDemo,
  MoneyTextDemo,
  SegmentedDemo,
  StatCardDemo,
  StatusPillDemo,
  TimerTextDemo,
  ToggleDemo,
} from './sections-basic';
import {
  DialogDemo,
  KeypadDemo,
  OptionCardDemo,
  PersonCardDemo,
  SidePanelDemo,
} from './sections-counter';
import {
  DataTableDemo,
  EmptyAndToastDemo,
  FieldsDemo,
  OwnerAsideDemo,
  StatementDemo,
} from './sections-forms';

/**
 * The UI kit page (development only, route `/dev/kit` in both apps). Every shared component in
 * both looks, in English and Urdu side by side. It never ships: each app adds the route only in dev.
 */
export default function KitPage({ app }: { app: AppId }) {
  const { t } = useTranslation('kit');
  const labels = {
    counterLabel: t('chrome.counter'),
    ownerLabel: t('chrome.owner'),
  };
  const s = (key: keyof typeof kit.chrome.s) => t(`chrome.s.${key}`);

  return (
    <main
      data-app={app}
      className={
        app === 'counter'
          ? 'min-h-screen bg-c-page text-c-text'
          : 'min-h-screen bg-o-page text-o-ink'
      }
    >
      <div className="mx-auto flex max-w-[2400px] flex-col gap-10 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[32px] font-bold">{t('chrome.title')}</h1>
          <p className="max-w-[760px] text-[16px] opacity-80">{t('chrome.intro')}</p>
        </header>

        <Showcase
          title={s('button')}
          counter={<ButtonDemo theme="counter" />}
          owner={<ButtonDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('iconButton')}
          counter={<IconButtonDemo theme="counter" />}
          owner={<IconButtonDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('statusPill')}
          counter={<StatusPillDemo theme="counter" />}
          owner={<StatusPillDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('chip')}
          counter={<ChipDemo theme="counter" />}
          owner={<ChipDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('card')}
          counter={<CardDemo theme="counter" />}
          owner={<CardDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('statCard')}
          counter={<StatCardDemo theme="counter" />}
          owner={<StatCardDemo theme="owner" />}
          {...labels}
        />
        <Showcase title={s('dialog')} counter={<DialogDemo />} {...labels} />
        <Showcase title={s('sidePanel')} counter={<SidePanelDemo />} {...labels} />
        <Showcase title={s('ownerAside')} owner={<OwnerAsideDemo />} {...labels} />
        <Showcase title={s('optionCard')} counter={<OptionCardDemo />} {...labels} />
        <Showcase title={s('personCard')} counter={<PersonCardDemo />} {...labels} />
        <Showcase title={s('keypad')} counter={<KeypadDemo />} {...labels} />
        <Showcase
          title={s('money')}
          counter={<MoneyTextDemo />}
          owner={<MoneyTextDemo />}
          {...labels}
        />
        <Showcase
          title={s('timer')}
          counter={<TimerTextDemo theme="counter" />}
          owner={<TimerTextDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('toggle')}
          counter={<ToggleDemo theme="counter" />}
          owner={<ToggleDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('segmented')}
          counter={<SegmentedDemo theme="counter" />}
          owner={<SegmentedDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('fields')}
          counter={<FieldsDemo theme="counter" />}
          owner={<FieldsDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('dataTable')}
          counter={<DataTableDemo theme="counter" />}
          owner={<DataTableDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={s('statement')}
          counter={<StatementDemo theme="counter" />}
          owner={<StatementDemo theme="owner" />}
          {...labels}
        />
        <Showcase
          title={`${s('empty')} and ${s('toast')}`}
          counter={<EmptyAndToastDemo theme="counter" />}
          owner={<EmptyAndToastDemo theme="owner" />}
          {...labels}
        />
      </div>
    </main>
  );
}
