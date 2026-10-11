import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const forbidOwnerInCounter = {
  patterns: [
    {
      group: [
        '@/owner',
        '@/owner/**',
        '**/owner',
        '**/owner/**',
        '@/mocks/owner-*',
        '**/mocks/owner-*',
      ],
      message: 'The counter app must not import owner code (CLAUDE.md, golden rule 2).',
    },
  ],
};

const forbidCounterInOwner = {
  patterns: [
    {
      group: [
        '@/counter',
        '@/counter/**',
        '**/counter',
        '**/counter/**',
        '@/mocks/counter-*',
        '**/mocks/counter-*',
      ],
      message: 'The owner app must not import counter code (CLAUDE.md, golden rule 2).',
    },
  ],
};

const forbidAppsInShared = {
  patterns: [
    {
      group: ['@/counter', '@/counter/**', '@/owner', '@/owner/**', '**/counter/**', '**/owner/**'],
      message: 'Shared code (ui, tiles, lib, dev) must not import from either app.',
    },
  ],
};

const noRawClock = [
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Use clock.now() or useNow() from @/lib/clock, not Date.now() (CLAUDE.md, rule 7).',
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Use clock.now() or useNow() from @/lib/clock, not new Date() (CLAUDE.md, rule 7).',
  },
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/blob-report/**',
      'apps/web/public/**',
      'design/**',
      'docs/**',
      'mock/**',
      'prompts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Browser code: the web app source
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['apps/web/src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },

  // Node code: scripts and tool configs
  {
    files: [
      '**/*.mjs',
      '**/*.config.{js,ts}',
      'apps/web/vite/**/*.ts',
      'apps/web/tests/**/*.ts',
      'scripts/**/*.mjs',
    ],
    languageOptions: { globals: { ...globals.node } },
  },

  // Golden rule 2: keep the two apps apart
  {
    files: ['apps/web/src/counter/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', forbidOwnerInCounter] },
  },
  {
    files: ['apps/web/src/owner/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', forbidCounterInOwner] },
  },
  {
    files: ['apps/web/src/{ui,tiles,lib,dev}/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', forbidAppsInShared] },
  },

  // Golden rule 7: time comes from the clock (src/lib is where the clock itself lives)
  {
    files: ['apps/web/src/{counter,owner,ui,dev}/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...noRawClock] },
  },
);
