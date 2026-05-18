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
        // Teal brand — player screens.
        brand: {
          DEFAULT: '#0d6b5e',
          dark: '#0a5347',
          fg: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};

export default config;
