/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: '#818CF8',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        success: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
        error: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
