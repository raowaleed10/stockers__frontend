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
          // added in P01 (see tokens.css)
          'brass-press': v('c-brass-press'), selected: v('c-selected'), scrim: v('c-scrim'),
          'warn-bg': v('c-warn-bg'), 'warn-line': v('c-warn-line'), 'warn-ink': v('c-warn-ink'),
          'danger-bg': v('c-danger-bg'), 'danger-line': v('c-danger-line'), 'danger-ink': v('c-danger-ink'),
          'info-bg': v('c-info-bg'), 'info-line': v('c-info-line'), 'info-ink': v('c-info-ink'),
          'ok-bg': v('c-ok-bg'), 'ok-line': v('c-ok-line'), 'ok-ink': v('c-ok-ink'),
        },
        s: {
          free: v('s-free'), play: v('s-play'), over: v('s-over'), card: v('s-card'),
          pause: v('s-pause'), ooo: v('s-ooo'), noprice: v('s-noprice'),
          'card-edge': v('s-card-edge'), 'pill-bg': v('s-pill-bg'),
        },
        o: {
          page: v('o-page'), card: v('o-card'), line: v('o-line'), 'line-2': v('o-line-2'), soft: v('o-soft'),
          ink: v('o-ink'), 'ink-2': v('o-ink-2'),
          green: v('o-green'), 'green-hover': v('o-green-hover'), 'green-tint': v('o-green-tint'), 'green-ink': v('o-green-ink'),
          sidebar: v('o-sidebar'), 'sidebar-active': v('o-sidebar-active'), 'sidebar-text': v('o-sidebar-text'),
          'amber-ink': v('o-amber-ink'), 'amber-ink-2': v('o-amber-ink-2'), 'amber-tint': v('o-amber-tint'), 'amber-line': v('o-amber-line'),
          blue: v('o-blue'), 'blue-tint': v('o-blue-tint'), 'blue-line': v('o-blue-line'), 'blue-ink': v('o-blue-ink'),
          red: v('o-red'), 'red-tint': v('o-red-tint'), chart: v('o-chart'),
          // added in P01 (see tokens.css)
          'red-line': v('o-red-line'), track: v('o-track'), stripe: v('o-stripe'), divider: v('o-divider'),
          'on-green': v('o-on-green'), 'grey-tint': v('o-grey-tint'),
        },
        // tile text and buttons that components write with a class (the drawings themselves are in tiles.css)
        tile: { frozen: v('tile-frozen'), btn: v('tile-btn-bg') },
        sl: {
          free: v('sl-free'), play: v('sl-play'), pause: v('sl-pause'), ooo: v('sl-ooo'),
          // the same hues darkened for text on a tint (P01 answers)
          'free-ink': v('sl-free-ink'), 'pause-ink': v('sl-pause-ink'), 'ooo-ink': v('sl-ooo-ink'),
        },
      },
      borderRadius: {
        tile: v('r-tile'), dialog: v('r-dialog'), card: v('r-card'),
        btn: v('r-btn'), 'btn-sm': v('r-btn-sm'), input: v('r-input'),
      },
      boxShadow: {
        'dialog-dark': v('shadow-dialog-dark'),
        'dialog-light': v('shadow-dialog-light'),
        tile: v('shadow-tile'),
        dot: v('shadow-dot'), redcard: v('shadow-redcard'), thumb: v('shadow-thumb'),
      },
      minHeight: {
        touch: v('touch-counter'), 'touch-main': v('touch-counter-main'),
        key: v('touch-key'), 'touch-owner': v('touch-owner'),
      },
      minWidth: { touch: v('touch-counter'), 'touch-owner': v('touch-owner') },
      // added in P01: square icon buttons need an exact height and width from the same tokens
      height: {
        touch: v('touch-counter'), 'touch-main': v('touch-counter-main'),
        key: v('touch-key'), 'touch-owner': v('touch-owner'),
      },
      width: {
        touch: v('touch-counter'), 'touch-main': v('touch-counter-main'),
        key: v('touch-key'), 'touch-owner': v('touch-owner'),
      },
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
