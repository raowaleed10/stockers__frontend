// Stockers Tailwind preset. Copy to apps/web/tailwind.preset.ts and use:
//   presets: [require('./tailwind.preset')]   (or import for ESM configs)
// Colours point at the CSS variables in tokens.css so both apps share one source.
import type { Config } from 'tailwindcss';

const v = (name: string) => `var(--${name})`;

const preset: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        body: ['Barlow', 'system-ui', 'sans-serif'],
        num: ['"Barlow Condensed"', 'Barlow', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'Barlow', 'serif'],
      },
      colors: {
        c: {
          page: v('c-page'), deep: v('c-deep'), header: v('c-header'), panel: v('c-panel'),
          raised: v('c-raised'), 'raised-2': v('c-raised-2'),
          line: v('c-line'), 'line-2': v('c-line-2'), 'line-3': v('c-line-3'),
          text: v('c-text'), 'text-2': v('c-text-2'), 'text-3': v('c-text-3'),
          brass: v('c-brass'), 'brass-ink': v('c-brass-ink'), felt: v('c-felt'),
        },
        s: {
          free: v('s-free'), play: v('s-play'), over: v('s-over'), card: v('s-card'),
          pause: v('s-pause'), ooo: v('s-ooo'), noprice: v('s-noprice'),
        },
        o: {
          page: v('o-page'), card: v('o-card'), line: v('o-line'), 'line-2': v('o-line-2'), soft: v('o-soft'),
          ink: v('o-ink'), 'ink-2': v('o-ink-2'),
          green: v('o-green'), 'green-hover': v('o-green-hover'), 'green-tint': v('o-green-tint'), 'green-ink': v('o-green-ink'),
          sidebar: v('o-sidebar'), 'sidebar-active': v('o-sidebar-active'), 'sidebar-text': v('o-sidebar-text'),
          'amber-ink': v('o-amber-ink'), 'amber-ink-2': v('o-amber-ink-2'), 'amber-tint': v('o-amber-tint'), 'amber-line': v('o-amber-line'),
          blue: v('o-blue'), 'blue-tint': v('o-blue-tint'), 'blue-line': v('o-blue-line'), 'blue-ink': v('o-blue-ink'),
          red: v('o-red'), 'red-tint': v('o-red-tint'), chart: v('o-chart'),
        },
        sl: { free: v('sl-free'), play: v('sl-play'), pause: v('sl-pause'), ooo: v('sl-ooo') },
      },
      borderRadius: {
        tile: v('r-tile'), dialog: v('r-dialog'), card: v('r-card'),
        btn: v('r-btn'), 'btn-sm': v('r-btn-sm'), input: v('r-input'),
      },
      boxShadow: {
        'dialog-dark': v('shadow-dialog-dark'),
        'dialog-light': v('shadow-dialog-light'),
        tile: v('shadow-tile'),
      },
      minHeight: {
        touch: v('touch-counter'), 'touch-main': v('touch-counter-main'),
        key: v('touch-key'), 'touch-owner': v('touch-owner'),
      },
      minWidth: { touch: v('touch-counter'), 'touch-owner': v('touch-owner') },
      fontSize: {
        // counter
        'c-body': ['18px', '1.4'], 'c-small': ['15px', '1.35'], 'c-title': ['32px', '1.15'],
        'tile-num': ['58px', '0.8'], 'tile-timer': ['40px', '1'], clock: ['34px', '1'],
        // owner
        'o-body': ['16px', '1.45'], 'o-small': ['14px', '1.4'], 'o-h1': ['32px', '1.15'], 'o-h2': ['21px', '1.25'],
        'o-stat': ['40px', '1.1'],
      },
    },
  },
};

export default preset;
