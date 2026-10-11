import type { Config } from 'tailwindcss';
import preset from './tailwind.preset';

export default {
  presets: [preset],
  content: ['./counter.html', './owner.html', './src/**/*.{ts,tsx}'],
} satisfies Config;
