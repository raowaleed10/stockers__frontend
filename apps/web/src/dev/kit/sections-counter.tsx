import { phoneTail } from '@stockers/shared';
import { Clock, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { CounterDialog } from '@/ui/CounterDialog';
import { Field } from '@/ui/Field';
import { Keypad } from '@/ui/Keypad';
import { MoneyText } from '@/ui/MoneyText';
import { OptionCard } from '@/ui/OptionCard';
import { PersonCard } from '@/ui/PersonCard';
import { PinDots } from '@/ui/PinDots';
import { SidePanel } from '@/ui/SidePanel';
import { TimerText } from '@/ui/TimerText';
import { MoneyInput } from '@/ui/inputs';
import { clock } from '@/lib/clock';

const noop = () => undefined;

export function DialogDemo() {
  const { t } = useTranslation('kit');
  const [pick, setPick] = useState<'single' | 'double' | 'century'>('century');
  const [rate, setRate] = useState<number | null>(15);
  const types = [
    { id: 'single', title: t('dlg.single'), note: t('dlg.singleNote'), price: 250 },
    { id: 'double', title: t('dlg.double'), note: t('dlg.doubleNote'), price: 500 },
    { id: 'century', title: t('dlg.century'), note: t('dlg.centuryNote'), price: 15 },
  ] as const;
  return (
    <div className="flex flex-col gap-6">
      <CounterDialog
        static
        lead="2"
        title={t('dlg.title')}
        subtitle={t('dlg.ask')}
        onClose={noop}
        actions={
          <>
            <Button theme="counter" variant="outline" icon={<Wrench size={20} />}>
              {t('dlg.markOut')}
            </Button>
            <span className="flex-1" />
            <Button theme="counter" size="counter-main" variant="secondary">
              {t('dlg.cancel')}
            </Button>
            <Button theme="counter" size="counter-main" variant="primary">
              {t('dlg.next')}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-3.5">
          {types.map((type) => (
            <OptionCard
              key={type.id}
              className="flex-1 basis-[200px]"
              title={type.title}
              description={type.note}
              value={
                type.id === 'century' ? t('dlg.centuryRate') : <MoneyText value={type.price} />
              }
              selected={pick === type.id}
              onClick={() => setPick(type.id)}
            />
          ))}
        </div>
        <Card
          theme="counter"
          tone="soft"
          radius="card"
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <Field
            theme="counter"
            label={t('dlg.rate')}
            hint={t('dlg.rateHint')}
            className="flex-1 basis-[260px]"
          >
            {(control) => (
              <MoneyInput {...control} theme="counter" size="lg" value={rate} onChange={setRate} />
            )}
          </Field>
        </Card>
      </CounterDialog>

      <CounterDialog
        static
        tone="warning"
        titleSize="lg"
        icon={<Clock size={32} strokeWidth={2.4} />}
        kicker={t('dlg.warnKicker')}
        title={t('dlg.warnTitle')}
        subtitle={t('dlg.warnSub')}
        showClose={false}
        onClose={noop}
        actions={
          <>
            <span className="flex-1" />
            <Button theme="counter" size="counter" variant="secondary">
              {t('dlg.back')}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-4">
          <OptionCard
            layout="price"
            className="flex-1 basis-[240px]"
            title={t('dlg.normal')}
            value={<MoneyText value={200} />}
          />
          <OptionCard
            layout="price"
            tone="danger"
            className="flex-1 basis-[240px]"
            title={t('dlg.doublePrice')}
            value={<MoneyText value={400} />}
          />
        </div>
      </CounterDialog>
    </div>
  );
}

export function SidePanelDemo() {
  const { t } = useTranslation('kit');
  const [startedAt] = useState(() => new Date(clock.now() - (18 * 60_000 + 42_000)).toISOString());
  return (
    <SidePanel static lead="1" title={t('panel.title')} subtitle={t('panel.since')} onClose={noop}>
      <Card theme="counter" tone="blue" className="flex items-center justify-between gap-3">
        <span className="text-[19px] font-bold">{t('panel.players')}</span>
        <TimerText startedAt={startedAt} />
      </Card>
      <Button theme="counter" size="counter-main" variant="primary" className="w-full">
        {t('panel.end')}
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button theme="counter" size="counter-main" variant="secondary">
          {t('panel.pause')}
        </Button>
        <Button theme="counter" size="counter-main" variant="secondary">
          {t('panel.move')}
        </Button>
      </div>
    </SidePanel>
  );
}

export function OptionCardDemo() {
  const { t } = useTranslation('kit');
  const [pick, setPick] = useState<'single' | 'double'>('single');
  return (
    <div className="flex flex-wrap gap-3.5">
      <OptionCard
        className="flex-1 basis-[200px]"
        title={t('dlg.single')}
        badge={t('now')}
        description={t('dlg.singleNote')}
        value={<MoneyText value={250} />}
        selected={pick === 'single'}
        onClick={() => setPick('single')}
      />
      <OptionCard
        className="flex-1 basis-[200px]"
        title={t('dlg.double')}
        description={t('dlg.doubleNote')}
        value={<MoneyText value={500} />}
        selected={pick === 'double'}
        onClick={() => setPick('double')}
      />
    </div>
  );
}

export function PersonCardDemo() {
  const { t } = useTranslation('kit');
  const [pick, setPick] = useState('ali');
  return (
    <div className="flex flex-col gap-3">
      <PersonCard
        name="Ali Akbar"
        phoneTail={phoneTail('0300 1111187')}
        note={t('person.playedNote')}
        selected={pick === 'ali'}
        onClick={() => setPick('ali')}
      />
      <PersonCard
        name="Ali Raza"
        phoneTail={phoneTail('0300 1111964')}
        status={{ text: t('person.busy'), tone: 'busy' }}
        selected={pick === 'raza'}
        onClick={() => setPick('raza')}
      />
      <div className="grid grid-cols-2 gap-3">
        <PersonCard variant="tile" name="Bilal Ahmed" phoneTail={phoneTail('0300 1114512')} />
        <PersonCard variant="tile" name="Usman Tariq" phoneTail={phoneTail('0300 1117731')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PersonCard
          variant="large"
          name="Ali Raza"
          phoneTail={phoneTail('0300 1111964')}
          note={t('person.won')}
        />
        <PersonCard
          variant="large"
          name="Bilal Ahmed"
          phoneTail={phoneTail('0300 1114512')}
          note={t('person.who')}
          status={{ text: t('person.waiting'), tone: 'warn' }}
        />
      </div>
    </div>
  );
}

export function KeypadDemo() {
  const { t } = useTranslation('kit');
  const [pin, setPin] = useState('');
  const [amount, setAmount] = useState('');
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-c-line bg-c-panel p-6">
        <span className="text-[18px] text-c-text-2">{t('pad.pin')}</span>
        <PinDots filled={pin.length} />
        <Keypad
          className="w-full max-w-[380px]"
          onDigit={(digit) => setPin((value) => (value + digit).slice(0, 4))}
          onClear={() => setPin('')}
          onDelete={() => setPin((value) => value.slice(0, -1))}
        />
      </div>
      <div className="flex flex-col gap-3 rounded-[22px] border border-c-line bg-c-panel p-5">
        <span className="text-[17px] text-c-text-2">{t('pad.amount')}</span>
        <MoneyText value={Number(amount || 0)} size="big" />
        <Keypad
          keys="amount"
          onDigit={(digit) => setAmount((value) => (value + digit).replace(/^0+/, '').slice(0, 7))}
          onDelete={() => setAmount((value) => value.slice(0, -1))}
        />
      </div>
    </div>
  );
}
