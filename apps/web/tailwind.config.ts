import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        beamup: {
          50:  '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
  // Avoid MUI conflicts
  corePlugins: {
    preflight: false,
  },
};

export default config;
