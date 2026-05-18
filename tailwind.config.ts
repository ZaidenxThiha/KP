import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Indigo accent — admin & officer screens.
        accent: {
          DEFAULT: '#4f46e5',
          fg: '#ffffff',
        },
        // Blue brand — player screens.
        brand: {
          DEFAULT: '#1d4ed8',
          dark: '#1e40af',
          fg: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};

export default config;
