import type { TableStatus } from '@stockers/shared';
import { Bell, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clock } from '@/lib/clock';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { LanguageSwitch, type SwitchLang } from '@/ui/LanguageSwitch';
import { MoneyText } from '@/ui/MoneyText';
import { Segmented } from '@/ui/Segmented';
import { StatCard } from '@/ui/StatCard';
import { StatusPill } from '@/ui/StatusPill';
import { TimerText } from '@/ui/TimerText';
import { Toggle } from '@/ui/Toggle';
import type { Theme } from '@/ui/theme';

const STATUSES: TableStatus[] = ['free', 'playing', 'over30', 'paused', 'outOfOrder', 'noPrice'];

export function ButtonDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const counter = theme === 'counter';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button theme={theme} variant="primary" size={counter ? 'counter-main' : 'owner'}>
          {t('btn.primary')}
        </Button>
        <Button theme={theme} variant="primary" icon={<ShoppingBag size={22} />}>
          {t('btn.icon')}
        </Button>
        <Button theme={theme} variant="primary" disabled>
          {t('btn.disabled')}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button theme={theme} variant="secondary">
          {t('btn.secondary')}
        </Button>
        <Button theme={theme} variant="outline">
          {t('btn.outline')}
        </Button>
        <Button theme={theme} variant="danger">
          {t('btn.danger')}
        </Button>
        <Button theme={theme} variant="ghost">
          {t('btn.ghost')}
        </Button>
      </div>
      {counter ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button theme={theme} variant="secondary" drawn={52}>
            {t('btn.secondary')}
          </Button>
          <Button theme={theme} variant="outline" drawn={48}>
            {t('btn.outline')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button theme={theme} variant="secondary" size="ownerSm">
            {t('btn.small')}
          </Button>
          <Button theme={theme} variant="danger" size="ownerSm">
            {t('btn.danger')}
          </Button>
        </div>
      )}
    </div>
  );
}

export function IconButtonDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const { t: tc } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton theme={theme} label={tc('close')} icon={<X size={24} strokeWidth={2.2} />} />
      <IconButton theme={theme} label={t('bell')} icon={<Bell size={24} />} badge={3} />
      <IconButton
        theme={theme}
        variant="ghost"
        label={tc('close')}
        icon={<X size={24} strokeWidth={2.2} />}
      />
      <IconButton theme={theme} label={tc('close')} icon={<X size={24} />} disabled />
      {theme === 'counter' ? (
        <>
          <IconButton
            theme={theme}
            label={tc('close')}
            icon={<X size={20} strokeWidth={2.2} />}
            drawn={48}
          />
          <IconButton
            theme={theme}
            label={t('bell')}
            icon={<Bell size={24} />}
            badge={3}
            drawn={52}
          />
        </>
      ) : null}
    </div>
  );
}

export function StatusPillDemo({ theme }: { theme: Theme }) {
  return (
    <div
      className={
        theme === 'counter'
          ? 'flex flex-wrap gap-3 rounded-card bg-[var(--cloth-2)] p-4'
          : 'flex flex-wrap gap-3'
      }
    >
      {STATUSES.map((status) => (
        <StatusPill key={status} status={status} tone={theme === 'counter' ? 'dark' : 'light'} />
      ))}
    </div>
  );
}

export function ChipDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [selected, setSelected] = useState('owe');
  const items = [
    { id: 'all', label: t('chip.all') },
    { id: 'owe', label: t('chip.owe') },
    { id: 'advance', label: t('chip.advance') },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Chip
            key={item.id}
            theme={theme}
            drawn={theme === 'counter' ? 48 : undefined}
            selected={selected === item.id}
            onClick={() => setSelected(item.id)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 2).map((item) => (
          <Chip key={item.id} theme={theme} size="lg" selected={item.id === 'all'}>
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function CardDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const counter = theme === 'counter';
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['plain', 'amber', 'blue', 'green'] as const).map((tone) => (
        <Card key={tone} theme={theme} tone={tone} className="flex flex-col gap-1">
          <span className={counter ? 'text-[19px] font-bold' : 'text-[17px] font-bold'}>
            {tone === 'green' ? t('card.paidNow') : t('card.oldCredit')}
          </span>
          <span className={counter ? 'text-[15px] text-c-text-3' : 'text-[14px] text-o-ink-2'}>
            {tone === 'amber' ? t('card.oldCreditNote') : t('card.stays')}
          </span>
          <MoneyText value={tone === 'green' ? 1000 : 500} size="row" />
        </Card>
      ))}
      <Card
        theme={theme}
        tone="soft"
        padding="sm"
        className="text-[15px] leading-[1.45] sm:col-span-2"
      >
        {t('card.info')}
      </Card>
    </div>
  );
}

export function StatCardDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  if (theme === 'counter') {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard theme={theme} label={t('stat.total')} value={<MoneyText value={1300} />} />
        <StatCard
          theme={theme}
          tone="green"
          labelTone="green"
          label={t('card.paidNow')}
          value={<MoneyText value={1000} />}
        />
        <StatCard
          theme={theme}
          tone="amber"
          labelTone="amber"
          label={t('card.stays')}
          value={<MoneyText value={300} />}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          theme={theme}
          labelTone="amber"
          label={t('stat.owed')}
          value={<MoneyText value={49600} />}
          note={t('stat.owedNote')}
        />
        <StatCard
          theme={theme}
          tone="amber"
          labelTone="amber"
          label={t('stat.older')}
          value={<MoneyText value={12500} />}
          note={t('stat.olderNote')}
        />
        <StatCard
          theme={theme}
          labelTone="green"
          label={t('stat.advance')}
          value={<MoneyText value={3400} />}
          note={t('stat.advanceNote')}
        />
      </div>
      <StatCard
        theme={theme}
        tone="solid"
        size="lg"
        label={t('stat.earned')}
        value={<MoneyText value={33000} />}
        note={t('stat.earnedNote')}
      />
      <div className="mx-auto flex w-full max-w-[358px] flex-col gap-2.5">
        <StatCard
          theme={theme}
          tone="dark"
          size="xl"
          label={t('stat.earned')}
          value={<MoneyText value={33000} />}
          note={t('stat.earnedNote')}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            theme={theme}
            size="sm"
            label={t('stat.received')}
            value={<MoneyText value={27050} />}
            note={t('stat.receivedNote')}
          />
          <StatCard
            theme={theme}
            size="sm"
            labelTone="amber"
            label={t('card.stays')}
            value={<MoneyText value={2350} />}
          />
        </div>
      </div>
    </div>
  );
}

export function MoneyTextDemo() {
  return (
    <div className="flex flex-col gap-2">
      <MoneyText value={1350} />
      <MoneyText value={250} size="row" />
      <MoneyText value={1350} size="big" />
      <MoneyText value={1350} size="hero" />
      <div className="flex flex-wrap items-baseline gap-4">
        <MoneyText value={400} size="row" strike />
        <MoneyText value={200} size="row" />
        <MoneyText value={-500} size="row" />
      </div>
    </div>
  );
}

/** An ISO time `ms` before the demo clock's now, fixed once so a timer does not restart on every render. */
function isoAgo(ms: number): string {
  return new Date(clock.now() - ms).toISOString();
}

export function TimerTextDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [running] = useState(() => isoAgo(18 * 60_000 + 42_000));
  const [over] = useState(() => isoAgo(34 * 60_000 + 10_000));
  const [pausedStart] = useState(() => isoAgo(30 * 60_000));
  const [pausedAt] = useState(() => isoAgo(14 * 60_000 + 56_000));
  const [endedStart] = useState(() => isoAgo(40 * 60_000));
  const [endedAt] = useState(() => isoAgo(15 * 60_000));
  const label = theme === 'counter' ? 'text-c-text-2' : 'text-o-ink-2';
  const row = 'flex items-center justify-between gap-4';
  return (
    <div className="flex flex-col gap-3">
      <div className={row}>
        <span className={label}>{t('timer.running')}</span>
        <TimerText startedAt={running} />
      </div>
      <div className={row}>
        <span className={label}>{t('timer.over')}</span>
        <TimerText startedAt={over} />
      </div>
      <div className={row}>
        <span className={label}>{t('timer.paused')}</span>
        <TimerText startedAt={pausedStart} pausedAt={pausedAt} pausedMs={3 * 60_000} />
      </div>
      <div className={row}>
        <span className={label}>{t('timer.ended')}</span>
        <TimerText startedAt={endedStart} endedAt={endedAt} />
      </div>
    </div>
  );
}

export function ToggleDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [bank, setBank] = useState(true);
  const [easy, setEasy] = useState(true);
  const [off, setOff] = useState(false);
  const divider = theme === 'counter' ? 'border-c-line' : 'border-o-divider';
  return (
    <div className="flex max-w-[460px] flex-col">
      <div className={`border-b ${divider}`}>
        <Toggle theme={theme} checked={bank} onChange={setBank} label={t('toggle.bank')} />
      </div>
      <div className={`border-b ${divider}`}>
        <Toggle theme={theme} checked={easy} onChange={setEasy} label={t('toggle.easypaisa')} />
      </div>
      <Toggle theme={theme} checked={off} onChange={setOff} label={t('toggle.off')} />
    </div>
  );
}

export function SegmentedDemo({ theme }: { theme: Theme }) {
  const { t } = useTranslation('kit');
  const [half, setHalf] = useState<'am' | 'pm'>('am');
  const [lang, setLang] = useState<SwitchLang>('en');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Segmented
        theme={theme}
        label={t('seg.from')}
        size="lg"
        drawn={theme === 'counter' ? 52 : undefined}
        value={half}
        onChange={setHalf}
        options={[
          { value: 'am', label: t('seg.am') },
          { value: 'pm', label: t('seg.pm') },
        ]}
      />
      {theme === 'counter' ? (
        <Segmented
          theme={theme}
          label={t('seg.from')}
          size="lg"
          drawn={54}
          value={half}
          onChange={setHalf}
          options={[
            { value: 'am', label: t('seg.am') },
            { value: 'pm', label: t('seg.pm') },
          ]}
        />
      ) : null}
      <LanguageSwitch theme={theme} value={lang} onChange={setLang} />
    </div>
  );
}
